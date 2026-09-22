# Wiki pilot: create a non-app user with access

## Draft

`createNonAppUserWithAccess` is a Firebase callable API in the `building` /
`building_unit_nonAppUser` area. The retrieved contract identifies
`OSKCreateNonAppUserWithAccessRequest` as its request type and a successful
`OSKCreateNonAppUserwithAccessResponse` as its response, with a resolved
handler at `OSKBuildingUnitNonAppUserService.createNonAppUserWithAccess`
([contract `80c8ad28d03fe952da108853a6667048aea13641`](07-building-operation-wiki-pilot-evidence-2026-09-22.md)).

One direct, resolved HTTP graph edge records a caller in the Swift Cloud Kit
repository, `building-createNonAppUserWithAccess`, into this Firebase
operation (edge `53640`). This establishes an observed cross-repository API
relationship in the database snapshot; it does not establish who initiates
the request or its business purpose.

The service method is asynchronous and returns the named success response
([`cb5655f1cbc39173e2c4fa8904a17856a3ba99ee`](07-building-operation-wiki-pilot-evidence-2026-09-22.md)).
Retrieved call evidence shows it invokes `OSKUserSecurityChecks` and then a
parameter check. That check names a context object, `buildingId`, `unitId`,
`fullName`, and `inviterId` as string inputs, plus optional `doorIds` as an
array ([`c9cb78c24940c0b611a14f791a76f2e322ba4732`](07-building-operation-wiki-pilot-evidence-2026-09-22.md),
[`22156263a374fcce3d74e6c09f06c2c2fba44ba6`](07-building-operation-wiki-pilot-evidence-2026-09-22.md)).
This supports saying that validation/security-related calls occur; it does not
prove which authority rule is enforced or who is authorized.

The structural call trail then resolves a unit from `buildingId` and `unitId`,
generates an identifier, creates a non-app-user record with those identifiers,
and calls `_createNonAppUserAccess` with the new user ID, building/unit IDs,
inviter ID, a literal permanent/non-one-time validity object, and any door IDs
([`135bb55f8f89f17d69fde84e93fe28fad7b1fdd1`](07-building-operation-wiki-pilot-evidence-2026-09-22.md),
[`ea88677be932b3c885c3801418f0b1e3d7c7b3d7`](07-building-operation-wiki-pilot-evidence-2026-09-22.md),
[`e1af68a3a0aaf78662df5115952cc02e830ab150`](07-building-operation-wiki-pilot-evidence-2026-09-22.md),
[`52b475756148816ba2cca3da396566a5fdaffc62`](07-building-operation-wiki-pilot-evidence-2026-09-22.md)).
After that access call, the service retrieves a non-app-user pincode record
using the building ID, unit ID, new user ID, and pincode ID
([`aa0445f4747d672fe39fb58506a13d902fe06b20`](07-building-operation-wiki-pilot-evidence-2026-09-22.md)).
That is evidence of a collaborator sequence, not proof of the underlying
storage transaction or its atomicity.

The response model exposes `nonAppUserId`, `accessId`, `pincode`, and
`fullName` as string properties ([response facts](07-building-operation-wiki-pilot-evidence-2026-09-22.md)).
The retrieved facts do not establish the exact response envelope contents,
whether the pincode is newly generated or merely returned, transactional/error
semantics, the definition of “non-app user,” or the business rationale for
permanent validity. Those are semantic questions, not evidence that the
snapshot graph is incomplete.

## Pilot assessment

For this one operation, Postgres supports a readable, traceable explanation of
the entry point, a known external caller, typed contract names, validation and
security calls, the primary collaborator sequence, and selected response
fields. Fact references and source locations make each statement auditable.

The draft remains incomplete in two distinct ways. Under the authorized
full-sync assumption, unobserved relationships in this historical snapshot
are expected to become near-complete and should not be treated as a rejection
of the architecture; none were invented here. Separately, structured code
evidence still cannot answer why this operation exists, the intended authority
model, or the user-facing meaning of its entities. The smallest useful next
comparison is to retrieve narrowly relevant architecture/persona excerpts for
those three semantic questions and check whether they agree with this cited
code evidence.
