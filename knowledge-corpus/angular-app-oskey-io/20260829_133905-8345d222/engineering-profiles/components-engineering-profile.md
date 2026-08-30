### 0. Generation Metadata

- runId: 20260829_133905-8345d222
- generatedAt: 2026-08-29T15:55:39.362Z
- repoName: angular-app-oskey-io
- targetModule: components
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash

### 1. Executive Summary

The `components` module serves as the shared presentation and global utility layer for the application. It provides reusable, application-wide layout elements—specifically the global navigation header and footer—alongside regulatory compliance utilities such as the cookie consent management system. [Confirmed] The module is responsible for rendering core UI structures, managing local user session navigation states (such as account selection and signing out), and persisting user cookie preferences. [Confirmed]

### 2. Architectural Position

The `components` module occupies a shared, mid-level position within the application's architecture:
- **Parent Scope / Consumers**: It is consumed by the `features` module, which imports and renders the global `OSKHeaderComponent` within its home page layout (`OSKHomeComponent`). [Confirmed]
- **Dependencies**: It relies on the `core` module for foundational types (`OSKCurrentUser`, `OSKUserAccount`), user session tokens (`OSKCurrentUserToken`), and translation pipes (`OSKTranslatePipe`). [Confirmed]
- **Cross-Module Coupling**: It is tightly coupled to the `features` module, directly importing and invoking the authentication service (`OSKAuthService`) to handle user sign-out actions. [Confirmed]

### 3. Primary Responsibilities

#### cookie-consent

