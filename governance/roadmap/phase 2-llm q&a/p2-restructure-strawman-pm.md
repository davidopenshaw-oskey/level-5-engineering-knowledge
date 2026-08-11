# Strawman: From "Regenerate Documents" to "Maintain a Small Database of Claims"

*Plain-language walkthrough of a candidate answer to OpenAI's and Gemini's shared question: what should Phase 2 actually persist, and when should it re-think something versus reuse what it already decided?*

## The core shift, in one sentence

Today, Phase 2's output *is* a document (a profile, an API reference) — the document is the product. The proposal: make the product a small, structured set of individually-checkable **claims, each with its evidence attached**, and treat documents as something we generate *on request* from those claims — not something we permanently store as the source of truth.

## A worked example

Take one real capability we've already generated documentation for: `building_door` (the module handling building entry doors).

**Today:** one LLM call reads that capability's raw facts and writes a full narrative markdown document — several paragraphs of prose, citations woven into sentences, no way to check or update one sentence without regenerating the whole thing.

**Proposed:** that same LLM call still does real synthesis work, but instead of writing paragraphs, it produces a handful of individually-addressable claims, each looking something like:

> Claim: "`building_door` is called into by 5 other submodules plus the module root, making it a structural hub within `building`."
> Confidence: Confirmed
> Evidence: [5 specific call-edge facts, already known and already have stable IDs]

> Claim: "The `OSKBuildingDoorController` class appears to be the true owner of door-related Firestore data."
> Confidence: Inferred
> Evidence: [the ownership-hint signal, plus 2 specific Firestore-access facts]

Each of these is a small, structured record — not a paragraph. The *document* — the readable markdown a person actually reads — gets generated afterward, on demand, by taking the current set of claims for that capability and writing them up as prose. That final write-up step is cheap; it's turning already-distilled claims into readable sentences, not re-deriving the claims from raw facts.

## Why this matters for cost, concretely

Right now, if nothing about `building_door` changes, we still pay to fully re-synthesize it on every run. Under the proposed model: each claim knows exactly which underlying facts it depends on (the evidence list above). If none of those facts changed since the last run — because the merge that triggered this run touched a different module entirely — the claim is still valid. Nothing gets re-generated. Only capabilities whose underlying facts actually changed need a new LLM call at all. The document, if anyone asks for a fresh one, gets re-rendered from a mix of unchanged and updated claims.

This is the "diff" idea already in mind, made concrete: the unit of change isn't "the whole module changed or it didn't" — it's "did the specific facts this specific claim depends on change." Note this still needs a full first-generation run to exist before there's anything to diff against — it doesn't remove that requirement, it makes the second and every subsequent run cheaper.

## What this doesn't cleanly solve — being honest about it

Not every useful claim reduces neatly to a short list of cited facts. Something like "this module follows a request/response pattern consistent with the rest of the app" is a holistic judgment across everything in the module, not a claim about five specific facts. Those broader observations probably still need to be synthesized more like a document than a claim — this model doesn't eliminate narrative synthesis, it shrinks how much of it needs to happen, and how often.

## What this would take to actually build

A place to store claims (not just generate and discard them into a document), a way to know which facts a claim depends on (we already have stable fact IDs from Phase 1 — this reuses them), and a check that runs before regenerating anything: "did the facts this claim cites actually change?" None of this exists yet. It's a genuinely different shape from what's running today, not a tuning pass on it.
