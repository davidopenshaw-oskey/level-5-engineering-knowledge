# Evidence appendix: `createNonAppUserWithAccess` context enrichment

All database facts below are retrieved implementation evidence from
`firebase-oskey-dev`, current run `20260911_080454-00e1d9fd`, commit
`00e1d9fd568fab1bdcd1ad81e76b40d6b38ad4a3`, extracted 2026-09-11 08:06:19
UTC. The supporting read-only query is `building-operation-context-evidence.sql`.

<a id="e1"></a>
## E1 — Callable contract

Fact `80c8ad28d03fe952da108853a6667048aea13641`; repository
`firebase-oskey-dev`; `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts:57`; kind `api_contract`.
It identifies a callable request and success-response type and a resolved
service handler. Provenance is the run and commit above.

<a id="e2"></a>
## E2 — Observed external caller

Edge `53640` is an AST-derived, resolved `HTTP_API_CALL` from
`swift-cloud-kit-oskey-dev` symbol `building-createNonAppUserWithAccess` to
the E1 fact reference. Its target location is the E1 path/line; it was
generated 2026-09-21 17:29:15 UTC. This is retrieved relationship evidence,
not a statement of actor or business purpose.

<a id="e3"></a>
## E3 — Security call

Fact `c9cb78c24940c0b611a14f791a76f2e322ba4732`; repository
`firebase-oskey-dev`; `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts:250`; kind `call_expression`.
The selected service calls `OSKUserSecurityChecks`. Run/commit provenance is
the shared database provenance above; the fact alone does not specify an
enforced rule.

<a id="e4"></a>
## E4 — Parameter check

Fact `22156263a374fcce3d74e6c09f06c2c2fba44ba6`; repository
`firebase-oskey-dev`; `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts:255`; kind `call_expression`.
Its arguments name context, building ID, unit ID, full name, inviter ID, and
optional door IDs. Run/commit provenance is the shared database provenance.

<a id="e5"></a>
## E5 — Creation/access collaborator sequence

Facts `135bb55f8f89f17d69fde84e93fe28fad7b1fdd1` (`:271`),
`ea88677be932b3c885c3801418f0b1e3d7c7b3d7` (`:276`),
`e1af68a3a0aaf78662df5115952cc02e830ab150` (`:286`), and
`52b475756148816ba2cca3da396566a5fdaffc62` (`:298`); repository
`firebase-oskey-dev`; all in
`functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts`; kind `call_expression`.
They show unit lookup, ID generation, record creation, and a call to
`_createNonAppUserAccess`. The line-298 fact's captured arguments include
`[{ validity: 'permanent', isValidOnce: false }]`. Shared run/commit provenance applies.

<a id="e6"></a>
## E6 — Pincode lookup

Fact `aa0445f4747d672fe39fb58506a13d902fe06b20`; repository
`firebase-oskey-dev`; `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/services/building_unit_nonAppUser.service.ts:311`; kind `call_expression`.
It retrieves a pincode record using building, unit, non-app-user, and pincode
identifiers. Shared run/commit provenance applies.

<a id="e7"></a>
## E7 — Response: non-app-user ID

Fact `2eebe460a8e50fd4a3fc5e042cfd2dc720ba07fb`; repository
`firebase-oskey-dev`; `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts:45`; kind `model_property`.
`OSKCreateNonAppUserwithAccessResponse.nonAppUserId` is `string`. Shared
run/commit provenance applies.

<a id="e8"></a>
## E8 — Response: access ID

Fact `cc101ae38a66ecaced83f081c71a013bc7bb9f02`; repository
`firebase-oskey-dev`; `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts:46`; kind `model_property`.
`OSKCreateNonAppUserwithAccessResponse.accessId` is `string`. Shared
run/commit provenance applies.

<a id="e9"></a>
## E9 — Response: pincode

Fact `53646eab30fd2210530cbcd962f99a95a9539b95`; repository
`firebase-oskey-dev`; `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts:47`; kind `model_property`.
`OSKCreateNonAppUserwithAccessResponse.pincode` is `string`. Shared
run/commit provenance applies.

<a id="e10"></a>
## E10 — Response: full name

Fact `4675ea1c0554a0d785b35e39b722fb0d7f6d40a9`; repository
`firebase-oskey-dev`; `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts:48`; kind `model_property`.
`OSKCreateNonAppUserwithAccessResponse.fullName` is `string`. Shared
run/commit provenance applies.

<a id="d1"></a>
## D1 — Documented non-app-user workflow

[OSkey Backend Services & Data Architecture](../../reference-docs/OSkey%20Backend%20Services%20%26%20Data%20Architecture.md), heading `/buildings/{buildingId}/units/{unitId}/nonAppUsers`,
lines 595–620. It describes non-app users as unit-scoped people without the
mobile app, issued a pincode by a resident admin, and labels this operation a
transactional one-shot that creates a user, provisions access, generates a
PIN, and returns information. This is documented intent/architecture, not a
newly retrieved implementation fact.

<a id="d2"></a>
## D2 — Documented pincode record

[OSkey Backend Services & Data Architecture](../../reference-docs/OSkey%20Backend%20Services%20%26%20Data%20Architecture.md), heading `.../nonAppUsers/{nonAppUserId}/pincodes`,
lines 648–667. It says the pincode document is created within an access-creation
workflow and that this operation reads it after creation to return the PIN.
This supports a documented explanation for the E6 lookup.

<a id="d3"></a>
## D3 — Documented non-app access mechanism

[Oskey Personas and Authority models](../../reference-docs/Oskey%20Personas%20and%20Authority%20models.md), heading `Access Mechanisms & Onboarding Types`,
lines 111–130. It says access mechanisms are not personas but technical onboarding states. It defines a non-app user as not installing the application,
with a unique time-bound or permanent PIN, and says dependent unit inhabitants
may be created by a ResidentAdmin. It presents intended product/authority
context, not proof that this call enforces that model.

<a id="d4"></a>
## D4 — Documented delegated authority

[Oskey Personas and Authority models](../../reference-docs/Oskey%20Personas%20and%20Authority%20models.md), heading `The Extracted Relationship & Authority Models`,
lines 86–101. It states a delegated-authority principle: a lower-level
inhabitant should not receive more access than the ResidentAdmin who created
or invited them. This is documented intended policy, not evidence of the
specific `OSKUserSecurityChecks` rule in E3.

<a id="d5"></a>
## D5 — Documented permanent-guest limit

[Oskey Personas and Authority models](../../reference-docs/Oskey%20Personas%20and%20Authority%20models.md), heading `Permanent Guest`, lines 70–71. It describes a permanent guest as an app user whose access is explicitly scheduled with a maximum one-year validity. It does not state that this operation creates this persona.
