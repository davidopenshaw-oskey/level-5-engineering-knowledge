# Real check: does @genkit-ai/mcp support prompts/resources, not just tools? — 2026-09-07

Research/understanding-phase question raised during the "dynamic document types, no recompile" discussion (Task 1 follow-on, same session as `21-task1-mcp-server-repo-root-move-2026-09-07.md`). Checked directly against the installed package, not assumed.

## Finding: yes, both are supported today

`node_modules/@genkit-ai/mcp` v1.42.0. `GenkitMcpServer` (returned by `createMcpServer(ai, options)`, the exact function `mcp-server/src/index.ts` already uses) carries `toolActions`, `promptActions`, **and** `resourceActions`, and its `setup()` registers MCP request handlers for all three families: `listTools`/`callTool`, `listPrompts`/`getPrompt`, and `listResources`/`readResource`/`listResourceTemplates`. The package's own doc comment on `createMcpServer`: "All tools and prompts will be automatically converted to MCP compatibility."

On the Genkit core side (`node_modules/genkit`):
- `ai.definePrompt(...)` — stable API (`genkit/lib/index-*.d.ts`, the main `Genkit` interface).
- `ai.defineResource(...)` — **beta API only** (`genkit/lib/genkit-beta.d.ts`), requires importing the beta Genkit surface. Real caveat: not yet the stable interface, worth re-checking before depending on it for anything durable.

Client-side (relevant only if this project ever builds an MCP *client*, not just the server): `@genkit-ai/mcp`'s `util/prompts.ts` (`registerAllPrompts`, `fetchAllPrompts`) and `util/resource.ts` (`fetchDynamicResources`) exist too — prompts/resources fetched from a remote MCP server can be registered back into a local Genkit instance.

## Why this matters (context from the discussion that prompted the check)

This unblocks the architectural direction discussed for making document-type addition genuinely dynamic (new template + skill file, no code/redeploy) without waiting on a hypothetical protocol gap:

- **MCP prompts** are the idiomatic fit for "job name" as a discoverable, parametrized selector (`prompts/list`, `prompts/get`) — better fit than a tool parameter, since persona/skill selection logically happens before tool-calling starts, not mid-reasoning.
- **MCP resources** are the natural home for the user's "context pack" concept (shared business-personas/architecture/DB-schema reference docs, decoupled from any one job's skill+template pair) — and possibly for serving the skill/template file contents themselves.

Not yet decided or built: whether to actually adopt prompts/resources in `mcp-server/src/index.ts` (today it only calls `ai.defineTool`, three times) versus the simpler directory-scan job-registry alternative discussed in the same conversation. Both remain live options; this finding just confirms the protocol-native path is real and available, not blocked by tooling.

## What was NOT checked

- Whether `defineResource`'s beta status carries any real behavior instability (only checked that it's in the beta type surface, not exercised at runtime).
- Whether Cloud Run / HTTP transport (the project's intended remote deployment target, per ADR-007 §2.5) handles prompts/resources identically to the stdio transport used for local dev — not tested, not assumed.
