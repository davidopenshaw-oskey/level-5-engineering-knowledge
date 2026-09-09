# Real MCP-protocol-level test passed — 2026-09-08

Step 1 of `26-vscode-protocol-level-testing-tasklist-2026-09-08.md`, closing the one gap every prior test this week left open: nothing had ever called `mcp-server/src/index.ts` through the real MCP protocol (JSON-RPC over stdio, `@genkit-ai/mcp`'s `createMcpServer`) — every test so far (pre-move baseline, all three post-move `atomic-prd-agent.ts` runs) called `search_facts`/`get_graph_neighbors`/`walk_cluster` as plain in-process TypeScript functions, bypassing the protocol layer entirely. Only a boot smoke test (`21-...md`) had touched the real server process before this.

## What was built and run

`mcp-server/_test-mcp-client.ts` — temporary script, `@modelcontextprotocol/sdk@1.30.0`'s real `Client` + `StdioClientTransport`, spawning the real `node -r ts-node/register mcp-server/src/index.ts` process exactly as documented in `mcp-server/README.md`. No LLM involved (the raw MCP server never calls Vertex AI — only `atomic-prd-agent.ts` does) — zero real spend for this test. Deleted after this write-up, per this project's own diagnostic-script discipline.

## Real result: all three tools pass, over the real protocol, against known-good answers already on record

- **`tools/list`**: returns exactly `search_facts`, `get_graph_neighbors`, `walk_cluster` — no more, no fewer.
- **`search_facts("inhabitantType onboarding card request")`**: `confident: true`, real top results include `OSKInhabitantOnboardingCard` and `OSKInhabitantOnboardingCard.inhabitantType` — matches the known-good result from `04-step1-2-mcp-server-built-and-verified-2026-09-06.md`.
- **`walk_cluster`** on the known pilot anchor (`OSKCreateOrganizationInhabitantComponent`'s `inhabitantType` `formControlName` fact): **2 members, 2 edges, `truncated: false`** — exact match to `03-walkboundedcluster-real-verification-2026-09-06.md`'s recorded result, including the real detail that both edges are `FIELD_BINDING` duplicates (a pre-existing, already-understood real shape, not a new bug introduced by the move or the protocol layer).
- **`get_graph_neighbors`** on the same anchor, as a single-hop cross-check: returns the same real target fact (`OSKInhabitantOnboardingCardRequest.inhabitantType`) with one outgoing `FIELD_BINDING` connection — consistent with `walk_cluster`'s own result.

## Real conclusion

The real MCP protocol wrapping (`@genkit-ai/mcp`'s Zod-schema-to-MCP-tool conversion, JSON-RPC serialization, stdio transport) introduces no corruption or divergence versus the direct-function-call path every other test this week used. Combined with `25-post-move-verification-closed-2026-09-08.md` (the moved `mcp-server/db/` code reproduces real pre-move data through `atomic-prd-agent.ts`), this closes the real gap: the relocated MCP server is now verified correct **both** at the tool-function level and at the actual protocol level it will really be called through.

## Real, still-open item

Step 2 of `26-...md` — VS Code's own native MCP client, wired via `.vscode/mcp.json`, run and confirmed directly by the user in the editor. A genuinely different code path (VS Code's own MCP client implementation, not `@modelcontextprotocol/sdk`'s reference client used here) — not fully redundant with this test, and not something this session can drive or observe on its own.
