# P3a Q&A — Vision, Real Examples, and Scope

**Status:** Open. Answers get filled in below as they come in (or split into follow-up files if a thread gets long, matching this repo's existing `contract-refactoring/` convention). Nothing here is a decision — this is the raw material P3a needs before a design or task list is possible.

**Purpose:** `00-analysis-p1-inventory-and-gaps.md` found that the biggest real gap isn't technical — it's that no one has written down concrete examples of the two objectives yet. Everything in this session's discussion (Postgres, pgvector, embeddings) was necessarily abstract without them. This document exists to fix that, first.

---

## Section A — Real examples (the most important section; please answer this one first)

**A1. Give 5-10 real impact-analysis questions** — things a developer would actually want to ask before or during a change, using real modules/capabilities/files from the three repos if possible. Doesn't need to be precisely worded — rough is fine, e.g. "if I change how `OSKTaskSchedulerService.cancelTask` works, what else touches that flow?" or "if I add a new required field to an organization's Firestore document, who else reads that document?"

*(

1. Currently the PGO supports adding a tenant into a unit by the Property Manager. A tenant can manage the unit in the Oskey app, adding residents such as their partner or children to the unit.

What is the impact of adding a new type of owner/inhabitant, such as an ownerNonResident. This ownerNonResident would then manage adding their own tenants and taking on the task of tenant management from the Property manager. 

1a. Currently the PGO supports adding a tenant or owner as a person living in a buildings unit by the Property Manager. We need a new inhabitantType in the Oskey system. The name of the new inhabitantType will be ownerNonResident. The scope of this PRD is to add the new inhabitantType without breaking the existing flows around inhabitantType. Report back an impact analysis of how this will impact the code base.

1b. Once the inhabitantType ownerNonResident has been added to the Oskey system, we need to be able to assign building units to this ownerNonResident account. Report back on how this could be done highlighting how in the PGO it can be added. If there is more than one option, then report back on all options. If there are existing flows and code that will be affected, report back.  


2. What is the immpact on the PGO Resident flow if we add a feature called Resident Departure. This would be a date/time set by a PM when they would like the current residents building accesses to be removed.

3.  What is the impact on the invitation flow if we add recurring invitations. At the moment, you can only add a single invitation. 

4. What is the impact if we want recurring pincode access in the PGO for Suppliers. At the moment, the Supplier pincode access is based on start date/time and end date/time. A more useful feature could be enters Mon, Tue, Wed from 09:00 until 12:00pm for gardening every week. The contract is for 6 months. The PM would like the chance to renew the contract and also pincodes at the end of 6 months.

5. In Mon Foyer, or My Household in the Oskey Apps, the residentAdmin ( currently a tenant or owner ) can manage their unit and invite residents and permanent guests. What would need to be done for adding an approval process tothe invitation invite flow. Meaning when a resident invite someone, the residentAdmin needs to approve the invitation before it is sent.
)*

**A2. Give 2-3 real atomic-PRD scenarios** — situations where you'd actually sit down to scope a PRD, and what you'd want to know about current behavior before writing it. E.g. "we want to let residents cancel their own visitor invitations — what exists today for invitation creation/cancellation, and who currently has permission to do it?"

*(The examples above ?)*

**A3. For one of the examples above, what would a genuinely useful answer look like?** A short paragraph? A list of affected files/endpoints? A list of people/teams to loop in? This matters a lot for what the retrieval layer needs to hand back, not just what it needs to find.

*(
    Ideally all of the above. Either in sections or a set of documents. 
    
    Please see an example in this file for what the business layer explanation is 
        - 00_01_Appendix-PMO-012 Assign Owner Non Resident To Unit 
        
    Then it should have a section, or a separate document that links or explains how it arrived at this decisions based on the facts in the P1/P2

    Then its technical proposal for the developers or an agent to pick up. They do not have to necessarily accept the technical proposal, but it represents a starting point and also highlights the legacy ( when legacy exists ), and how product came to its decisions. As Repos and Cross Repos grow, this avoids dev or agent starting a new piece of code/function/call etc when an existing one exists.
        
)*

---

## Section B — Who's actually asking, and how

**B1. When you imagine using this, who or what is asking the question?** You, directly, via some tool? A developer? An AI coding agent (like Claude Code) querying it on your behalf mid-task? This changes a lot — a human typing a question tolerates a different interface than an agent making an API call.

*(
    Honest answer.

    For now a human, especially at the beginning. If this works well, and the dev/agent pairing produce excellent output with it, then the scope will expand dramatically and maybe quickly.
)*

**B2. Does "atomic PRD" refer to an existing template or process you already use**, or is that also still being defined? If a template exists, what are its actual sections?

*(No. what exists today is not designed for vibe or agentic programming)*

---

## Section C — Scope

**C1. Should this start scoped to one repo** (matching how every other major change this project has made started with `firebase-oskey-dev` first), or does the very first version need to already cross repo boundaries to be useful to you?

*(
    No.

    And this is important. With the PGO, Firebase and Node-IOT repos we can complete the PGO/Property Manger flows more or less for the POC (We get as far as the mongoDB and the API for the edge device). This is a simpler proof of the POC without choosing the Oskey Apps which would have added Kotlin and Swift repos as well.
    
)*

**C2. Does impact analysis need to reason about the Angular/mobile side** (screens, components) as a first-class citizen, or is the initial interest mainly backend (Firebase, node-iot)?

*(Yes, absolutely. The only reason it has not been done is timing. First choose typescript repos, then proof the interfaces between them, then proof the inter-repo mappings and connections. Ok, if all works then start extending horizontally and vertically into screens, components, automated schema drops, adding more repos, more ast tools, hardware repos for sesame+, intercoms etc)*

---

## Section D — Knowing when P3a is done

**D1. What would make you comfortable saying "we understand this well enough to start building P2 (the loader/index)"?** E.g. a certain number of real example questions answered by hand against today's raw facts, a sketched-out answer format, something else?

*(I prefer to answer this question once we are further in to the investigation)*

**CLOSED 2026-09-02 — success.** Three hand-traces done (`02`, `04`, `07`), spanning a real spread of outcomes (mostly survives / nearly collapses / fully survives, facts-only), plus one worked atomic-PRD example (`08`). Two of the three traces (Examples 1 and 4) incidentally exercised cross-repo facts — Example 1 fully fact-derivable (a real Angular import fact matched against a Firebase type-alias fact), Example 4 partially (node-iot was checked, but the decisive finding there was source-only). A fourth trace, deliberately built around a primary-subject cross-repo question, was proposed and then dropped as not worth the marginal cost — the existing signal was judged sufficient, and the atomic-PRD output shape itself isn't being finalized yet anyway (see A3/Q1 follow-up below), so refining further before that next stage wasn't going to add much. Moving forward on this basis.

**Note on output-shape status, since it came up closing D1 out:** the three-layer shape demonstrated in `08-atomic-prd-example-resident-departure.md` is **not** an approved template — it's one worked example. The plan is to look at more real samples and build actual templates (for the atomic PRD, for impact analysis, and whatever else emerges) at a later stage, not now.

**D2. Is there anyone else (the person/conversation that originally raised the RAG question) whose perspective should get captured here before this feels complete?**

*(not yet)*
