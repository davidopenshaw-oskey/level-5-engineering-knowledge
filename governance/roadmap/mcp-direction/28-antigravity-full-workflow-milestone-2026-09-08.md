# Real milestone: full grounded workflow through Antigravity, verified against live Postgres — 2026-09-08

Closes out today's local-POC verification arc (`23`→`27`). After VS Code's Agent mode repeatedly fell back to reading files from disk instead of relying on the MCP tools alone (`24-...md`'s "why did it not fail yesterday" thread, and the two follow-on VS Code sessions), the user switched to Google Antigravity (v2.12.2) as a second real interactive MCP client. `27-protocol-level-test-passed-2026-09-08.md` had already confirmed a single, isolated `search_facts` call through Antigravity matched known real data with no disk-read contamination. This session went further: a full three-tool, persona-driven, LLM-synthesized run of the actual resident-departure-2a business request.

## What was built and run

`atomic-prd-agent-skills-antigravity-variation.md` — a self-contained variation of the canonical persona for this specific context (interactive chat has no code injecting a per-run template contract or a business request separately, unlike `atomic-prd-agent.ts`):
- The fixed persona content (already carrying the 2026-09-08 backtick-wording fix from `24-...md`).
- The template's "Required sections" contract statically baked in (copied from `renderTemplateContract()`'s real output for `atomic-prd.template.md`, since nothing computes it dynamically here).
- An explicit, added-for-this-context instruction: "Use only the `facts-corpus-server` MCP tools... do not read, search, or list any files" — defense in depth on top of Antigravity's own permissions restriction, given the real VS Code failure mode this session already hit.
- The exact, byte-for-byte resident-departure-2a business request, same text used in every prior run this week.

Pasted as one message into Antigravity's chat (Agent mode, tool picker scoped to `facts-corpus-server` only), it produced `output/agent-runs/prds/test/2026-09-08-001-Antigravity-MCP-ServerTest.json` — saved by hand by the user, not by `writeOutput()` (Antigravity has no path to that function, same as VS Code).

## Real verification performed — not just read the output and trusted it

**Citation integrity, checked directly against the live database, not the tool logs** (no `DEBUG_TOOL_LOG` capture exists for this run — Antigravity isn't the scripted client): every unique `fact_id` cited in the output's `cited-list` sections was extracted and checked one at a time against the real `facts` table in `facts-postgres-index-local` via `psycopg2`.

```
18 unique cited fact_ids
18 / 18 confirmed real in the DB
```

Zero fabrication. No backticks wrapping any fact_id (the `24-...md` fix held). No wrong-module-segment hallucination (the still-unexplained Run 1 failure mode from `23-...md` did not recur here either).

**Structural conformance**: exactly the four required headings (`User Stories`, `Technical Proposal`, `Acceptance Criteria`, `Constraints`), in the correct order, each with the correct `kind` — matches `checkTemplateConformance`'s real bar, even though that validator never actually ran (nothing in Antigravity's chat enforces it; this is an empirical pass on one real run, not a structural guarantee the way the governed pipeline provides one).

## One real, minor conformance deviation found

`Acceptance Criteria` items each carry a literal `"[ ] "` prefix baked into the string itself (e.g. `"[ ] A departure date and time field is added..."`). The real renderer (`section-content.ts`'s `renderSectionContent`) already prepends `- [ ] ` for any `checkable: true` list item — `content.items.map(i => (content.checkable ? \`- [ ] ${i}\` : \`- ${i}\`))`. Fed through the actual document-assembly code, this would double up: `- [ ] [ ] A departure date...`. Cosmetic, trivially stripped, but a real, concrete difference from every governed Vertex AI run this week, none of which added its own checkbox markup — a model-specific formatting habit, not a grounding problem.

## Real, still-open item

Which of the three tools actually got called (just `search_facts`, or the full `search_facts` → `walk_cluster`/`get_graph_neighbors` chain the persona's workflow describes) is not independently confirmed — no tool-call transcript was captured for this run, only the final JSON. The real cross-repo spread of evidence (angular-app-oskey-io UI facts, firebase-oskey-dev service/task facts, node-iot-api access-control-device facts, correctly chained together in the Technical Proposal's claims) is consistent with real multi-hop graph traversal having happened, not just repeated single-hop searches — but "consistent with" is not the same as confirmed the way `27-...md`'s scripted test confirmed it directly.

## Real conclusion

This is the strongest single result of the day: a full, persona-driven, three-tool-capable, LLM-synthesized generation, run through a real interactive MCP client, independently verified against live production-adjacent data with zero fabrication found. Combined with `25-...md` (moved code reproduces pre-move data) and `27-...md` (raw protocol layer verified), the relocated `mcp-server/` is now verified correct at three independent levels: function calls, raw protocol, and a full real-world interactive client doing genuine end-to-end grounded generation.
