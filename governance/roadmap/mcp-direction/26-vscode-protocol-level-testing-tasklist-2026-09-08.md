# Real protocol-level MCP server testing — tasklist — 2026-09-08

Real, scoped-down build task, user-directed: close the one gap `25-post-move-verification-closed-2026-09-08.md` explicitly left open — every real test so far (pre-move baseline, all three post-move runs) called `search_facts`/`get_graph_neighbors`/`walk_cluster` as plain in-process TypeScript functions via `atomic-prd-agent.ts`, never through the actual MCP protocol (`mcp-server/src/index.ts`, `@genkit-ai/mcp`'s `createMcpServer`, stdio transport). That layer has only ever had a boot smoke test (`21-...md`: process stays alive, zero stderr) — never a real tool call over the wire. Also closes open item 5 from `19-session-handoff-2026-09-07.md` / `20-...md` (VS Code MCP integration, offered twice, never built).

User chose this scope explicitly over Steps 3-4 (Cloud Run + Gemini Enterprise) when asked — those stay benched.

## Step 1 — A real, scriptable MCP client test (this session, automatable, no manual UI needed)

Real dependency already present: `@modelcontextprotocol/sdk@1.30.0` (`node_modules`), which carries a real `Client` + `StdioClientTransport` — exactly what Step 2 of `01-mcp-tool-server-tasklist.md` calls option 1 ("a small MCP client test script... confirms the protocol wrapping itself is correct").

Build a small, temporary script (`mcp-server/_test-mcp-client.ts`, deleted once this task's findings are written up, per this project's own diagnostic-script discipline) that:
1. Spawns `mcp-server/src/index.ts` as a real child process via `StdioClientTransport` (same command as `mcp-server/README.md`'s documented local-dev command: `node -r ts-node/register mcp-server/src/index.ts`).
2. Calls `tools/list` — confirms the server advertises exactly `search_facts`, `get_graph_neighbors`, `walk_cluster` with the expected schemas, over the real protocol.
3. Calls `search_facts` with a real, already-verified case and diffs the result against the known-good answer on record: `query: "inhabitantType onboarding card request"` should return `OSKInhabitantOnboardingCard.inhabitantType` and siblings with `confident: true` (`04-step1-2-mcp-server-built-and-verified-2026-09-06.md`).
4. Calls `walk_cluster` on the known pilot anchor with its known-good expected shape on record (`03-walkboundedcluster-real-verification-2026-09-06.md`): anchor `angular_template_attribute|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|formControlName|#3` → expect **2 members, 2 edges, `truncated: false`**, real chain to `OSKInhabitantOnboardingCardRequest.inhabitantType` via `FIELD_BINDING`.
5. Calls `get_graph_neighbors` on the same anchor as a single-hop cross-check against `walk_cluster`'s result.

Real pass bar: all three tools resolve over the actual MCP protocol (JSON-RPC over stdio, not a direct function call) and reproduce the exact real results already on record above — not just "responds without error."

## Step 2 — VS Code native MCP client wiring

Create `.vscode/mcp.json` at the repo root, a real, minimal stdio server entry pointing at the same documented local-dev command. No Vertex AI config needed here — unlike `atomic-prd-agent.ts`, the raw MCP server (`src/index.ts`) never calls an LLM itself, only Postgres (`PG_HOST`/`PG_PORT`/etc., already defaulting to the real local `facts-postgres-index-local` container on `5433`, matching every other script in this pipeline). No env overrides needed for local dev.

Real verification here needs the user directly, not automatable the way Step 1 is: open VS Code's MCP/tools panel, confirm the server appears and its three tools are listed, and run at least one real tool call from inside the editor's own UI — a genuinely different code path (VS Code's own MCP client implementation) than Step 1's SDK-based script, so it's a real, independent second data point, not a duplicate check.

## What this does not cover

Steps 3-4 of `01-mcp-tool-server-tasklist.md` (Cloud Run deployment, Gemini Enterprise registration) — still benched, not part of this task per the user's explicit scope choice this session.
