### 0. Generation Metadata

- runId: 20260829_081559-00e1d9fd
- generatedAt: 2026-08-29T13:39:01.889Z
- repoName: firebase-oskey-dev
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- moduleCount: 12
- note: sections 2, 4, and 5 below are assembled deterministically from Phase 1 artifacts, not LLM-generated.

### 1. Executive Summary

*   **Analysis**: Comparing the RBAC Requirements Catalog against `rbac-roles.json` reveals that 21 permission strings actively referenced in code or settings are completely missing from the authoritative schema [Confirmed]. This includes critical administrative roles like `v1.admin` (referenced in `admin`, `organization`, `settings`), `v1.org.admin` (referenced in `organization`, `settings`, `user`), and 15 different domain-specific `.admin` composite roles [Confirmed].
*   **Impact**: This drift makes it impossible to statically audit or properly assign these roles via standard administrative tools [Inferred]. If the system falls back to unsafe defaults when evaluating an undefined role, it poses a severe risk of privilege escalation or authorization bypass [Inferred]. Furthermore, as flagged in `admin`'s Cross-Cutting Risks, the use of the broad, undocumented `v1.admin` permission string in `admin_maintenance` allows unchecked access to destructive database migrations and global configuration overrides [Inferred].

### 2. Module Inventory

- **access_control_device** — 1 capability pack(s)
- **admin** — 5 capability pack(s)
- **apps** — 4 capability pack(s)
- **building** — 11 capability pack(s)
- **call** — 1 capability pack(s)
- **core** — 6 capability pack(s)
- **organization** — 14 capability pack(s)
- **settings** — 4 capability pack(s)
- **supplier** — 2 capability pack(s)
- **tasks** — 1 capability pack(s)
- **unit_management** — 1 capability pack(s)
- **user** — 11 capability pack(s)

### 3. Major Subsystems

*   **Analysis**: There is a stark contrast in how security is enforced across different modules [Inferred]. Administrative modules like `settings` and `organization` enforce strict, granular RBAC permissions (e.g., `v1.org.settings.edit`) [Confirmed]. However, highly sensitive credential-management and access-provisioning submodules in `building` (e.g., `building_pincode`, `building_unit_nonAppUser`) and `user` (e.g., `user_access`, `user_device`, `user_pincode`) do not enforce explicit RBAC strings in code, relying instead on generic user-scoped identity checks (`@OSKUserSecurityChecks`) [Confirmed].
*   **Impact**: If Firestore Security Rules are misconfigured or bypassed, or if an administrative support tool calls these services directly, there are no application-layer RBAC guards to prevent unauthorized manipulation of physical door PINs or SecureBLE tokens [Inferred]. This is compounded by the fact that `admin_maintenance` performs direct, unvalidated writes to collections owned by `user` and `building`, bypassing their internal validation hooks entirely [Confirmed].

### 4. Module Dependency Overview

