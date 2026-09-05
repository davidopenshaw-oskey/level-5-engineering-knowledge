Yes. Looking back over the workflow set we have been building, we were not inventing them from a single source. We were synthesising them from several layers of evidence, with your corrections during the conversation acting as an important business-authority layer.

The main source set was:

Source	What we used it for
System Context & Architecture Overview	Domain hierarchy, personas, responsibilities, PGO vs app vs cloud, Organization → Entity → Property → Building → Unit, onboarding concepts, ACD behaviour and general platform boundaries.
Firestore Schema	Actual persistence structure: collections/documents, where organizations, properties, buildings, units, users, onboarding records, invitations, etc. live. This helped stop the workflows becoming purely conceptual.
Firestore Security Rules	Evidence for authorization boundaries, collection paths, organization/building/unit relationships, invitation/onboarding collections and specific permissions such as v1.org.buildings.edit. It also confirms structures such as /organizations/{organizationId}/userInvitations/{email} and /users/{userId}/organizationInvitations/{invitationId}.
RBAC / Roles JSON	The authoritative role/permission vocabulary. This is where things such as v1.admin, v1.org.admin, v1.org.user.create, v1.org.entity.create, v1.org.property.create, v1.org.buildings.create, etc. came from.
Firestore indexes	Supporting structural evidence, especially around inhabitants, onboarding, invitations, building/unit relationships and how those records are queried.
TypeScript types/contracts you supplied during the discussion	More precise evidence for individual workflows. For example, OSKOrganizationUserInvitation showed us that an organization invitation carries identity + organizationId + roles[] + optional property/building scope + sender information.
Your business/domain corrections in this conversation	This was deliberately treated as authoritative business knowledge where the code/schema either didn't express the business meaning or was outdated/ambiguous. For example, who performs a workflow, when it occurs, what "Super User" means operationally, and where one workflow should stop and another begin.

There were also two architecture documents uploaded directly into this project that form part of the broader grounding set: firestore-schema.md and OSkey Cloud & Firestore architecture.md. Those are particularly relevant when we are translating between business workflows and the actual Cloud/Firestore implementation.

One important distinction: the Phase 2 contracts/briefs weren't themselves the business source for these workflows. They informed the methodology we have been following — deterministic evidence first, distinguish confirmed from inferred, don't allow narrative synthesis to silently become fact, use architecture/schema/RBAC as grounding. That's exactly the philosophy described in the Phase 2 material.

So conceptually, our workflow evidence stack has been:

BUSINESS AUTHORITY
    Your domain knowledge / corrections
                ↓
DOMAIN & ARCHITECTURE
    Architecture overview
    Personas / authority model
                ↓
AUTHORIZATION
    RBAC roles
    Firestore security rules
                ↓
DATA MODEL
    Firestore schema
    Firestore indexes
                ↓
IMPLEMENTATION CONTRACTS
    TypeScript types / interfaces / API contracts
                ↓
WORKFLOW SYNTHESIS
    OOA-xxx / PMO-xxx / etc.

And that last point matters for what we're doing: the workflow documents are a synthesis layer, not another source of truth that should override the underlying evidence.