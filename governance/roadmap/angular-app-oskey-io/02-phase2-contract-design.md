# Plan 02 — Phase 2 (LLM Synthesis) Contract Design

**Status:** Analysis done, contract text not yet written. Grounded in real capability-pack data, not imagined structure.
**Created:** 2026-08-28

*Third plan doc for this repo, following `00-phase1-ast-extraction-design.md` (Phase 1, all 8 handoffs done) and `01-next-steps-post-phase1.md` (the cross-repo join, item 1, also done). This doc is item 3 from that menu. Mirrors Firebase's contract structure (`pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/00-capability-synthesis.md`) deliberately — adapting a proven template section-by-section against real Angular data, not designing from a blank page.*

---

## What the real data actually looks like

Pulled fact-type distributions from three real capability packs, chosen for contrast: the smallest (`home`, 9 facts), a representative mid-size one (`authentication`, 539 facts), and the largest (`portals_organization_entities_entity_suppliers`, 1,469 facts — the one flagged back in Plan 01 as bigger than anything in the entire Firebase repo).

| Fact type | `home` (9) | `authentication` (539) | `suppliers` (1,469) |
|---|---|---|---|
| `call_expression` | 1 | 273 | 763 |
| `imports_dependency` | 4 | 99 | 115 |
| `angular_template_composition` | 1 | 45 | 196 |
| `angular_template_binding` | 0 | 27 | 114 |
| `class_method` / `service_method` | 0 | 25 / 20 | 89 / 14 |
| `model_property` | 0 | 0 | 118 |
| `source_file` / `source_class` | 1 / 1 | 12 / 10 | 8 / 6 |
| `angular_component` / `angular_injectable` | 1 / 0 | 9 / 1 | 4 / 2 |
| `firebase_callable_call` | 0 | 7 | 14 |
| `angular_route` | 0 | 4 | 2 |
| `angular_signal` | 0 | 4 | 12 |
| `enum_declaration` / `type_alias` | 0 | 3 / 0 | 0 / 12 |

Three things worth designing around before writing a word of contract text:

