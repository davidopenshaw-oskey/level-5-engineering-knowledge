# Step 1 & 2 — MCP Server Built and Verified Over Real Stdio — 2026-09-06

**Purpose:** record what was actually built and tested for Steps 1-2 of `01-mcp-tool-server-tasklist.md`, following the prerequisite closure recorded in `03-walkboundedcluster-real-verification-2026-09-06.md`.

## What was built

1. **`search()` gained an optional `limit` parameter** (`_shared/search.ts`). `RESULT_LIMIT` renamed `DEFAULT_RESULT_LIMIT`, kept as the default for a caller that doesn't pass one — `generate-atomic-prd.ts`'s existing `search(QUERY)` call is unaffected. Confirmed via `npx tsc --noEmit` against the whole `pipeline/` tree (repo's own `tsconfig.json`), and confirmed only one real caller existed before making the change (grepped for it first).
2. **`pipeline/facts-postgres-index/mcp-server/src/index.ts`** — the three tools (`search_facts`, `get_graph_neighbors`, `walk_cluster`) exactly as specified in the tasklist's Step 1 code, using Genkit's MCP plugin.
3. Dependencies installed at the repo root (`@modelcontextprotocol/sdk`, `genkit`, `@genkit-ai/mcp`, `zod`, `express`) — no separate workspace, per the tasklist's explicit "don't split into a separate package.json yet" note.

## Real API verification, not assumed correct from the tasklist's own citation

Before running anything, checked the actually-installed `@genkit-ai/mcp@1.42.0`'s own `.d.ts` directly: `createMcpServer(ai, {name, version})` returns a `GenkitMcpServer` with `.start(transport?)`, defaulting to stdio — matches the tasklist's assumed API exactly, not just trusted from the doc's citation.

## Real end-to-end test performed

A throwaway MCP client script (`_test-mcp-client.ts`, since deleted) spawned the actual server as a subprocess via `StdioClientTransport` and called it through the real MCP protocol — not by calling the wrapped functions directly. Real results:

- **`tools/list`** correctly returns exactly `['search_facts', 'get_graph_neighbors', 'walk_cluster']`.
- **`search_facts`** (`query: "inhabitantType onboarding card request"`) returned `confident: true` with real, on-topic results (`OSKInhabitantOnboardingCard.inhabitantType` and siblings) — the search logic itself is untouched, so this confirms the MCP wrapping (Zod schema, JSON serialization) doesn't corrupt the response, not a re-verification of ranking quality.
- **`get_graph_neighbors`**, given the known anchor (`OSKCreateOrganizationInhabitantComponent`'s `inhabitantType` `formControlName` fact), correctly found the real `FIELD_BINDING` edge to `OSKInhabitantOnboardingCardRequest.inhabitantType` — the exact known target case named in the tasklist's own Step 2 verification instructions.
- **`walk_cluster`**, given the same anchor, reproduced **exactly** the same 2-member, 2-edge result already verified directly (not through MCP) in `03-walkboundedcluster-real-verification-2026-09-06.md` — confirms the MCP tool wrapper is a transparent pass-through, not altering behavior.

This satisfies Step 2's two required checks (protocol-level client test; known-case reproduction) for `search_facts` and `get_graph_neighbors`, and reproduces `walk_cluster`'s already-verified output through the real MCP layer for the first time.

**Not yet done:** pointing an actual MCP-capable client (Claude Code / Claude Desktop) at the local server interactively — Step 2's second verification method. Recorded as open, not skipped silently.

## Cleanup

`_test-mcp-client.ts` deleted after this write-up, per this project's diagnostic-script discipline (`CLAUDE.md`). The server itself (`mcp-server/src/index.ts`) and its `README.md` are real, kept artifacts — not diagnostics.

## Status against the tasklist

Step 1: done. Step 2: done for the scripted-client check; interactive real-client check still open. Step 3 (containerize/deploy to Cloud Run) not started — real cloud spend, gated on an explicit checkpoint with the user per the tasklist's own note and this project's spend-flagging rule.