- **Displaying Consent Banner**: Renders a modal banner (`OSKCookieConsentBannerComponent`) at the bottom-left of the screen to prompt users for cookie preferences. [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._modalService       .open|showBanner|OSKCookieConsentBannerComponent,{         backdrop: 'static',         animation: true,         modalDialogClass: 'modal-dialog-bottom-left',         size: 'lg',         injector: Injector.create({           providers: [             {               provide: OSKCookieConsent,               useValue: cookieConsent             }           ],           parent: this._injector         })       }|#1` ``]
- **Managing Consent State**: Tracks user choices for strictly necessary, performance, and targeting cookies using a reactive form. [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|this._formBuilder.group|anon|{       // consentToStricklyNecessaryCookies: new UntypedFormControl(true, [Validators.requiredTrue]),       // consentToPerformanceCookies: new UntypedFormControl(this._coockieConsent.consentToPerformanceCookies),       // consentToTargetingCookies: new UntypedFormControl(this._coockieConsent.consentToTargetingCookies),       consentToStricklyNecessaryCookies: new UntypedFormControl(true, [Validators.requiredTrue]),       consentToPerformanceCookies: new UntypedFormControl(false),       consentToTargetingCookies: new UntypedFormControl(false)     }|#1` ``]
- **Cookie Persistence**: Reads and writes the serialized consent configuration to a browser cookie named `cookie_consent` with a 30-day expiration. [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._cookieService.set|_update|'cookie_consent',JSON.stringify(cookieConsent),30|#1` ``]
- **Applying Consent Changes**: Triggers an application reload to apply updated cookie settings when consent is modified. [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|window.location.reload|_apply||#1` ``]

#### footer

- **Footer Layout Rendering**: Renders the visual footer structure using a standalone component configuration [Confirmed] (`` `angular_component|components|hosting/web-app/src/app/components/footer/footer.component.ts|OSKFooterComponent` ``).
- **Dynamic Year Calculation**: Dynamically retrieves the current calendar year to keep copyright information up to date [Confirmed] (`` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|new Date().getFullYear|anon||#1` ``).

---

#### header

### User Session Tracking & Logging
Tracks the current user via `OSKCurrentUserToken` and logs changes using an Angular effect. [Confirmed] (`` `call_expression|components|hosting/web-app/src/app/components/header/header.component.ts|effect|anon|() => {       const u = this.currentUser();       console.log('USER', u);     }|#1` ``)

### Sign Out Handling
Provides a `signOut` method that calls `OSKAuthService.signOut()` and redirects the user to the root path `/`. [Confirmed] (`` `class_method|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|signOut|#1` ``)

### Active Route Tracking
Subscribes to router events to dynamically update the local `currentUrl` signal. [Confirmed] (`` `call_expression|components|hosting/web-app/src/app/components/header/header.component.ts|this.router.events.pipe(takeUntilDestroyed()).subscribe|anon|(event) => {       if (this.initialNavigation && event instanceof NavigationStart) {         this.currentUrl.set(event.url);         this.initialNavigation = false;       }       if (event instanceof NavigationEnd) {         this.currentUrl.set(event.urlAfterRedirects);       }     }|#1` ``)

### Account Selection
Manages local state for available accounts and the currently selected account. [Confirmed] (`` `angular_signal|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|accounts` ``, `` `angular_signal|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|selectedAccount` ``)

---

### 4. Public Interfaces (Components & Services)

#### cookie-consent

- **OSKCookieConsentBannerComponent** (Component)
  - **Class**: `OSKCookieConsentBannerComponent` [Confirmed; `` `angular_component|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|OSKCookieConsentBannerComponent` ``]
  - **Selector**: `osk-cookie-consent-banner` [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|Component|anon|{   selector: 'osk-cookie-consent-banner',   templateUrl: './cookie_consent_banner.component.html',   styleUrls: ['./cookie_consent_banner.component.scss'],   standalone: true,   imports: [ReactiveFormsModule, NgClass] }|#1` ``]
  - **File**: `hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts`
- **OSKCookieConsentService** (Service)
  - **Class**: `OSKCookieConsentService` [Confirmed; `` `angular_injectable|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|OSKCookieConsentService` ``]
  - **Scope**: Root-level singleton (`providedIn: 'root'`) [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|Injectable|anon|{   providedIn: 'root' }|#1` ``]
  - **File**: `hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts`
- **OSKCookieConsent** (Injectable Model)
  - **Class**: `OSKCookieConsent` [Confirmed; `` `angular_injectable|components|hosting/web-app/src/app/components/cookie-consent/models/cookie_consent.model.ts|OSKCookieConsent` ``]
  - **Scope**: Provided dynamically via custom injector when opening the banner modal. [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|Injector.create|showBanner|{           providers: [             {               provide: OSKCookieConsent,               useValue: cookieConsent             }           ],           parent: this._injector         }|#1` ``]
  - **File**: `hosting/web-app/src/app/components/cookie-consent/models/cookie_consent.model.ts`

#### footer

#### Components
- **`OSKFooterComponent`** [Confirmed] (`` `angular_component|components|hosting/web-app/src/app/components/footer/footer.component.ts|OSKFooterComponent` ``)
  - **Selector**: `osk-footer` [Confirmed] (`` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|Component|anon|{   selector: 'osk-footer',   templateUrl: './footer.component.html',   styleUrls: ['./footer.component.scss'],   standalone: true,   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``)
  - **Standalone**: `true` [Confirmed] (`` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|Component|anon|{   selector: 'osk-footer',   templateUrl: './footer.component.html',   styleUrls: ['./footer.component.scss'],   standalone: true,   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``)
  - **Change Detection**: `ChangeDetectionStrategy.OnPush` [Confirmed] (`` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|Component|anon|{   selector: 'osk-footer',   templateUrl: './footer.component.html',   styleUrls: ['./footer.component.scss'],   standalone: true,   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``)

No injectable services are declared or exposed by this capability [Confirmed].

---

#### header

### Components
- **`OSKHeaderComponent`**: Standalone component with selector `osk-header`. [Confirmed] (`` `call_expression|components|hosting/web-app/src/app/components/header/header.component.ts|Component|anon|{   selector: 'osk-header',   standalone: true,   imports: [RouterModule, MatIconModule, MatButtonModule, OSKTranslatePipe, MatMenuModule, NgClass],   templateUrl: './header.component.html',   styleUrl: './header.component.scss',   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``)

### Services
None evidenced in this capability pack. [Confirmed]

---

### 5. UI Composition

#### cookie-consent

The `OSKCookieConsentBannerComponent` renders a modal dialog with the following template bindings:
- **Form Binding**: Binds a form element to a reactive `formGroup` (likely `cookieConsentForm`). [Confirmed; `` `angular_template_binding|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.html|OSKCookieConsentBannerComponent|formGroup|#1` ``]
- **Dynamic Styling**: Applies conditional classes to inputs using `ngClass`. [Confirmed; `` `angular_template_binding|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.html|OSKCookieConsentBannerComponent|ngClass|#1` ``]
- **User Actions**: Captures click events on buttons to handle user choices (e.g., accepting or saving preferences). [Confirmed; `` `angular_template_binding|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.html|OSKCookieConsentBannerComponent|click|#1` ``, `` `angular_template_binding|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.html|OSKCookieConsentBannerComponent|click|#2` ``]

#### footer

The `OSKFooterComponent` references an external template and stylesheet [Confirmed]:
- **Template URL**: `./footer.component.html` (`` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|Component|anon|{   selector: 'osk-footer',   templateUrl: './footer.component.html',   styleUrls: ['./footer.component.scss'],   standalone: true,   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``)
- **Style URLs**: `./footer.component.scss` (`` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|Component|anon|{   selector: 'osk-footer',   templateUrl: './footer.component.html',   styleUrls: ['./footer.component.scss'],   standalone: true,   changeDetection: ChangeDetectionStrategy.OnPush }|#1` ``)

No template composition (child components) or explicit input/output bindings are evidenced in the capability pack [Inferred]. The template likely contains native HTML elements and binds the calculated year value.

---

#### header

`OSKHeaderComponent` renders a template (`header.component.html`) composed of:
- `mat-icon` elements for visual icons. [Confirmed] (`` `angular_template_composition|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|mat-icon|#1` ``)
- `mat-menu` for dropdown menus (e.g., account selection or user options). [Confirmed] (`` `angular_template_composition|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|mat-menu|#1` ``)

### Key Bindings in `header.component.html`
- `routerLink` bindings on anchor and button elements to navigate to different routes. [Confirmed] (`` `angular_template_binding|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|routerLink|#1` ``)
- `matMenuTriggerFor` on a `div` to trigger the Material menu. [Confirmed] (`` `angular_template_binding|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|matMenuTriggerFor|#1` ``)
- `color` input on `mat-icon`. [Confirmed] (`` `angular_template_binding|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|color|#1` ``)
- `text-primary` input binding on a `span`. [Confirmed] (`` `angular_template_binding|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|text-primary|#1` ``)
- `click` event binding on a `button` (likely triggering sign out or account switching). [Confirmed] (`` `angular_template_binding|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|click|#1` ``)

---

### 6. API Contracts & Routes

#### cookie-consent

- **Backend Calls**: None. There are no Firebase callable functions or external API endpoints invoked by this capability. [Confirmed]
- **Routes**: None. This capability does not define or register any Angular routes. [Confirmed]

#### footer

- **Backend Calls**: None evidenced.
- **Routes**: This capability does not define any Angular routes [Confirmed].

---

#### header

- **Backend calls**: None evidenced. [Confirmed]
- **Routes**: None defined in this capability. [Confirmed]

---

### 7. State Ownership

**Ownership conclusion:**

State ownership within the `components` module is strictly localized and isolated within individual components; there is no shared, cross-capability state or state-management service within this module. [Confirmed] 

- **Reactive UI State**: The `OSKHeaderComponent` owns local reactive state via Angular Signals to track the active URL (`currentUrl`), the list of available user accounts (`accounts`), and the currently selected account (`selectedAccount`). [Confirmed]
- **Compliance State**: The `cookie-consent` capability manages its state locally using reactive form controls during user interaction, and delegates long-term persistence to browser-level cookies under the key `cookie_consent`. [Confirmed]

**Per-capability evidence:**

#### cookie-consent

This capability does not use Angular Signals (`angular_signal` facts are absent). Instead, state is managed via:
- **In-Memory Form State**: Managed locally in `OSKCookieConsentBannerComponent` using a reactive `FormGroup` containing controls for strictly necessary, performance, and targeting cookies. [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|this._formBuilder.group|anon|{       // consentToStricklyNecessaryCookies: new UntypedFormControl(true, [Validators.requiredTrue]),       // consentToPerformanceCookies: new UntypedFormControl(this._coockieConsent.consentToPerformanceCookies),       // consentToTargetingCookies: new UntypedFormControl(this._coockieConsent.consentToTargetingCookies),       consentToStricklyNecessaryCookies: new UntypedFormControl(true, [Validators.requiredTrue]),       consentToPerformanceCookies: new UntypedFormControl(false),       consentToTargetingCookies: new UntypedFormControl(false)     }|#1` ``]
- **Persistent State**: Stored in the browser's cookies under the key `cookie_consent`. [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._cookieService.set|_update|'cookie_consent',JSON.stringify(cookieConsent),30|#1` ``]

#### footer

No Angular Signals (`angular_signal` facts) are declared in this capability [Confirmed]. The component likely maintains the current year as a standard class property or evaluates it inline.

---

#### header

`OSKHeaderComponent` owns the following local reactive state:
- **`selectedAccount`**: Signal initialized to `undefined`. [Confirmed] (`` `angular_signal|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|selectedAccount` ``)
- **`accounts`**: Signal initialized to an empty array `[]`. [Confirmed] (`` `angular_signal|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|accounts` ``)
- **`currentUrl`**: Signal initialized to `'/'`. [Confirmed] (`` `angular_signal|components|hosting/web-app/src/app/components/header/header.component.ts|OSKHeaderComponent|currentUrl` ``)

---

### 8. Outbound Coupling

#### cookie-consent

### Import-Based Coupling
- **External Libraries**:
  - `@ng-bootstrap/ng-bootstrap`: Used for displaying the banner as a modal. [Confirmed; `` `imports_dependency|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|@ng-bootstrap/ng-bootstrap|#1` ``, `` `imports_dependency|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|@ng-bootstrap/ng-bootstrap|#1` ``]
  - `ngx-cookie-service`: Used to read and write cookie data. [Confirmed; `` `imports_dependency|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|ngx-cookie-service|#1` ``]
- **Angular Framework**:
  - `@angular/forms`: Used for reactive form controls. [Confirmed; `` `imports_dependency|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|@angular/forms|#1` ``]
  - `@angular/common` and `@angular/core`. [Confirmed; `` `imports_dependency|components|hosting/web-app/src/app/components/cookie-consent/cookie_consent_banner.component.ts|@angular/common|#1` ``]

### Template-Composition Coupling
- None. The component does not embed other custom components in its template. [Confirmed]

#### footer

#### Import-Based Coupling
- **`@angular/core`**: Imported by `OSKFooterComponent` to access core decorator and change detection tokens [Confirmed] (`` `imports_dependency|components|hosting/web-app/src/app/components/footer/footer.component.ts|@angular/core|#1` ``).

#### Template-Composition Coupling
- None evidenced.

---

#### header

### Import-based coupling
- **`features` module (`authentication` submodule)**: Imports `OSKAuthService` from `../../features/authentication/services/auth.service`. [Confirmed] (`` `imports_dependency|components|hosting/web-app/src/app/components/header/header.component.ts|../../features/authentication/services/auth.service|#1` ``)
- **`core` module**: Imports from `@oskey/core`. [Confirmed] (`` `imports_dependency|components|hosting/web-app/src/app/components/header/header.component.ts|@oskey/core|#1` ``)
- **`core` module (`types` submodule)**: Imports from `@oskey/core/types`. [Confirmed] (`` `imports_dependency|components|hosting/web-app/src/app/components/header/header.component.ts|@oskey/core/types|#1` ``)
- **`core` module (`translate` submodule)**: Imports from `@oskey/translate`. [Confirmed] (`` `imports_dependency|components|hosting/web-app/src/app/components/header/header.component.ts|@oskey/translate|#1` ``)

### Template-composition coupling
No custom components from other modules are directly composed in the template; it relies on Angular Material components (`mat-icon`, `mat-menu`). [Confirmed] (`` `angular_template_composition|components|hosting/web-app/src/app/components/header/header.component.html|OSKHeaderComponent|mat-icon|#1` ``)

---

### 9. Internal Structure

Based on the deterministic Intra-Module Coupling Graph, the `components` module has a completely flat internal structure with zero submodule-to-submodule dependencies (`submoduleCount: 0`). [Confirmed] The three capabilities—`cookie-consent`, `footer`, and `header`—exist as independent directories and classes that do not import or interact with one another. [Confirmed]

### 10. Cross-Module Relationships

The `components` module maintains the following verified relationships with other modules in the repository:

#### Outbound Dependencies
- **Dependency on `core`**: [Confirmed]
  - `OSKHeaderComponent` imports `OSKCurrentUser` and `OSKUserAccount` from `@oskey/core/types`.
  - `OSKHeaderComponent` injects `OSKCurrentUserToken` from `@oskey/core`.
  - `OSKHeaderComponent` imports and utilizes `OSKTranslatePipe` from `@oskey/translate`.
- **Dependency on `features`**: [Confirmed]
  - `OSKHeaderComponent` imports `OSKAuthService` from `../../features/authentication/services/auth.service`.
  - **Confirmed Call Edge**: `OSKHeaderComponent` invokes `OSKAuthService.signOut` (at `header.component.ts:77`) to terminate the user session.

#### Inbound Dependencies
- **Dependency from `features`**: [Confirmed]
  - `OSKHomeComponent` (within the `features` module) imports and composes `OSKHeaderComponent` (from `components`) inside its template.

### 11. Permissions & Security

**Cross-cutting risk callouts:**

- **Role-Based Access Control (RBAC)**: No direct role-based permission checks, guards, or permission strings are defined or executed within this module. [Confirmed]
- **Security Context Integration**: The module integrates with the application's security context by injecting `OSKCurrentUserToken` in the `OSKHeaderComponent` to access the active user's session data, and by delegating session termination to the `features` module's `OSKAuthService`. [Confirmed]

**Per-capability evidence:**

#### cookie-consent

- No route guards or role-based permission checks are defined or used in this capability. [Confirmed]

#### footer

No guards, authorization checks, or permission strings are evidenced within this capability [Confirmed].

---

#### header

- No guards or specific permission strings are directly evidenced in this capability. [Confirmed]
- It injects `OSKCurrentUserToken` (likely containing user/role details) and `OSKAuthService` to handle authentication actions like signing out. [Confirmed] (`` `call_expression|components|hosting/web-app/src/app/components/header/header.component.ts|inject|anon|OSKCurrentUserToken|#1` ``, `` `call_expression|components|hosting/web-app/src/app/components/header/header.component.ts|inject|anon|OSKAuthService|#1` ``)

---

### 12. External Hooks

#### cookie-consent

- **ngx-cookie-service**: Interacts with the browser's cookie storage to check, retrieve, and set the `cookie_consent` cookie. [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._cookieService.check|_load|'cookie_consent'|#1` ``, `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._cookieService.get|_load|'cookie_consent'|#1` ``, `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|this._cookieService.set|_update|'cookie_consent',JSON.stringify(cookieConsent),30|#1` ``]
- **Browser Window Location**: Directly reloads the page using `window.location.reload()` to apply cookie changes. [Confirmed; `` `call_expression|components|hosting/web-app/src/app/components/cookie-consent/services/cookie_consent.service.ts|window.location.reload|_apply||#1` ``]

#### footer

- **Native JavaScript Date API**: The component calls `new Date().getFullYear()` to obtain the current year [Confirmed] (`` `call_expression|components|hosting/web-app/src/app/components/footer/footer.component.ts|new Date().getFullYear|anon||#1` ``).
- No external SDKs (such as Firebase or `@ngx-translate`) are evidenced in this capability pack [Confirmed].

---

#### header

- **Angular Material**: Uses `@angular/material/button`, `@angular/material/icon`, and `@angular/material/menu`. [Confirmed] (`` `imports_dependency|components|hosting/web-app/src/app/components/header/header.component.ts|@angular/material/button|#1` ``)
- **Translation**: Uses `@oskey/translate` (specifically `OSKTranslatePipe` in imports). [Confirmed] (`` `imports_dependency|components|hosting/web-app/src/app/components/header/header.component.ts|@oskey/translate|#1` ``)

---

### 13. Architectural Observations

- **Bidirectional Cross-Module Coupling**: There is a circular dependency pattern at the module level between `components` and `features`. The `features` module depends on `components` to render the global header (`OSKHeaderComponent` inside `OSKHomeComponent`), while the `components` module depends on `features` to handle authentication actions (`OSKHeaderComponent` calling `OSKAuthService.signOut`). [Confirmed]
- **High Internal Isolation**: The module's internal capabilities are completely decoupled from one another, ensuring that changes to layout elements (like the footer) or compliance features (like cookie consent) have zero side effects on other components within the same module. [Confirmed]
- **Hybrid State Paradigms**: The module demonstrates a transition in state management patterns, utilizing modern Angular Signals for reactive UI state in the header, while relying on traditional reactive forms and direct cookie manipulation for the cookie consent banner. [Inferred]

### 14. Risks & Open Questions

**Cross-cutting risks:**

- **Architectural Circularity Risk**: The bidirectional dependency loop between `components` and `features` violates strict layered architecture principles. This tight coupling makes it difficult to compile, test, or lazy-load either module in isolation. [Inferred]
- **Unattributed Lifecycle Triggers**: It is unknown how and where the `OSKCookieConsentService.showBanner()` method is initially invoked, as there is no evidence of its initialization trigger within the module's capabilities. [Confirmed]
- **Local State Siloing**: The `OSKHeaderComponent` manages the `selectedAccount` and `accounts` signals locally. If other features or services across the application need to react to account switches, this localized ownership introduces a risk of state desynchronization. [Inferred]

**Per-capability open questions:**

#### cookie-consent

- **Initialization Trigger**: It is unclear from the evidence how and where `OSKCookieConsentService.showBanner()` is initially triggered (e.g., during application startup or inside a root component).
- **Model Properties**: The exact structure and fields of the `OSKCookieConsent` model class are not fully detailed in the facts, though the form initialization suggests boolean flags for performance and targeting cookies.

#### footer

- **Template Contents**: The exact HTML structure and text content of `./footer.component.html` are not available in the evidence pack. It is unknown if the footer contains external links, social media icons, or other static elements.
- **Localization**: It is unknown if the footer text is localized or if it relies on hardcoded strings, as no translation service imports are present in the component file.

#### header

- What is the structure of the user object returned by `OSKCurrentUserToken`? (No model properties or schemas are resolved in this pack).
- What accounts are populated in the `accounts` signal, and how are they retrieved? (The current evidence only shows initialization to `[]`).

### 15. Evidence References

Evidence references are preserved inline within each capability's assembled sections above (Sections 3, 4, 5, 6, 7, 8, 11, and 12) -- this section is generated deterministically, not re-derived by an LLM, to avoid fabricating a citation index from content the connective-tissue step was never given.