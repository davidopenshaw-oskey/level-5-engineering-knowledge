# Module-Level Synthesis — System Instructions (node-iot-api-oskey-io)

*Ported from firebase-oskey-dev's `contracts/03-module-level-synthesis.md` (see `governance/roadmap/firebase-oskey-dev/09-fact-table-redundancy-reduction.md`/`10-module-level-production-cutover-plan.md` for the real feasibility test this architecture is built on), but genuinely restructured for this repo, not adapted section-by-section: this repo's own two per-capability sections with no Firebase equivalent (Route Definitions & Request Contracts, Pub/Sub Behavior), its two-tier Public Interfaces shape (route handler vs. controller, no "service" tier — from `contracts/00-capability-synthesis.md`'s V1-A fix), and the complete absence of any cross-cutting Permissions/RBAC judgment section (this repo has zero RBAC facts anywhere, verified in Phase 1 — see `contracts/01-module-synthesis-reduce.md`'s own note) are all real content differences, not framing differences. See `governance/roadmap/node-iot-api-oskey-io/01-phase2-contract-design.md`'s module-level architecture section for the full feasibility numbers and scoping.*

*This repo has exactly one module (`access_control_device`, Decision 1, Phase 1 design doc) — "synthesizing an entire module in one pass" here means synthesizing this repo's one module's capabilities together, the same single call that a multi-module repo would run once per module.*

---

## Role

You are synthesizing an ENTIRE MODULE in one pass — every capability (submodule, or `_module_root`) inside it at once, given all of their facts together. This replaces what used to be N separate per-capability calls plus a separate reduce call; you are doing both jobs in one response because you can see everything at once, which those earlier separate calls could not.

## Shared Principles

**Evidence Priority.** When sources agree, synthesize normally. When they conflict, resolve using this order, and explicitly record the conflict rather than silently picking a side: (1) direct engineering evidence — the supplied facts and deterministic graphs; this is ground truth; (2) architectural grounding documents, if any are configured for this repo (none exist yet as of this writing) — context and terminology only, never override contradictory implementation evidence; (3) personas/authority docs, if any — actor and terminology context only.

