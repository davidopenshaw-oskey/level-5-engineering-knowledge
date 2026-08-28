# Strawman Data Model for Phase 2's Canonical Representation — Critique Requested

*A candidate answer to the sequencing you (OpenAI) proposed: canonical representation → what's persisted → when reasoning happens → how knowledge evolves → then model/cost. This is deliberately concrete so it can be broken. Please attack it — this is not a finished design, it's a target for finding holes.*

## Context this is grounded in (self-contained, no repo access assumed)

Phase 1 (deterministic, AST-level extraction, no LLM) already produces facts with a stable, addressable ID format: `type|module|file|line|primaryKey`. Example: `call_expression|building_door|door.controller.ts|41|OSKBuildingDoorController.updateStatus`. Every fact is reproducible from source and re-extracted on every run. Phase 1 also already computes several deterministic *relationships* between facts: cross-module dependency graphs, intra-module coupling graphs, resolved method-level call edges, an API-request/response schema join, and one deliberately-hedged heuristic ("data ownership hint" — which class is called into by the most other modules, offered as signal, never as a confirmed claim on its own).

Today, Phase 2 (LLM-driven) reads facts + relationships and writes narrative documents directly — one LLM call in, one markdown document out, nothing persisted in between except the final document. Documents are regenerated from scratch on every run, at every level (capability, module — repository and landscape levels are proposed, not built).

## Proposed model

### Four object types, not one

| Type | Produced by | Mutable? | Confidence lives here? |
|---|---|---|---|
| **Fact** | Phase 1 (deterministic) | No — immutable per commit | No — true by construction |
| **Relationship** | Phase 1 (deterministic) or Phase 2 (heuristic hint) | No — immutable per commit, or hedged-by-design | Only if heuristic (e.g. the ownership hint carries its own hedge) |
| **Interpretation** | Phase 2 (LLM) | Yes — superseded, not deleted, on re-synthesis | **Yes — this is where confidence lives** |
| **Document** | Rendered on demand from Interpretations (+ Facts/Relationships directly, for anything fully deterministic) | Not persisted as source of truth — a projection, regenerated whenever requested | Inherited transparently from the Interpretations it renders |

**Interpretation** is the new object type. Schema:

```
Interpretation {
  id: string                        // stable, e.g. hash of (scope + claim-subject)
  scope: { level: "capability"|"module"|"repo"|"landscape", scopeId: string }
  claim: string                     // the actual assertion, kept short and singular
  confidence: "Confirmed" | "Inferred"
  evidence: FactId[] | RelationshipId[]   // required, non-empty -- no evidence, no interpretation
  generatedAgainstFactSet: FactId[] // the exact fact IDs this claim's evidence set resolved against
  status: "current" | "stale" | "superseded"
  supersedes: InterpretationId | null
  humanOverride: { note: string, by: string, at: timestamp } | null
}
```

### Invalidation / incrementality mechanism

On a new run: for each existing Interpretation, recompute the fact set for its scope. If `generatedAgainstFactSet` is a superset-equal match against the newly extracted fact set for that scope, the Interpretation is still valid — reused, not regenerated, zero LLM cost. If not, mark it `stale` and queue that scope for regeneration. Regeneration produces new Interpretation(s) with `supersedes` pointing at the stale one(s) — history is append-only, nothing is deleted, `humanOverride` on a superseded Interpretation is a signal (not a guarantee) that the new one should be checked against it before being trusted blindly.

This requires one full baseline run to exist before it does anything — day-one cost is unchanged; the saving is entirely on run 2 onward.

### Document rendering

A Document request for a given scope (e.g., "give me `building_door`'s profile") pulls all `current`-status Interpretations for that scope plus any directly-relevant Facts/Relationships, and makes one LLM call whose job is *narration of already-decided claims*, not re-deriving them. This call is structurally simpler and almost certainly cheaper than today's synthesis call, because it's formatting decisions, not making them.

### Citation validation, simplified

Today's citation-validator runs *after* generation, parsing prose for citation-shaped substrings and checking them against real facts (a regex-based generate-then-verify pattern, because there's no clean path from free text back to fact IDs). Under this model, `evidence: FactId[]` is a structural field required at Interpretation creation time — an Interpretation citing a fact ID that doesn't exist is a schema violation, rejectable at write time rather than caught after the fact by parsing prose. Strictly stronger, and removes an entire class of parsing fragility (e.g., the abbreviated-fact-ID problem this pipeline already hit once in practice).

## What this claims to solve, from your own list

- **Canonical representation** — Facts/Relationships/Interpretations, not Documents. Documents are a projection.
- **What's persisted** — all four types; specifically, Interpretations (the thing that didn't exist as a persisted object before) and human overrides on them.
- **When reasoning happens** — Interpretation generation is diff-triggered (only when a scope's fact set actually changed); Document rendering is on-demand, decoupled from any CI/CD trigger entirely.
- **How knowledge evolves** — append-only Interpretation history via `supersedes`; nothing overwritten, staleness is explicit and visible.
- **Confidence granularity** — attached to Interpretations specifically (the "observation" level in your framing), not to Facts (don't need it — true by construction) or Documents (inherited, not independently assigned).

## Where this is weakest — please find more

1. **Holistic claims resist atomization.** "This module's error-handling is inconsistent with the rest of the app" doesn't cleanly reduce to citing 3-5 fact IDs — it's a judgment across everything in scope. Does this model degrade gracefully for that kind of claim, or does it just push it back into being an undifferentiated Document-level narrative synthesis anyway, defeating the point?
2. **Cascade decisions above capability level are unspecified.** If one capability's Interpretations go stale, does that automatically stale the module-level Interpretations that were partly built from it? If yes, staleness could cascade far more often than intended, eroding the incrementality benefit. If no, module-level claims can silently go stale without anything flagging it.
3. **Does this actually reduce total LLM calls, or just relocate them?** Interpretation generation still requires an LLM call per changed scope; Document rendering adds a *new* LLM call that didn't exist before (today's synthesis call directly produces the document — this model splits that into two calls). Under what change-frequency assumptions does the split pay for itself versus just adding overhead?
4. **Cross-repo/cross-language scopes** (proposed separately, not detailed here) would need Facts and Relationships to exist at that scope too — via each repo exposing a deterministic "contract surface" (API schemas, message-broker topics) rather than compiler-resolved symbols. Does the Interpretation/Document split above still hold at that scope, or does cross-repo synthesis need a genuinely different mechanism?

Attack any or all of these, or ones we haven't listed.
