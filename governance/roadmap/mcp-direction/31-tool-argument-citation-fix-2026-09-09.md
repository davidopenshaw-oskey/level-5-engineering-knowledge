# Tool-argument citation fabrication — third distinct shape found, fix applied — 2026-09-09

Real fix applied to `mcp-server/skills/prd/skill.md`, following on from the intercom post-relocation test run that surfaced a third distinct shape of the citation-fabrication weakness first found in `23-...md`/`24-...md`.

## The real finding this fixes

Re-running the intercom home-button business request after the skills/template relocation (`mcp-server/skills/prd/`) hit a `walk_cluster` fail-closed error on a fabricated anchor argument. Checked directly against Postgres, not assumed:

```
REAL factId:      function_declaration|app|app/src/main/java/io/oskey/intercom/OSKApplication.kt|customConfiguration|OSKApplication|#1
REAL description: function_declaration in app: customConfiguration -- returns: OSKCustomConfiguration? (app/src/main/java/io/oskey/intercom/OSKApplication.kt:56)
FABRICATED:       function_declaration|app: customConfiguration -- returns: OSKCustomConfiguration? (app/src/main/java/io/oskey/intercom/OSKApplication.kt:56)
```

The fabricated string is the real `description` field, character-for-character, with exactly one substitution: `" in "` → `"|"` — a cosmetic edit to make the description superficially resemble a pipe-delimited fact_id. The model had the real `factId` in the same tool result and used the wrong field instead. Confirmed not caused by the relocation (paths resolved correctly) or the pgvector re-embed (unrelated fact, unrelated enrichment) — pure model-side field confusion, same general class as `24-...md`'s backtick bug and `23-...md`'s wrong-module-segment case, but a third distinct shape: reformatting `description` into something ID-shaped, rather than reformatting a real `factId`.

## The real, generalizable gap identified

The persona's existing "Cite only real evidence" rules are written specifically about *final citations* in the output document — they never said the same discipline applies to constructing *tool-call arguments* mid-conversation (a `walk_cluster` anchor, a `get_graph_neighbors` factIds array). A scope gap, not a wording ambiguity this time.

## The fix

Added to `mcp-server/skills/prd/skill.md`'s "Cite only real evidence" section:

> This applies everywhere a fact_id is used, not only in final citations — including as an argument to `walk_cluster` or `get_graph_neighbors`. A tool result's `factId` field and its `description` field are different things: `factId` is the real, exact identifier; `description` is human-readable text about it. Never reformat a `description` to look like a `factId` (e.g. swapping words for `|` characters) — always copy the real `factId` field itself, verbatim, or search again if you don't have it.

Names the actual failure mode directly (reformatting `description`) rather than a generic restatement of "don't invent things" already stated three lines above it.

## Real, honest verification status: not yet confirmed

Two attempts to re-run the intercom case against this fix both failed to complete for unrelated reasons — one killed by a local 5-minute tool timeout mid-run (genuinely still searching, not stuck), one killed by the real Vertex AI 429 quota wall (`30-intercom-quota-blocker-pause-2026-09-09.md`). **Whether this fix actually holds is still an open question, not a confirmed result.** Revisit once the quota blocker is addressed.