- `organization` → `core`: 396 confirmed call edge(s)
- `user` → `core`: 330 confirmed call edge(s)
- `building` → `core`: 253 confirmed call edge(s)
- `admin` → `core`: 194 confirmed call edge(s)
- `organization` → `building`: 73 confirmed call edge(s)
- `apps` → `core`: 62 confirmed call edge(s)
- `supplier` → `core`: 61 confirmed call edge(s)
- `access_control_device` → `core`: 60 confirmed call edge(s)
- `organization` → `settings`: 58 confirmed call edge(s)
- `unit_management` → `core`: 58 confirmed call edge(s)
- `admin` → `building`: 51 confirmed call edge(s)
- `organization` → `user`: 50 confirmed call edge(s)
- `core` → `building`: 47 confirmed call edge(s)
- `core` → `user`: 47 confirmed call edge(s)
- `settings` → `core`: 37 confirmed call edge(s)
- `admin` → `user`: 35 confirmed call edge(s)
- `building` → `user`: 34 confirmed call edge(s)
- `user` → `building`: 34 confirmed call edge(s)
- `supplier` → `organization`: 33 confirmed call edge(s)
- `unit_management` → `building`: 32 confirmed call edge(s)
- `building` → `organization`: 26 confirmed call edge(s)
- `admin` → `settings`: 23 confirmed call edge(s)
- `user` → `organization`: 22 confirmed call edge(s)
- `call` → `core`: 21 confirmed call edge(s)
- `building` → `settings`: 20 confirmed call edge(s)
- `unit_management` → `user`: 19 confirmed call edge(s)
- `supplier` → `settings`: 17 confirmed call edge(s)
- `admin` → `organization`: 15 confirmed call edge(s)
- `tasks` → `core`: 14 confirmed call edge(s)
- `organization` → `tasks`: 10 confirmed call edge(s)
- `supplier` → `building`: 10 confirmed call edge(s)
- `user` → `settings`: 9 confirmed call edge(s)
- `core` → `supplier`: 8 confirmed call edge(s)
- `user` → `apps`: 7 confirmed call edge(s)
- `call` → `user`: 6 confirmed call edge(s)
- `organization` → `access_control_device`: 6 confirmed call edge(s)
- `building` → `access_control_device`: 5 confirmed call edge(s)
- `organization` → `apps`: 5 confirmed call edge(s)
- `apps` → `user`: 4 confirmed call edge(s)
- `core` → `access_control_device`: 4 confirmed call edge(s)
- `access_control_device` → `building`: 3 confirmed call edge(s)
- `call` → `access_control_device`: 3 confirmed call edge(s)
- `call` → `building`: 3 confirmed call edge(s)
- `core` → `settings`: 3 confirmed call edge(s)
- `user` → `unit_management`: 3 confirmed call edge(s)
- `admin` → `access_control_device`: 2 confirmed call edge(s)
- `core` → `organization`: 2 confirmed call edge(s)
- `tasks` → `organization`: 2 confirmed call edge(s)
- `access_control_device` → `user`: 1 confirmed call edge(s)
- `access_control_device` → `organization`: 1 confirmed call edge(s)
- `admin` → `tasks`: 1 confirmed call edge(s)
- `organization` → `unit_management`: 1 confirmed call edge(s)
- `tasks` → `admin`: 1 confirmed call edge(s)

### 5. RBAC Requirements Catalog

