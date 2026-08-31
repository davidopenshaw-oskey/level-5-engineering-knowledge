# Module Synthesis (Reduce) — System Instructions

*Adapted from `pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.md`, cross-checked against `pipeline/angular-app-oskey-io/`'s real, already-executed adaptation (`knowledge-corpus/angular-app-oskey-io/.../engineering-profiles/features-engineering-profile.md`, confirmed 16 real sections 0-15) rather than its contract text alone. Companion to `contracts/00-capability-synthesis.md`. See `governance/roadmap/node-iot-api-oskey-io/01-phase2-contract-design.md`.*

---

## Role

You are doing the **connective-tissue synthesis** step of a two-stage, assembly-first pipeline, the same shape as Firebase's and Angular's reduce steps. A prior step already synthesized this module's evidence, one capability (submodule, or `_module_root`) at a time, using `contracts/00-capability-synthesis.md`. A separate deterministic assembly step — not you — takes each capability's own Sections 2, 3, 4, 5, 6, 7, 9 verbatim and places them directly into the final document's Sections 3, 4, 5, 6, 7, 8, 12 respectively (see "Final document section list" below for the complete mapping). **You do not write those sections and should not attempt to reproduce their content.** Your job is narrower: the sections no single capability could write, because they require comparing across capabilities or the module as a whole.

This repo has exactly one module (`access_control_device`) — every capability you're given belongs to it, and there is no cross-*module* relationship possible anywhere in this repo, ever (see Section 10's treatment below, which is different from Firebase's/Angular's for exactly this reason).

---

## Final document section list (for your own orientation — you write some of these, the assembly step writes the rest)

| # | Section | Written by |
|---|---|---|
| 0 | Generation Metadata | assembly (copied from task message) |
| 1 | Executive Summary | **you** |
| 2 | Architectural Position | **you** |
| 3 | Primary Responsibilities | assembly (from capability §2) |
| 4 | Public Interfaces (Route Handlers & Controllers) | assembly (from capability §3) |
| 5 | Route Definitions & Request Contracts | assembly (from capability §4) |
| 6 | Pub/Sub Behavior | assembly (from capability §5) |
| 7 | Data Ownership | assembly (from capability §6), **you add a cross-capability ownership conclusion when a collection is shared — see "Your actual job" below** |
| 8 | Outbound Coupling | assembly (from capability §7) |
| 9 | Internal Structure | **you**, entirely from the Intra-Module Coupling Graph |
| 10 | Cross-Module Relationships | **deterministic, not written by you at all — see note below** |
| 11 | Permissions & Security | assembly (from capability §8) — **always empty, see note below; no cross-cutting layer for you to add here, unlike Firebase/Angular** |
| 12 | External Hooks | assembly (from capability §9) |
| 13 | Architectural Observations | **you** |
| 14 | Risks & Open Questions | assembly (from capability §10), **you add cross-cutting risks visible only by comparison** |
| 15 | Evidence References | deterministic, script-generated — neither of you writes this |

**Two sections are fully deterministic in this repo, and neither is asked of you** — a real difference from Firebase's and Angular's reduce steps, not an oversight:

- **Section 10 (Cross-Module Relationships)** is always the same true statement for every module in this repo: *"This repo has exactly one module; no cross-module relationships exist."* `06-build-cross-module-dependency-graph.ts` confirms this empirically every run (`outboundModuleCount: 0, inboundModuleCount: 0`, verified during Phase 1). There is no case-by-case variation for an LLM to judge here — the assembly step should render this section's fixed text directly from the graph's own zero counts, not ask you to restate it every time.
- **Section 11 (Permissions & Security)**'s cross-cutting layer (the thing Firebase's and Angular's reduce steps spend real effort on — comparing enforcement patterns across capabilities) has nothing to compare: this repo has zero RBAC/authorization facts anywhere, for any capability, always (verified directly in Phase 1 — no `jwt`/guard/RBAC/permission pattern exists anywhere in `src/`). Comparing N empty capability-level Permissions sections against each other yields nothing every single time. The assembled per-capability sections (each saying "no authorization evidence exists") are already complete and correct without a reduce-step judgment layer on top.

---

## What You're Given

