# MCP Tool Server & First Agent Persona — Build Tasklist

**Status:** Sketched 2026-09-06, not started. Direction agreed in `governance/adrs/adr-007.md` (Proposed, not decided) — this doc is the concrete build plan for that direction, not a separate decision.

## Why this exists

`adr-007.md` records the real reasoning: replace hardcoded, task-specific pipelines (`generate-atomic-prd.ts` and its siblings) with a thin, generic MCP tool layer plus task-specific agent personas, built portably (MCP) but deployable inside Gemini Enterprise (the real, committed delivery constraint). This doc turns that direction into concrete, sequenced build steps.

## Step 1 — Build the three tools locally, no deployment yet

Create `pipeline/facts-postgres-index/mcp-server/`, using Google's Genkit MCP plugin (`@genkit-ai/mcp`) — TypeScript, matches this codebase's existing language, Google-maintained (the GCP-delivery-relevant choice over Anthropic's own SDK, per `adr-007.md` §1e), with an official Cloud Run deployment path already documented.

Three tools, each a thin wrapper — no new retrieval/graph logic, only adaptation:
- `search_facts` — wraps `_shared/search.ts`'s `search(query)` directly.
- `get_graph_neighbors` — wraps `_shared/graph-traversal.ts`'s `expandWithGraphNeighbors()`.
- `walk_cluster` — wraps `_shared/graph-traversal.ts`'s `walkBoundedCluster()` (built and reframed as a generic tool 2026-09-05, never yet run against real data — this is also this function's first real test).

Folder shape (per the earlier discussion, not yet built):
```
pipeline/facts-postgres-index/mcp-server/
  src/
    index.ts
    tools/
      search-facts.ts
      get-graph-neighbors.ts
      walk-cluster.ts
  Dockerfile
  README.md
```

New dependencies go in the existing root `package.json` — deliberately not splitting into a separate workspace/package.json yet, per the same "don't add complexity before it's needed" discipline this project has followed all session.

## Step 2 — Local, stdio-transport testing against the real local Postgres

Run the server locally over stdio (no container, no cloud) against the existing `facts-postgres-index-local` docker-compose instance — zero new local infrastructure, same `Pool()`/env-var pattern every other script in this pipeline already uses.

Verify each tool directly, two ways:
1. A small MCP client test script (same spirit as this session's own `_test-*.ts` diagnostics, but calling through the MCP layer, not the functions directly) — confirms the protocol wrapping itself is correct.
2. Point a real MCP-capable client (Claude Code or Claude Desktop) at the local server and interact with it directly.

**Real test, not just "it responds":** re-run this session's own known cases through `search_facts` and `get_graph_neighbors` and confirm they return the same real data already verified by hand — `OSKInhabitantOnboardingCardRequest.inhabitantType` findable via `search_facts`, its `FIELD_BINDING` edge to `OSKCreateOrganizationInhabitantComponent` findable via `get_graph_neighbors`. If `walk_cluster` is exercised here for the first time, check its real output against a known anchor (the same pilot case named in the now-superseded `building-workflows/01-workflow-seeding-tasklist.md` — the owner/tenant/resident flow) before trusting it further.

## Step 3 — Containerize and deploy to Cloud Run

Write the `Dockerfile`, deploy per the official Google Codelab pattern (*"Build and deploy an ADK agent that uses an MCP server on Cloud Run"*). Real transport switch here, not assumed identical to Step 2: remote runs over HTTP (Streamable HTTP transport), not stdio. Test this explicitly — same tool calls as Step 2, now over the network, before trusting the remote deployment.

**Real, open question, not resolved here:** what Postgres instance does the deployed server point at? The local docker-compose instance is explicitly "NOT the production data store" (per its own compose file comment). A real Cloud SQL (or equivalent) instance needs to exist before this step is meaningful beyond a connectivity test — not yet decided when/how that gets provisioned.

## Step 4 — Register with Gemini Enterprise as a Custom MCP Server data store

Per Google's own documented flow (`docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server`), an administrator registers the deployed server's URL as a Custom MCP Server data store, which imports its tool catalog. Verify the three tools appear correctly and are callable from within Gemini Enterprise itself before building anything on top.

## Step 5 — Design and build the first agent persona: `atomic-prd-agent`

The first real test of the "new task type = new persona file, not new code" claim in `adr-007.md`. Needs, at minimum (not yet designed in detail):
- Process instructions: read the business request; decide whether it's a breadth/impact-analysis question or a specific-flow question (the real distinction the reranking test surfaced); search and/or narrow accordingly; only cite real fact_ids that came back from a tool call, never invented.
- Which context docs to read first (the three reference docs from the facts-serving-strategy Task 3 plan, if that work is folded in here — see the outstanding-work review below).
- The output template — same Layer 1/2/3 shape the current `generate-atomic-prd.ts` pipeline produces, so results stay directly comparable to everything already measured this session.

Build via Gemini Enterprise's Agent Designer (low-code, natural-language agent definition) as the first attempt, per `adr-007.md` §1e — falling back to ADK only if Agent Designer proves insufficient for the process logic needed.

## Step 6 — Verification: re-run Q1a/Q1b through the real agent, not a diagnostic script

The concrete test: does the `atomic-prd-agent`, reasoning for itself with the three tools, produce evidence and a proposal that closes **both** Q1a's and Q1b's gaps at once — the thing no single hardcoded pipeline configuration managed this session (`RESULT_LIMIT` closed part of Q1a; the reranking test closed Q1b; neither closed both together, because neither could adapt its own strategy per query).

Compare directly against the real outputs already on record: `output/atomic-prds/add-ownernonresident-inhabitanttype.md`, `output/atomic-prds/assign-building-unit-to-ownernonresident.md`, and their pre-fix originals in `output/atomic-prds/_before-2026-09-05/`.

## Open questions, not resolved here

- Production Postgres/data-store provisioning (Step 3's real gap) — not decided.
- Exact agent-persona file format/schema — not yet designed, first real attempt happens in Step 5.
- Whether this replaces `generate-atomic-prd.ts` outright or runs in parallel during a transition — not decided (per `adr-007.md` §4).
- Cost/latency of the deployed, real (non-local) version — not measured yet.

## Verification plan

1. Step 2's local tool tests reproduce known-correct results by hand-checked comparison.
2. Step 3's remote deployment reproduces the same results over HTTP as Step 2 did over stdio.
3. Step 4's Gemini Enterprise registration correctly imports and can call all three tools.
4. Step 6 is the real, decisive test: both Q1a and Q1b close, in one persona, without per-query hardcoded tuning.