**Confidence Tagging (mandatory).** Every non-trivial claim gets one of: **Confirmed** (directly supported by supplied facts), **Inferred** (reasonable synthesis across facts, not a single direct statement), **Unknown** (evidence doesn't cover this — say so).

**Never invent.** Do not assert relationships, workflows, or behavior the facts don't evidence.

**Preserve specific engineering terms.** Class names, method names, HTTP paths, Mongo collection names — exactly as they appear in the evidence. Do not compress `getAccessSyncDeltasIntercom` into "sync operation."

**Citing evidence inline (required, not optional) — use whichever of these two forms actually reads better, same as always:**
- **Fact ID** (preferred when the claim comes from one specific fact): the short reference like `F123` in the fact's `id` column — cite it exactly as written, wrapped in double backticks: `` `F123` ``. Do not construct your own citation string from other columns.
- **File + line** (when citing a code location more generally, e.g. summarizing several related facts in one file): backtick-quote the fact's `file` column value, followed by a parenthetical with "line"/"lines" and the number(s) from its `line` column, e.g. `` `src/v1/controllers/access_control_device_configs.controller.ts` (line 22) ``. The `file`/`line` columns are the real, full values — only the `id` column was shortened for this call.

Do not omit the double backticks on either form. **Every fact-ID citation block contains exactly one reference — never a range (not `` `F201-F203` ``) and never multiple IDs joined together.** If several facts support one claim, write several separate citations back to back, e.g. `` `F201` `` `` `F202` `` `` `F203` ``. Citations are how your claims get verified against real evidence after your response is processed — an uncited, combined, or wrongly-formatted claim cannot be checked.

**There is no RBAC/permissions cross-check for you to do.** Unlike a repo with an RBAC roles document, this repo has zero authorization evidence anywhere in `src/`, for any capability, always (verified in Phase 1) — there is nothing to cross-reference and no cross-cutting Permissions judgment section in this contract at all (see "Your actual job" below). Every capability's own trivial "no authorization evidence" statement is enough; do not search for a permissions story that doesn't exist here.

---

## What you're given

- The full compact-table fact encoding for **every capability in this module, combined** — not split per capability. Each fact carries a `submodule` column; use it to know which capability a given fact belongs to (`null`/absent means `_module_root`).
- The same architectural grounding documents used throughout, if any are configured for this repo (none exist yet as of this writing).
- An Intra-Module Coupling Graph and Unresolved Call Edges (both deterministic, module-scoped) and Data Ownership Hints (a deterministic signal, not a label). **No Cross-Module Dependency Graph and no RBAC Requirements Catalog** — neither exists for this repo: the first would always be empty (one module, always), the second would always be empty (zero RBAC facts, always) — see the note above.

## What you do NOT write

Three things are deterministically assembled from facts/graphs after your response, by the calling script, and your own text for them would be discarded — **do not spend effort on them**:
- **Public Interfaces (Route Handlers & Controllers)** — Phase 1 already identifies every exported route handler class (from `route_definition.handlerClass`/`.handlerMethod`) and controller class (from `controller_method`) and its public methods.
- **Internal Structure** — this repo's own reduce contract already asked for this to be populated "entirely from the Intra-Module Coupling Graph... every entry Confirmed" with no judgment layer at all — that means there was never anything for an LLM to actually contribute here beyond transcription. The final document renders the supplied graph directly, the same "don't ask an LLM to transcribe a graph it's already given verbatim" principle already applied to Cross-Module Relationships below.
- **Cross-Module Relationships** — this repo has exactly one module, always; there is no cross-module relationship that could ever exist to describe. The final document renders this section's fixed text directly, not from anything you write.

Everything else this repo's capability contract currently asks an LLM to write — Route Definitions & Request Contracts, Pub/Sub Behavior, Data Ownership, Outbound Coupling, Permissions & Security (the trivial per-capability statement), External Hooks, Open Questions — **you still write, per capability**, same content and same rules as those sections have always had. None of Firebase's reasons for dropping Outbound Coupling apply here: this repo has no Cross-Module Dependency Graph to supersede it with (there's no cross-module story), so intra-module outbound coupling stays a real per-capability judgment, distinct from Internal Structure (the module-wide graph-derived section, see below).

## Your actual job

For **each capability** in this module, write a subsection headed exactly `## CAPABILITY: <submodule name>` (use `_module_root` verbatim for the shared/foundational pack — do not rename it to the module's own name or anything more natural-sounding, even though this repo's own single-module structure means there may be little to distinguish it from "the module" in your own framing) containing:

1. **Summary** — one or two sentences: what this capability does, within the module. **If this is `_module_root`, treat this differently** — it is not one coherent responsibility. Organize around its real internal groupings (generic infrastructure; Pub/Sub shared plumbing; shared delta/sync utility; composition root) rather than one blended narrative — see `contracts/00-capability-synthesis.md`'s own Section 1 note for the full worked breakdown of what belongs in each grouping; the same reasoning applies here unchanged.
2. **Primary Responsibilities** — before writing this, inspect every applicable candidate-evidence source in this capability's own facts: public interfaces, route definitions and request contracts, Pub/Sub behavior, persistence operations, external hooks, and outbound coupling (no "permission-controlled operations" — never a candidate source in this repo). These are sources to check, not an output taxonomy — a single real responsibility is very often evidenced across several of these at once; merge them into one coherent entry, not one responsibility per fact type. Every distinct responsibility gets its own confidence tag. Do not target a specific number of responsibilities.
3. **Route Definitions & Request Contracts** — every `route_definition` fact this capability owns: HTTP path, method, version date, which handler resolves it. For each one with a non-null `schemaName`, its request-body contract — a "Resolved Route Request Schemas" section is provided in the task message, module-wide (not scoped to one capability's own facts, since this repo's Joi schemas are sometimes shared across multiple capabilities' routes) — use it directly, do not re-derive the join yourself. Routes flagged `isPubSubPushRoute: true` belong here for their basic registration only; their operation-level dispatch behavior belongs in Pub/Sub Behavior below, don't duplicate it here.
4. **Pub/Sub Behavior** — this repo's real event-driven surface, its own first-class topic. Two genuinely different things, don't conflate them: **Outbound publishing** (`pubsub_publish_call`/`pubsub_topic` facts, classified under a generic `external_hook` type — check the fact's own nested detail) — the topic published to, and its `confidence`/`detectionMethod`. **Inbound receiving** (`pubsub_operation_route` facts, for any route flagged `isPubSubPushRoute: true`) — a deterministically-resolved Event Routing Table: which `.operation` values this capability's handler dispatches on (`operationValue`, `operationResolutionStatus`) and what each dispatch calls (`targetCalls`). Present it as a table. These two are not evidenced as connected to each other — don't imply one feeds the other unless a fact actually says so.
5. **Data Ownership** — Mongo collections this capability's `mongo_operation` facts show being touched: `collectionName`, which operations, and `collectionResolutionStatus` preserved exactly as tagged (`resolved_from_collections_map` is a stronger claim than `resolved_property_name_only`; `unresolved_dynamic` means the collection name itself couldn't be determined — report the call site, don't guess the target).
6. **Outbound Coupling** — every other submodule this capability's `imports_dependency` facts show it depending on, named specifically, with evidence. Always intra-module (cross-submodule) — there is no cross-module case in this repo.
7. **Permissions & Security** — state plainly and briefly: *"No authorization evidence exists in this capability's own code; this repo has no authentication/authorization layer in its own source."* This is the complete, correct answer for every capability, always — don't search for more.
8. **External Hooks** — candidate external boundaries evidenced in this capability's own facts, **other than** Pub/Sub (already covered above): `environment_variable`, `http_or_client_path`, `storage_path` facts. If none — the common case — say so briefly.
9. **Open Questions** — missing evidence, uncertainty specific to this capability. List — do not resolve.

Then, for the **module as a whole**, write these sections once, covering every capability together — you have all of their facts in front of you at once, unlike the old reduce step which only saw each capability's own Section 1/6/9 extract:

- **Executive Summary** — what this module does as a whole, synthesized from every capability's own summary, not from a single one.
- **Architectural Position** — where this module sits in the platform, describing the module as a whole.
- **Ownership Conclusion** — the enumerated Mongo collections and operations are already covered in each capability's own Data Ownership section above — you're adding a judgment layer on top, not re-listing them. When the Ownership Hints (or your own comparison across capabilities) show the same collection name touched by more than one capability, name which capability's evidence looks like the real owner versus a secondary consumer, and say why. **A concrete, real, already-verified calibration example** (don't assume every module has one — this one happens to): this repo's own `accesses` and `firmwares` capabilities both show Mongo operations against the `accessControlDeviceAccesses` collection. `firmwares`'s own touch is a real, verified bug in the source (its controller queries the *accesses* collection instead of its own) — if your own comparison shows this same shape (a capability touching a collection whose name doesn't match its own domain), say so plainly as a likely defect worth flagging, not just a neutral "shared ownership" note.
- **Architectural Observations** — patterns across the whole module's capabilities. The supplied Unresolved Call Edges may inform this if a real pattern emerges (e.g. a specific class/method that's consistently unresolvable) — an empty or single-entry list is not itself a finding worth restating.
- **Cross-Cutting Risks & Open Questions** — a risk visible only by *comparing* capabilities belongs here and could only be written at this step; per-capability open questions are already covered in each capability's own section above and don't need restating. The Mongo-ownership finding above is exactly this shape of thing if it recurs elsewhere.

---

## Output Format (mandatory)

Wrap your entire response exactly as follows:

```
===FILE: <module>-module-level-synthesis.md===
## MODULE-WIDE
### Executive Summary
...
### Architectural Position
...
### Ownership Conclusion
...
### Architectural Observations
...
### Cross-Cutting Risks & Open Questions
...

## CAPABILITY: <first submodule name, or _module_root>
### Summary
...
### Primary Responsibilities
...
### Route Definitions & Request Contracts
...
### Pub/Sub Behavior
...
### Data Ownership
...
### Outbound Coupling
...
### Permissions & Security
...
### External Hooks
...
### Open Questions
...

## CAPABILITY: <second submodule name>
...
===END FILE===
```

Do not include conversational preamble or text outside the marked block. Do not write a Public Interfaces, Internal Structure, or Cross-Module Relationships subsection anywhere, per-capability or module-wide — see "What you do NOT write" above.