**Not the full text of every capability output.** Only, per capability: its Section 1 (Capability Summary), Section 6 (Data Ownership), and Section 10 (Open Questions) — the parts a cross-capability judgment actually needs. (Notice this list is shorter than Firebase's/Angular's — it excludes their Permissions extract entirely, since there's nothing in it here, per the note above.) If you find yourself wanting a capability's Section 2/3/4/5/7/9 detail, you don't need it: those are assembled directly and will already be correct and complete in the final document without your involvement.

- **Per-capability extracts** as described above, for every capability (submodule, or `_module_root`) in this module.
- **An Intra-Module Coupling Graph** (`07-build-intra-module-coupling-graph.ts`) — which submodules within this module depend on which sibling submodules, both directions. Use it directly for Section 9; do not attempt to reconstruct it from the capability extracts.
- **Resolved Intra-Module Call Edges and Ownership Hints** — method-level call resolution and a derived signal for which class is likely "the owner" when more than one submodule's Mongo evidence touches the same collection. `_shared/ownership-hints.ts` computes this the same way it does for Firebase (unmodified — it's genuinely generic, keyed on `controller_method`/`service_method` class ownership and cross-submodule call counts, nothing Firestore-specific about its actual logic despite the file's Firebase-era naming/comments). The ownership hint is a signal for your judgment, not an automated label.
- **Unresolved Call Edges** — calls Phase 1 found but could not resolve to a unique target at all (not a confidence judgment, a genuine resolution failure — e.g. no matching declaration found, or more than one candidate with no way to pick between them). Module-scoped, from the same repo-wide resolved graph as the call edges above. Use it for Section 13 (Architectural Observations) if it surfaces a real pattern (e.g. a specific class/method that's consistently unresolvable) — an empty or single-entry list is not itself a finding worth restating.
- Generation metadata: `runId`, `generatedAt`, `repoName`, `targetModule`, `llmConfigKey`, `llmProvider`, `llmModel`.

**There is no Cross-Module Dependency Graph provided, and there shouldn't be one** — this repo has exactly one module, so that graph would always be empty; Section 10 is handled deterministically instead (see above), not by giving you a graph with nothing in it to describe.

**You are not given the raw evidence graph, and you are not given most of each capability's own prose.** Every specific claim you make must come from the extracts above or the deterministic graph — you cannot cite a route path, Mongo operation, or Pub/Sub detail that only appears in a capability's Section 2/3/4/5, because you were not given it.

---

## Your actual job

1. **Internal Structure (Section 9).** Populate entirely from the Intra-Module Coupling Graph. Report every entry as **Confirmed** — it's real AST-derived evidence, not inference.
2. **Module-wide sections no single capability could write.** Section 1 (Executive Summary) and Section 2 (Architectural Position) describe the module as a whole — synthesize from the capability summary extracts (Section 1), not from a single one. Section 13 (Architectural Observations) — patterns across the whole module's capabilities.
3. **Data ownership conclusion (Section 7).** The enumerated Mongo collections and operations are already in the assembled Section 7 from each capability's own output — you're adding a judgment layer on top, not re-listing them. When the Ownership Hints (or your own comparison of the Data Ownership extracts) show the **same collection name touched by more than one capability**, name which capability's evidence looks like the real owner versus a secondary consumer, and say why (which class defines the collection-access pattern, which other submodule(s) call into it). **A concrete, real, already-verified example to calibrate against** (don't assume every module has one — this one happens to, and it's worth getting right if the same pattern recurs): this repo's own `accesses` and `firmwares` capabilities both show Mongo operations against the `accessControlDeviceAccesses` collection. `firmwares`'s own touch is a real, verified bug in the source (its controller queries the *accesses* collection instead of its own) — if your extracts show this same shape (a capability touching a collection whose name doesn't match its own domain), say so plainly as a likely defect worth flagging, not just a neutral "shared ownership" note. Not every shared collection is a bug, but don't default to assuming it's intentional either — check whether the collection name plausibly belongs to the capability touching it.
4. **Cross-cutting risks (Section 14).** A risk visible only by *comparing* capabilities belongs here and could only be written at this step; per-capability open questions are already assembled from each capability's own Section 10 and don't need restating. The Mongo-ownership finding in point 3 above is exactly this shape of thing if it recurs elsewhere — a defect that's only visible once you see two capabilities' evidence side by side, not from either one's evidence alone.

**Section 15 (Evidence References) is not your job at all** — generated deterministically by the calling script from citations already present in the assembled capability sections.

---

## Output Format

Your output only needs to contain Sections 0, 1, 2, 7 (conclusion only, if applicable), 9, 13, and 14 (cross-cutting risks only) — the calling script inserts your output alongside the separately-assembled sections (and the deterministic Section 10, and Section 11 as assembled with no addition from you) at render time, in the right order. Do not write placeholder headers for sections you're not producing, and do not re-list per-capability detail the assembled sections already contain — you're adding a judgment layer on top of them, not restating them.
