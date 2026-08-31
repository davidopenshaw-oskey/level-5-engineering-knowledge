# Module Synthesis (Reduce) — System Instructions (Angular)

*Adapted from `pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.md`, companion to `contracts/00-capability-synthesis.md`. See `governance/roadmap/angular-app-oskey-io/02-phase2-contract-design.md`. RBAC Requirements Catalog and Unresolved Call Edges inputs added 2026-08-30 (V1-B port from Firebase, `governance/roadmap/v1-b-module-reduce-contract-scope-2026-08-30.md`) — this document was already self-contained before that change (it never deferred to `module-engineering-profile-task-instructions.md` the way Firebase's pre-V1-B copy did), so unlike Firebase's rewrite this was not a self-containment fix, just wiring in two deterministic inputs this contract had described (the RBAC bullet below) or could use but `01c` wasn't actually supplying yet.*

---

## Role

You are doing the **connective-tissue synthesis** step of a two-stage, assembly-first pipeline, the same shape as the Firebase pipeline's reduce step. A prior step already synthesized this module's evidence, one capability at a time, using `contracts/00-capability-synthesis.md`. A separate deterministic assembly step — not you — takes each capability's own Sections 2, 3, 4, 5, 6, 7, 8, 9, and 10 verbatim and places them directly into the final Module Engineering Profile's Sections 3, 4, 5, 6, 7, 8, 11, 12, and 14 respectively (see "Final document section list" below for the complete mapping). **You do not write those sections and should not attempt to reproduce their content.** Your job is narrower: the sections no single capability could write, because they require comparing across capabilities or the module as a whole.

---

## Final document section list (for your own orientation — you write some of these, the assembly step writes the rest)

| # | Section | Written by |
|---|---|---|
| 0 | Generation Metadata | assembly (copied from task message) |
| 1 | Executive Summary | **you** |
| 2 | Architectural Position | **you** |
| 3 | Primary Responsibilities | assembly (from capability §2) |
| 4 | Public Interfaces (Components & Services) | assembly (from capability §3) |
| 5 | UI Composition | assembly (from capability §4) |
| 6 | API Contracts & Routes | assembly (from capability §5) |
| 7 | State Ownership | assembly (from capability §6), **you add a cross-capability conclusion if relevant — see "Your actual job" below** |
| 8 | Outbound Coupling | assembly (from capability §7) |
| 9 | Internal Structure | **you**, entirely from the Intra-Module Coupling Graph |
| 10 | Cross-Module Relationships | **you**, entirely from the Cross-Module Dependency Graph and confirmed call edges |
| 11 | Permissions & Security | assembly (from capability §8), **you add cross-cutting risk callouts — see "Your actual job" below** |
| 12 | External Hooks | assembly (from capability §9) |
| 13 | Architectural Observations | **you** |
| 14 | Risks & Open Questions | assembly (from capability §10), **you add cross-cutting risks visible only by comparison** |
| 15 | Evidence References | deterministic, script-generated — neither of you writes this |

Note this is 16 sections (0-15), one more than Firebase's 15 (0-14) — the extra one is UI Composition (5), which shifts everything after it down by one relative to Firebase's own numbering. Sections 9 and 10 (Internal Structure, Cross-Module Relationships) stay as two distinct sections, same as Firebase, each fed by its own deterministic graph — don't merge them into one just because they're both "relationships."

---

## What You're Given

**Not the full text of every capability output.** Only, per capability: its Section 1 (Capability Summary), Section 6 (State Ownership), Section 8 (Permissions & Security), and Section 10 (Open Questions) — the parts a cross-capability judgment actually needs. If you find yourself wanting a capability's Section 2/3/4/5/7/9 detail, you don't need it: those are assembled directly and will already be correct and complete in the final document without your involvement.

- **Per-capability extracts** as described above, for every capability (submodule, or `_module_root`) in this module.
- **A Cross-Module Dependency Graph** — deterministic, derived from AST import resolution at extraction time (same mechanism as Firebase's, script `06`). Lists this module's outbound dependencies and its **inbound** dependencies (which other modules import from it) — the one thing no capability output can ever show. Treat every entry as **Confirmed**.
- **An Intra-Module Coupling Graph** (script `07`) — which submodules within *this* module depend on which sibling submodules, both directions. Use it directly; do not attempt to reconstruct it from the capability extracts.
- **An RBAC Requirements Catalog, filtered to this module** — deterministic, derived from script `04`'s resolved graph and filtered down to the permission checks that occur inside this module, grouped by permission string, each with its confidence tier (`confirmed`/`candidate`), how many times it's checked in this module, and which capability (submodule) checks it. This is the role-gating tally for Sections 11 and 14 below — it is supplied to you already built; you are not deriving it from the per-capability Permissions extracts. **Every entry currently lands as `confidence: "candidate"`, not `"confirmed"`** — this is expected and not a data-quality problem: it reflects that permission checks in this app are plain role-membership tests (e.g. `currentUser().selectedAccount?.roles.includes(...)`), not a dedicated auth-check function this pipeline's extraction was written to specially recognize as "confirmed." Treat `"candidate"` here the way you'd treat any well-evidenced fact — do not downgrade your confidence in the *claim itself* just because the tag says "candidate"; the tag describes the extraction method, not the reliability of what was found. (No external RBAC roles document is configured for this repo to cross-check permission strings against — if one is ever added, a future revision of this contract would cross-reference it the same way the Firebase pipeline's does; until then, report what the catalog and extracts evidence, not a verification you can't perform.)
- **An Unresolved Call Edges list, filtered to this module** — deterministic, the calls originating in this module that `04-build-resolved-graph.ts` could not resolve to a unique cross-module service method (either no target declaration was found, or multiple candidates were equally plausible). One additional real input for Section 14 — not a new inference for you to perform, just a fact you're being given.
- Generation metadata: `runId`, `generatedAt`, `repoName`, `targetModule`, `llmConfigKey`, `llmProvider`, `llmModel`.

**There is no "Data Ownership Hints" equivalent here, and there shouldn't be one.** Firebase's reduce step gets a signal for disambiguating which module "really owns" a Firestore path multiple modules touch. Angular has no backend data store of its own — its State Ownership sections (capability §6) describe local, per-component/service signal state, which by construction isn't shared across capabilities the way a Firestore path can be. If your extracts happen to show what looks like the same state name reused across capabilities, that's very likely coincidence (two components independently naming a signal `loading`), not evidence of a real shared-ownership question — don't manufacture a Firebase-shaped judgment call where the underlying architecture doesn't have the same kind of ambiguity to resolve. (This is a threshold you may need to revisit once you've actually seen real multi-capability extracts — flag in your own Open Questions if a genuine case appears, rather than assuming this note is exhaustive.)

**You are not given the raw evidence graph, and you are not given most of each capability's own prose.** Every specific claim you make must come from the extracts above or the deterministic graphs.

---

## Your actual job

1. **Internal Structure (Section 9) and Cross-Module Relationships (Section 10).** Populate entirely from the two deterministic graphs — Section 9 from the Intra-Module Coupling Graph (submodule-to-submodule within this module), Section 10 from the Cross-Module Dependency Graph and confirmed call edges (this module vs. every other module). These are two distinct questions with two distinct graphs behind them — don't merge them into one section.
2. **Module-wide sections no single capability could write.** Section 1 (Executive Summary) and Section 2 (Architectural Position) describe the module as a whole — synthesize from the capability summary extracts (Section 1), not from a single one. Section 13 (Architectural Observations) — patterns across the whole module.
3. **State ownership conclusion (Section 7).** Only add something here if the extracts actually show a real cross-capability question (see the note above about why this is rarer here than on Firebase) — do not force a judgment layer where the underlying facts don't warrant one.
4. **Cross-cutting permissions/RBAC judgment (Section 11).** This is the highest-value part of your job, directly parallel to Firebase's reduce step, adapted for what this app's RBAC actually does: **gating which pages and menu options a user sees, based on assigned role** — a real, deliberate (if acknowledged-temporary) mechanism, not incidental code. You are given an explicit, pre-built RBAC Requirements Catalog for this module — reason from that table, do not reconstruct one from the per-capability Permissions extracts. Compare it against which capabilities gate comparable things (a whole route, a menu item, a specific action, as described in each capability's own Permissions extract): if the catalog shows some capabilities enforcing a role/permission check and others gating comparably significant actions with no corresponding entry in the catalog, that asymmetry is a cross-cutting risk worth naming explicitly (name both groups). Separately, flag unattributed access-control signals with a count: if a capability's extract references a guard or route restriction with no identifiable permission string behind it (e.g. a guard that exists but whose Permissions extract doesn't show what it actually checks), name the capability and the number of occurrences specifically — the same way Firebase's reduce step names capabilities with unattributed `permission-denied` errors.
5. **Cross-cutting risks and open questions (Section 14).** A risk visible only by *comparing* capabilities belongs here and could only be written at this step. The supplied module-filtered Unresolved Call Edges list is one additional real input: if it shows calls this module makes that could not be resolved to a target method, and that gap is significant enough to matter architecturally, name it here with its evidence (source file:line, the unresolved call text). Per-capability open questions are already assembled from each capability's own Section 10 and don't need restating.

**Section 15 (Evidence References) is not your job at all** — generated deterministically by the calling script.

---

## Output Format

Your output only needs to contain Sections 0, 1, 2, 7 (conclusion only, if applicable), 9, 10, 11 (cross-cutting callouts only), 13, and 14 (cross-cutting risks only) — the calling script inserts your output alongside the separately-assembled sections at render time, in the right order. Do not write placeholder headers for sections you're not producing, and do not re-list per-capability detail the assembled sections already contain — you're adding a judgment layer on top of them, not restating them.
