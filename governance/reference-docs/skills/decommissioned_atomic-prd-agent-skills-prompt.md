write a prd skill file for an agent. do not look into this repository for ideas.

These are important tasks and instructions the agent will need in the skill file.

The agent will be using an mcp which exposes three tools available to use for finding facts about the the repositories (`search_facts`, `get_graph_neighbors`, `walk_cluster`).

**search_facts**
Search facts is the discovery tool — semantic/vector search that turns a natural-language or technical query into ranked candidate fact_ids, each with a confident flag. It's how you find an anchor, not how you trace relationships.

**get_graph_neighbors**
get_graph_neighbors takes one or more real fact_ids you already have as anchors and returns their direct (one-hop) connections — the other facts linked to them via cross_repo_edges (calls, API bindings, field bindings, pub/sub topic bindings). It doesn't search or rank anything; it's a lookup, not a discovery step, so it only ever returns what's actually adjacent to the anchors you pass in. Compared to walk_cluster, it's the single-hop version — useful when you just want to see what immediately touches a fact you've found, rather than tracing a whole chain outward.

**walk_cluster starts**
walk_cluster is the discovery tool from one real fact_id (an anchor) and does a bounded, cycle-safe breadth-first walk outward from it — both directions (what calls into it, what it depends on), multiple hops deep, not just one. It reuses the same underlying neighbor-lookup get_graph_neighbors uses, just repeated outward until it hits a depth cap or a size cap. Because it's capped, it carries a truncated flag — if true, the walk hit its limit before exhausting the real graph, most often because it ran into a high-fan-out "hub" node (something like a shared logging or generic controller method with an unusually large number of connections), so the returned cluster may be a partial, not complete, picture of the real chain.

**Understanding the output from the tools**
With these tools they gather real, code-derived evidence that has been extracted using AST Tools and techniques. This grounds the information as factual evidence. The Agent can produce a grounded technical response — never invent a fact, a fact_id, or a code behavior. All facts, fact_id's and code behaviour exists in the MCP tools responses.


**Cite only real evidence:**
- Every claim in your technical proposal and every constraint must cite the real `fact_id`(s) that support it, taken verbatim from a tool result you actually received this conversation.
- Never cite a fact_id you have not seen returned by a tool call. If you don't have evidence for a claim you'd like to make, drop the claim rather than inventing support for it.

**Output**
Produce a single JSON object: `{ "sections": [{ "heading": "string", "content": {...} }, ...] }`. Fill in exactly the headings your template names, in the order it names them — nothing more, nothing missing, nothing renamed. Which headings you'll be asked for, and which of the four content kinds each one takes, comes from the real template file wired into this run.

Each `content` object is tagged by `kind`, one of exactly four:

```json
{ "kind": "prose", "text": "string" }
{ "kind": "list", "checkable": true, "items": ["string", "..."] }
{ "kind": "cited-list", "items": [{ "claim": "string", "evidenceIds": ["real fact_id", "..."] }] }
{ "kind": "user-stories", "items": [{ "actor": "string", "goal": "lowercase, no leading 'to', no trailing period", "reason": "lowercase, no trailing period" }] }
```

Every `evidenceIds` entry in a `cited-list` must be a real `fact_id` copied verbatim, in backticks, exactly as a tool returned it — not paraphrased, not reformatted, not shortened. Never cite a `fact_id` you have not seen returned by a tool call this run.

You will not be asked to produce every heading a rendered document shows. Some headings are filled in automatically from real, code-computed data — they are never part of what you're asked to generate, and you don't need to think about them.