1. **`call_expression` dominates every pack by volume** (50-55% of all facts, consistently) — same as Firebase. Firebase's contract already treats these as supporting evidence, not something to narrate exhaustively; that guidance carries over unchanged.
2. **Template facts (`angular_template_composition` + `angular_template_binding`) are substantial and have zero Firebase equivalent** — 72 facts in `authentication`, 310 in `suppliers`. This is genuinely new territory: Firebase's backend has no concept of "what does this render." Needs a new contract section, not a reuse of an existing one.
3. **`home`'s near-total emptiness across most fact types is itself informative** — a contract that assumes every section will have real content to fill will produce padded, hallucinated-feeling output on small capabilities. Firebase's contracts likely already handle this (small modules exist there too, per Plan 04's `access_control_device`/flat-module discussion) — worth explicitly re-confirming that guidance transfers rather than assuming.

## Section-by-section mapping against Firebase's real contract

Firebase's `00-capability-synthesis.md` has these sections: Role, What You're Given, Evidence Priority & Confidence Tagging, Citing evidence inline, Coupling, then Output Format sections 0-9 (Generation Metadata, Capability Summary, Primary Responsibilities, Public Interfaces, API Contracts & Firestore Triggers, Data Ownership, Outbound Coupling, Permissions & Security, External Hooks, Open Questions).

| Firebase section | Angular treatment | Why |
|---|---|---|
| Role, What You're Given, Evidence Priority & Confidence Tagging, Citing evidence inline | **Reuse near-verbatim** | Generic framing, not Firebase-specific. Citation syntax examples need updating to Angular's fact-ID shapes, but the *rules* don't change. |
| Coupling | **Adapt** | Firebase's coupling is import-based only. Angular has two coupling mechanisms: `imports_dependency` (same as Firebase) *and* `angular_template_composition` (a component using another component in its template is coupling too, and doesn't show up as a TS import the same way a service injection does — it's a separate, real signal). |
| 0. Generation Metadata | **Reuse as-is** | Not content-specific. |
| 1. Capability Summary | **Reuse framing** | Content naturally differs, structure doesn't need to. |
| 2. Primary Responsibilities | **Reuse framing** | Same. |
| 3. Public Interfaces (Controllers & Entry Points) | **Adapt** | Firebase: controllers/services. Angular: `angular_component`/`angular_injectable` facts — selector, standalone flag, DI scope (`providedIn`) instead of controller/service classification. |
| 4. API Contracts & Firestore Triggers | **Adapt — highest-value section, one correction below** | `firebase_callable_call` facts are the evidence that this capability talks to the Firebase backend. `angular_route` facts (path, guards, lazy-loading) are the second half — Angular has no Firestore trigger equivalent, drop that half of the section name. **Correction (2026-08-28, caught before contract text was written)**: this section can only cite the call as a *local, unverified claim* — "this component calls Firebase function X" — the same epistemic status Firebase's own `api_contract` facts already have in its contracts today. Phase 2 capability synthesis runs per-repo, on that repo's own facts alone; the cross-repo join (`06-build-cross-repo-graph.ts`) is a separate, later process that reads both repos' Phase 1 output together, and nothing currently feeds that verification back into either repo's own synthesis. See "Open design question" below before assuming this will ever say more than a local claim. |
| 5. Data Ownership | **Repurpose, not reuse** | Firebase: which Firestore paths this capability owns. Angular owns no backend data — it's a frontend. Real Angular equivalent: **local UI state ownership**, from `angular_signal` facts (what state does this capability hold and expose, e.g. `loading`, `buildings`). Different concept, same *shape* of question ("what does this capability own"). |
| 6. Outbound Coupling | **Reuse framing, extend evidence** | Same section, but must now also cite `angular_template_composition` per point above, not just `imports_dependency`. |
| 7. Permissions & Security | **Adapt — second highest-value section** | Directly maps to `angular_guard` + RBAC permission-hint facts. Per the user's clarification (RBAC role assignment is the real, if temporary, mechanism gating page/menu visibility), this section should explicitly connect `angular_route`'s `canActivate` guard references to what real permission strings that guard checks — not just list them side by side. This is the Angular analogue of Firebase's RBAC section, but the *direction* is inverted: Firebase's RBAC section is about what a backend function requires; Angular's is about what a frontend route/menu item is gated behind. |
| 8. External Hooks | **Reuse framing** | Firebase SDK usage, `@ngx-translate`, etc. — same shape of question. |
| 9. Open Questions | **Reuse as-is** | Generic. |
| *(no Firebase equivalent)* | **New section needed: UI Composition** | `angular_template_composition` + `angular_template_binding` facts have nowhere to go in the current section list. Needs its own section: what this capability's UI actually renders (child components used) and what data flows in/out of it (bindings) — the real, structural answer to "what does this look like and do on screen," which no Firebase section asks about at all. |

## Open questions for you before contract text gets written

1. **Where does "UI Composition" go in the section numbering?** Suggest right after "Public Interfaces" (3) and before "API Contracts" (4) — components and their composition are closely related to the public-interface story — but open to your read on ordering.
2. **Does the RBAC/visibility framing belong at the capability level, or does it only become meaningful at the module-level reduce step** (where cross-capability patterns like "every supplier-related page is gated behind the same role" would actually show up)? Firebase's precedent (Plan 05, Section 3d) found real cross-cutting patterns specifically emerge at the *reduce* step, not the per-capability step — likely the same here, meaning the per-capability contract should just cite the guard/permission facts plainly, and the *reduce* contract (not yet designed in this doc) should be where the "which role sees which menu" pattern actually gets narrated.
3. **Should `suppliers` (1,469 facts, the oversized pack) get any special contract guidance**, or should we treat it the same as every other pack and just watch what happens on a real run — mirroring Plan 05's conclusion on Firebase that single-run size numbers weren't strong evidence of a real problem on their own?
4. **Resolved (2026-08-28) — should cross-repo verification ever feed back into per-repo Phase 2 synthesis?** No — and the reason is architectural, not just "keep it simple for now." The user's actual intended design: code merges → triggers that repo's own AST+Corpus pipeline (Phase 1 + Phase 2, local to that repo) → on completion, **an automated, event-triggered cross-repo refresh runs separately**, told which repo just changed so it can do a targeted refresh rather than reprocessing everything blind. This is a third shape, distinct from both options originally posed here: not "a human consults a standalone artifact whenever" and not "wire verification into per-repo Phase 2" — cross-repo synthesis is its own pipeline stage, downstream of any single repo's completed run, not an input to any repo's own synthesis. Consequence: **Phase 2 capability contracts stay local and unverified, same as Firebase's already are — settled, not just deferred.** The CI/CD triggering itself (merge → pipeline → cross-repo refresh, automated rather than a human running npm scripts) is real, tracked future work, but doesn't block or change anything about the contract design in this doc — it changes *how* Phase 1/2/cross-repo eventually get invoked, not *what* Phase 2's contracts should say.

Not drafting the actual contract text in this doc — that's the next concrete step once the section mapping above is confirmed, mirroring how Firebase's real contract was written after, not during, this kind of analysis.

---

## Logged idea (2026-08-28, not yet built) — a deterministic Signals-consistency check for the eventual repo-wide report

Raised by the user while reviewing the capability-synthesis contract draft: should something verify Signal usage is "correct"? Sharpened into something concrete and buildable, not vague:

- **Encapsulation audit**: `angular_signal` facts already carry `accessModifier` and `isReadonly`. A repo-wide list of public, non-`readonly` `WritableSignal`s (mutable state exposed outside its own class — a real footgun) is fully computable from existing facts, no LLM judgment needed.
- **Convention-consistency check**: the real pattern found in `OSKLocaleService` (private mutable backing signal + public readonly `computed()` view) is a deliberate Angular idiom. Whether it's used consistently app-wide, or only sometimes, is a genuine cross-cutting quality signal — but only visible once *all* signal facts are seen together, which is exactly why this can't live in the per-capability contract (which only ever sees one slice).
- **Where it belongs**: a deterministic section in Angular's eventual repo-wide report (mirroring how Firebase's repo report already has a deterministic RBAC Requirements Catalog, computed from facts, not narrated by an LLM) — not the module-synthesis reduce contract either, since this is a repo-wide pattern, not a per-module one. Angular has neither a reduce contract nor a repo-report design yet, so this is logged for whenever that work starts, not built now.
