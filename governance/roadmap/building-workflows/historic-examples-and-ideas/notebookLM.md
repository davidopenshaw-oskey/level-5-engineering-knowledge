To produce the detailed workflow documents (such as OTM-001, PMO-011, RGA-003, and VAM-003) currently in your sources, we followed a highly structured, strict architectural method called the "Inside-Out" discovery process
. This process is governed by The OSkey Corpus Generation Framework
.
Rather than starting with screens, user stories, or human-designed layouts, this framework forces the logical decomposition of the system starting from the data layer up to the workflow layer
.
1. The "Inside-Out" Process
The generation of your workflow documents followed 8 distinct phases of architectural discovery
:
Phase 1 — Discover Platform Domains: We scanned the ecosystem to categorize the business areas into isolated domains (e.g., OC for Occupancy, ID for Identity, VA for Visitor Access, and SM for Supplier Management)
.
Phase 2 — Build Data Ownership Maps: We mapped every single collection and subcollection in the schema to identify who creates, reads, updates, deletes, and consumes each document
. This prevented us from building workflows that aren't supported by NoSQL pathways.
Phase 3 — Build Authority Models: We established security matrices mapping business actions to system personas (e.g., Owner, Tenant, Resident, Guest)
. This cataloged actions as strictly Allowed, Conditional (requiring delegated rights), or Forbidden
.
Phase 4 — Discover State Machines: We mapped the lifecycles of system-critical entities (such as Residents, Invitations, Suppliers, and Calls) to define exact state transitions and triggers
.
Phase 5 — Discover Fan-Out & Side Effects: We answered the ultimate system engineering question: "If this data changes, what else across the architecture changes?"
 We mapped writes to denormalized ledgers, Pub/Sub message publishing, and physical lock/hardware syncs
.
Phase 6 — Discover Workflows: Only when the data, authority, states, and side effects were fully locked down did we generate the Workflow Documents
. Because the foundations were solid, these workflows were mechanically derived from underlying rules rather than guessed
.
Phase 7 & Phase 8 (Feature Maps & Delivery Corpus): We mapped those workflows to physical UI screens (PGO portal, Resident App) and generated the final Developer prompts
.
2. Context Documents & Sources Used to Build the Workflows
To compile the specific workflow documents, we cross-referenced and reconciled several technical and business "sources of truth":
A. The Master Catalogue Blueprint
OSkey Workflow Catalogue v1 (Reconciled)
: This served as our master index. It defined which workflows were high-priority (KEEP / DOCUMENTED), which were postponed (DEFER), and which domain behaviors were strictly backend mechanics that needed to be retired or embedded into broader flows (e.g., removing the isolated "Access Control" domain to integrate credential provisioning directly into the business workflows)
.
B. Technical Schema and Backend Architecture
firestore-schema.md
: This was used to verify data models, field structures, and relational keys. For example, when defining how OTM-003 Create LCD Occupancy generates credentials
, we verified the path and properties of /buildings/{id}/pincodes
 and /users/{id}/pincodes
.
Oskey Backend Services & Data Architecture.md
: This companion guide explained the heavy-lifting orchestration services (like OSKAccessService.createAccess
 and OSKBuildingAccessService
). We used it to construct the precise transactional side effects for workflows—such as how removing an inhabitant in RGA-001 or ending a tenancy in OTM-002 acts as a master "kill-switch" that automatically sweeps, de-provisions, and invalidates physical lock credentials across /users/.../accesses, /buildings/.../accesses, and Pub/Sub channels
.
firestore.indexes.json.txt
 & firestore.rules.txt
: These were used to confirm query capabilities (such as verifying which collections support COLLECTION_GROUP queries, like indexing inhabitants across units)
 and to validate security boundaries.
C. Human Guidelines and Handover Context
The OSkey Corpus Generation Framework
 & ChatGpt Handover Prompt.txt
: These established the rules of our working relationship. They forced us to follow the "inside-out" sequence
 and to obey critical rules:
Never infer functionality or authority from screen layouts or UI visibility
.
Never invent workflows not supported by the physical database model or service layers
.
Always separate Known, Likely, and Unknown factors when dealing with system ambiguities
.
3. Why this baseline matters
By using this specific matrix of architectural rules, schemas, and service files, the resulting workflow documents (like OTM-001 and RGA-003) became "Atomic PRDs"
. Rather than describing generic user features, they represent highly accurate, end-to-end relational descriptions of how the UI, backend services, Firestore database, and physical door-lock hardware interact during any given business event