- `v1.org.buildings.create` (candidate, 16 check-site(s), referenced by: building, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.org.validate` (candidate, 11 check-site(s), referenced by: admin, organization, settings) — **exists** in rbac-roles.json
- `v1.org.suppliers.view` (candidate, 11 check-site(s), referenced by: settings, supplier) — **exists** in rbac-roles.json
- `v1.admin.user.accesses.delete` (candidate, 9 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.accesses.create` (candidate, 7 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.org.buildings.edit` (candidate, 7 check-site(s), referenced by: building, settings) — **exists** in rbac-roles.json
- `v1.org.buildings.view` (candidate, 7 check-site(s), referenced by: building, organization, settings) — **exists** in rbac-roles.json
- `v1.org.user.create` (candidate, 7 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin.org.edit` (candidate, 6 check-site(s), referenced by: admin, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.org.register` (candidate, 6 check-site(s), referenced by: admin, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.user.devices.delete` (candidate, 6 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.org.communications.list` (candidate, 6 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.edit` (candidate, 6 check-site(s), referenced by: core, organization, settings) — **exists** in rbac-roles.json
- `v1.org.settings.create` (confirmed, 6 check-site(s), referenced by: building, settings, user) — **exists** in rbac-roles.json
- `v1.org.settings.delete` (confirmed, 6 check-site(s), referenced by: building, settings, user) — **exists** in rbac-roles.json
- `v1.org.settings.view` (confirmed, 6 check-site(s), referenced by: building, settings, user) — **exists** in rbac-roles.json
- `v1.org.suppliers.edit` (candidate, 6 check-site(s), referenced by: settings, supplier) — **exists** in rbac-roles.json
- `v1.org.user.view` (candidate, 6 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin` (candidate, 5 check-site(s), referenced by: admin, organization, settings) — **MISSING from rbac-roles.json**
- `v1.admin.org.delete` (candidate, 5 check-site(s), referenced by: admin, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.org.view` (candidate, 5 check-site(s), referenced by: admin, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.user.edit` (candidate, 5 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.org.admin` (candidate, 5 check-site(s), referenced by: organization, settings, user) — **MISSING from rbac-roles.json**
- `v1.org.entity.create` (candidate, 5 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.create` (candidate, 5 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.onboardingNotification` (candidate, 5 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.settings.edit` (confirmed, 5 check-site(s), referenced by: building, settings, user) — **exists** in rbac-roles.json
- `v1.org.user.edit` (candidate, 5 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin.building.register` (candidate, 4 check-site(s), referenced by: building, organization, settings) — **exists** in rbac-roles.json
- `v1.admin.user.accesses.view` (candidate, 4 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.delete` (candidate, 4 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.invitations.delete` (candidate, 4 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.view` (candidate, 4 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.org.communications.create` (candidate, 4 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.property.create` (candidate, 4 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.property.edit` (candidate, 4 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.view` (candidate, 4 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.suppliers.create` (candidate, 4 check-site(s), referenced by: settings, supplier) — **exists** in rbac-roles.json
- `v1.org.suppliers.delete` (candidate, 4 check-site(s), referenced by: settings, supplier) — **exists** in rbac-roles.json
- `v1.org.view` (candidate, 4 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin.accessControlDevice.edit` (candidate, 3 check-site(s), referenced by: building, settings) — **exists** in rbac-roles.json
- `v1.admin.building.admin` (candidate, 3 check-site(s), referenced by: organization, settings) — **MISSING from rbac-roles.json**
- `v1.admin.org.admin` (candidate, 3 check-site(s), referenced by: organization, settings) — **MISSING from rbac-roles.json**
- `v1.admin.user.devices.edit` (candidate, 3 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.devices.view` (candidate, 3 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.admin.user.invitations.view` (candidate, 3 check-site(s), referenced by: admin, settings) — **exists** in rbac-roles.json
- `v1.org.communications.delete` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.communications.view` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.entity.delete` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.entity.edit` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.entity.view` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.property.view` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.delete` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.edit` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.org.residents.list` (candidate, 3 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin.accessControlDevice.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.accessControlDevice.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.accessControlDevice.register` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.accessControlDevice.view` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.building.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.building.edit` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.building.validate` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.building.view` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.settings.role.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.settings.role.create` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.role.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.role.edit` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.role.view` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.workflow.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.settings.workflow.create` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.workflow.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.workflow.edit` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.workflow.view` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.user.accesses.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.user.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.user.devices.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.admin.user.invitations.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.buildings.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.buildings.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.communications.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.communications.edit` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.entity.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.property.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.property.delete` (candidate, 2 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.residents.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.settings.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.suppliers.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.user.admin` (candidate, 2 check-site(s), referenced by: settings) — **MISSING from rbac-roles.json**
- `v1.org.user.delete` (candidate, 2 check-site(s), referenced by: organization, settings) — **exists** in rbac-roles.json
- `v1.admin.accessControlDevice.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.building.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.org.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.role.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.settings.workflow.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.user.accesses.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.user.devices.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.user.invitations.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.admin.user.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org` (candidate, 1 check-site(s), referenced by: organization) — **MISSING from rbac-roles.json**
- `v1.org.buildings.createManager` (candidate, 1 check-site(s), referenced by: building) — **MISSING from rbac-roles.json**
- `v1.org.buildings.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.entity.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.property.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.settings.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.suppliers.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json
- `v1.org.user.list` (candidate, 1 check-site(s), referenced by: settings) — **exists** in rbac-roles.json

### 6. Cross-Cutting Patterns

*   **Analysis**: Comparing the communication and identity layers reveals a dangerous self-healing mechanism [Inferred]. As flagged in `apps`'s Cross-Cutting Risks, the `notification` service aggressively deletes user tokens via `OSKUserNotificationTokenController.delete` upon any delivery failure from APNS or FCM [Confirmed].
*   **Impact**: If a transient network glitch or temporary gateway outage occurs, valid user tokens will be permanently deleted from the `/users/{id}/notificationTokens` collection [Confirmed]. Because intercom call routing in the `call` module relies on these push notification tokens to alert residents of visitors [Confirmed], this aggressive pruning will lead to silent call-routing failures until the resident manually re-launches the mobile app to re-register their token [Inferred].

### 7. Repo-Wide Risks

*   **Analysis**: The repository exhibits tight bidirectional coupling between core domains, notably `building` ↔ `user` (34 edges in each direction) [Confirmed], `organization` ↔ `tasks` [Confirmed], and `admin` ↔ `tasks` [Confirmed].
*   **Impact**: This circular coupling increases the risk of split-brain states and makes the system highly sensitive to change [Inferred]. For example, as flagged in `tasks`'s Cross-Cutting Risks, changes to task payload models require coordinated updates across both scheduling and executing modules [Inferred]. Similarly, a failure or migration script error in `admin` can directly corrupt or desynchronize collections in `user` and `building` due to direct cross-domain writes [Confirmed].