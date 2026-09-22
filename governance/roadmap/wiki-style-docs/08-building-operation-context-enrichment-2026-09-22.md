# Create a non-app user with access

## Enriched wiki draft

`createNonAppUserWithAccess` is a Firebase callable operation for creating a
unit-scoped person who is granted a non-app access mechanism, rather than a new business persona, without using the OSkey mobile app.
The implementation evidence identifies its callable contract and resolved
service handler [1](08-building-operation-context-evidence-2026-09-22.md#e1).
The documented architecture supplies the missing human meaning: a non-app user
is described as someone without the mobile app who receives a unit pincode,
and this operation is described as a one-shot onboarding workflow [2](08-building-operation-context-evidence-2026-09-22.md#d1).

One resolved HTTP edge shows an observed Swift Cloud Kit caller into this
callable operation [3](08-building-operation-context-evidence-2026-09-22.md#e2).
That confirms an integration relationship in the retrieved snapshot, but not
which person or product workflow initiated a particular request.

The request contract is named `OSKCreateNonAppUserWithAccessRequest`.
Implementation calls validate a context, building ID, unit ID, full name,
inviter ID, and optional door IDs [4](08-building-operation-context-evidence-2026-09-22.md#e4).
It also calls `OSKUserSecurityChecks` [5](08-building-operation-context-evidence-2026-09-22.md#e3).
Separately, the persona document frames non-app access as PIN-only access that
can be time-bound or permanent, and says a ResidentAdmin may create a
dependent non-app user [6](08-building-operation-context-evidence-2026-09-22.md#d3).
The authority document adds the documented authority principle that delegated access does
not exceed that of the creating or inviting ResidentAdmin [7](08-building-operation-context-evidence-2026-09-22.md#d4).

The observed collaborator sequence resolves the unit, generates an ID, creates
the non-app-user record, and calls `_createNonAppUserAccess` [8](08-building-operation-context-evidence-2026-09-22.md#e5).
It then retrieves a pincode record [9](08-building-operation-context-evidence-2026-09-22.md#e6).
The architecture document explains that record as part of access creation and
states that this operation reads it after creation to return the PIN [10](08-building-operation-context-evidence-2026-09-22.md#d2).

The successful response model exposes string fields for the non-app-user ID,
access ID, pincode, and full name [11](08-building-operation-context-evidence-2026-09-22.md#e7)
[12](08-building-operation-context-evidence-2026-09-22.md#e8)
[13](08-building-operation-context-evidence-2026-09-22.md#e9)
[14](08-building-operation-context-evidence-2026-09-22.md#e10).

## Evidence and limitations

Retrieved implementation evidence supports the callable boundary, named input
checks, collaborator calls, and response fields. The documents add intended
persona meaning, PIN-only onboarding context, a documented authority principle,
and an architectural account of the pincode lookup. They do not prove that
this particular call enforces the authority principle, performs a database
transaction, or assigns a particular persona. The sampled implementation does
pass a permanent/non-one-time validity object to its access helper [15](08-building-operation-context-evidence-2026-09-22.md#e5), while the
persona document allows time-bound or permanent non-app PINs and caps a
*permanent guest* at one year [16](08-building-operation-context-evidence-2026-09-22.md#d5). No retrieved evidence maps this operation to
that persona, so this is a scope question rather than an established
contradiction.

Under the authorized full-sync assumption, any relationship not retrieved from
this historical snapshot is not established in this database snapshot; it is
not evidence against the wiki architecture. No broader architecture, source,
or persona investigation was performed.

## Comparison and assessment

| Question / claim | Original Postgres support | Added document support | Remaining uncertainty |
|---|---|---|---|
| What is a non-app user? | Name, contract, and model fields only | PIN-only/no-app, unit-scoped meaning | Which persona this call creates |
| Why this operation exists | Creation/access call sequence | One-shot onboarding purpose | Actual product trigger and actor |
| Who may delegate access? | Security call and inviter input | Delegated-authority intention | Rule evaluated by this operation |
| Why a pincode is returned | Pincode lookup and response field | Creation/read-after-create explanation | Transaction and generation implementation |
| Meaning of permanent validity | Literal helper argument | Time-bound/permanent PIN context | Persona mapping and policy boundary |

The added evidence improved semantic explanation; reorganizing the draft
improved readability and citation traceability. Neither change expands this
single-operation pilot into module-wide coverage.
