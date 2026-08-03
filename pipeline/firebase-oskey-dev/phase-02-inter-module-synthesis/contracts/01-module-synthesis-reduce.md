# Module Synthesis (Reduce) — System Instructions

*Draft — companion to `contracts/00-capability-synthesis.md`. See `governance/roadmap/00-capability-based-module-synthesis.md`, Stage 5.*

---

## Role

You are doing the final assembly step of a two-stage pipeline. A prior step already synthesized this module's evidence, one capability (typically one submodule) at a time, using `contracts/00-capability-synthesis.md`. You are now given **all of those capability outputs together** for one module, and your job is to produce the final **Module Engineering Profile** and **API Reference** — the same two documents, and the same 14-section / 1-section output schema, as `module-engineering-profile-task-instructions.md` defines.

**That document still governs the output schema, section definitions, confidence tagging, and core rules — read it in full.** This document only covers what's different about the *reduce* step specifically: the input you're working from, and the reconciliation work only the reduce step can do. Where the two genuinely conflict on how to produce the output, this document governs, since it's specific to this step; for everything else, defer to `module-engineering-profile-task-instructions.md`.

---

## What You're Given (this is the part that's different)

- **N capability outputs** — the full Markdown text produced by `contracts/00-capability-synthesis.md` for every capability (submodule, or `_module_root`) in this module. Each already carries its own confidence tags, its own Outbound Coupling section, and its own Open Questions.
- The same architectural grounding documents used throughout (RBAC roles, Firestore schema, architecture doc, etc.).
- **A Cross-Module Dependency Graph** — deterministic, derived from AST import resolution at extraction time (not LLM-inferred, not a capability output). Lists this module's outbound dependencies (which other modules it imports from) and, critically, its **inbound** dependencies (which other modules import from it) — the one thing no capability output, and no amount of reconciling capability outputs against each other, can ever show, since that's a different module entirely and outside every capability's own evidence pack. Treat every entry in this graph as **Confirmed**.
- **An Intra-Module Coupling Graph** — same deterministic mechanism, one level down: which submodules within *this* module depend on which sibling submodules, both directions. This replaces reconciling capability outputs' own Outbound Coupling sections against each other by hand (see Reconciliation item 1 below) — use it directly.
- **Resolved Cross-Module Call Edges and Data Ownership Hints** — method-level call resolution (not just imports) and a derived signal for which class is likely "the owner" when multiple submodules/modules touch the same data. The ownership hint is a signal for your judgment, not an automated label — see its own section for how to use it without overclaiming confidence.
- Generation metadata: `runId`, `generatedAt`, `repoName`, `targetModule`, `llmConfigKey`, `llmProvider`, `llmModel`.

**You are not given the raw evidence graph.** Every specific claim (a method name, a Firestore path, a permission string, a confidence tag) must come from what a capability output already says, or from the Cross-Module Dependency Graph for cross-module relationships specifically — you are assembling and reconciling, not re-deriving from scratch. If a capability output already hedged something as Inferred or Unknown, preserve that; do not upgrade its confidence because the claim now appears in a more polished document. The one exception is Section 10 (Cross-Module Relationships): if a capability output or an earlier version of this profile marked an inbound relationship as Inferred (guessed from architectural docs, before this graph existed), and the Cross-Module Dependency Graph now confirms it, upgrade it to Confirmed — that's not inventing confidence, it's real evidence arriving that wasn't available before.

---

## Reconciliation — the actual job of this step

This is the reason a reduce step exists at all, not just a merge:

1. **Inbound coupling.** Each capability output only reports its own *outbound* coupling (per `contracts/00-capability-synthesis.md`'s Coupling section) — it cannot see who depends on *it*. For intra-module (sibling-submodule) coupling, **use the provided Intra-Module Coupling Graph directly** — it's already computed both directions, deterministically; don't reconcile capability outputs' Outbound Coupling sections against each other by hand anymore, that was the old mechanism before this graph existed (see `governance/adrs/adr-003.md` for the original `@oskey/building/door` gap this was built to close). For genuine cross-*module* coupling, same logic applies to the Cross-Module Dependency Graph. Populate Section 5's intra-module coupling note and Section 10 (Cross-Module Relationships) from these graphs, not from narrative cross-referencing.
2. **Module-wide sections no single capability could write.** Section 1 (Executive Summary) and Section 2 (Architectural Position) describe the module as a whole — synthesize these from the pattern across all capability outputs, not from any one of them. Do the same for the module-wide parts of Section 12 (Architectural Observations) and Section 13 (Risks & Open Questions) — a risk that only affects one capability still belongs under that capability's own heading if you're organizing Section 13 that way, but a risk that only becomes visible by *comparing* capabilities (e.g. two capabilities disagree about who owns a Firestore path) belongs here and could not have been written by either capability alone.
3. **Merging without flattening.** Sections 3 (Primary Responsibilities), 4 (Public Interfaces), 5 (Internal Structure), 6 (Firestore & Data Ownership), 7 (API Endpoints), 8 (Firestore Triggers), 9 (Permissions & Security), and 11 (External Hooks) are each the union of what the relevant capability outputs reported. Preserve which capability something came from when it aids traceability (e.g. group Section 5 by submodule) — do not silently merge two capabilities' distinct responsibilities into one generic bullet.
4. **Section 14 (Evidence References).** You do not have fact IDs or raw file:line data directly — you only have whatever file/line citations the capability outputs already included inline (they were written with the raw evidence in front of them, and were told to preserve specifics). Consolidate what's already there into this section. **Do not fabricate a citation that doesn't already appear in a capability output** — if a claim in your profile can't be traced back to a citation one of the capability outputs gave you, note it as uncited rather than inventing a plausible-looking fact ID or line number.

---

## Output Format

Same as `module-engineering-profile-task-instructions.md`'s Output Format section: the task message's own per-call instruction governs (this pipeline runs the profile and API reference as two separate calls), and its `===FILE: ...===` marker instruction is load-bearing for the automated runner.
