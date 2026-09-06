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

## Real design note, 2026-09-06: the 92→42 cross-repo symbol ambiguity is deliberately deferred to the agent layer, not solved inside `walk_cluster`

Discussed directly, not assumed: the real question for each of the 42 genuinely-divergent cross-repo `TypeName.field` symbol_names (see [[project_workflow_clustering_and_angular_ux]] / `15-...md`) isn't just "which declaration is correct" — it's a prior question, "are these even the same real thing." Checked one concretely: `OSKUserSettings.notifications`/`.global` looked like the same entity redeclared with drift, but its real sibling-field content (Firebase: `organizationInvitationReceived`, `residentsNotificationReceived`, etc. — real, familiar invitation/resident vocabulary seen elsewhere all session; Angular: `friendRequestReceived`, `friendRequestApproved` — a concept that appears nowhere else in this entire domain) suggests a genuine naming collision between two different concepts, not one entity that drifted. A blind tie-break rule is the wrong kind of fix for a collision — there's no "correct" side to pick between two unrelated things.

**Real, checkable next step, not yet built:** before any tie-break logic, a cheap sibling-field-divergence check (compare *all* fields declared on both sides of a symbol_name match, not just the one ambiguous property) would likely reclassify some of the 42 as "name collision" rather than "drift," the same way the 92 count was itself corrected down to 42 by filtering import-path noise.

**Deliberate decision: defer full resolution to the agent layer for now, not to `walk_cluster` itself.** Whether a given real chain means "the Angular flavor" or "the Firebase flavor" of a collided symbol depends on which real chain is being walked — the module/repo it started from, the actor/flow involved — exactly the kind of contextual judgment an agent reasoning about one specific real request can make, and a universal, context-free rule baked into the tool layer cannot. `walk_cluster`'s own behavior when it hits one of these: **surface both declarations, clearly labeled by repo, never silently merge or guess** — same "never guess when ambiguous" discipline already proven elsewhere in this pipeline. Real, useful side effect of running `walk_cluster` for real (Step 2): each time it actually hits one of the 42, that's a real data point toward understanding whether a given case is a bug, a stale fork, a genuine naming collision, or legitimate divergence — learned from real occurrences, not solved speculatively ahead of time.

## Candidate future work, not scheduled — surfaced 2026-09-06, real enough to record now

Two real ideas, both direct extensions of work already done, not new invented scope:

1. **Surface cross-repo divergence findings transparently in agent output, not just resolve them silently.** When an agent's evidence passes through one of these collided/divergent symbols, its output should be able to say so plainly — "this reference may indicate a naming collision, stale code, or a real divergence between repos, not yet resolved" — the same honesty discipline this project already applies via `evidence_basis: fact_derived | human_asserted_out_of_system` (`building-workflows/01-workflow-seeding-tasklist.md`) and the citation-only-from-real-evidence rule. Not a new mechanism, an extension of one already built.
2. **A dedicated "corpus stability" report as a candidate new agent persona** — systematically walking the graph looking for exactly this class of finding (cross-repo type collisions, redeclared symbols, possible stale forks) and producing a standalone report about the *codebase's own internal consistency*, independent of any specific PM request. This is, concretely, **ADR-005's third leg** ("a separate proactive sanity/health-report generator... not started until 1-5 are real and verified") — deferred since ADR-005 was written, now with a real, non-speculative starting point (the 42 real divergences already found) instead of an abstract goal. Not scheduled — recorded here so it isn't lost, to be picked up once the first persona (Step 5) is proven.
3. **A reactive complement to the above two, surfaced 2026-09-06: a human-feedback link on every generated output artifact.** Idea, as given directly: every PRD/impact-report/whatever an agent persona produces carries something like "anomalies found in this output? click here" — a link to a page where a reader enters what's wrong, which gets logged and reported alongside the original output for human review. Real, deliberate distinction from item 2 above: that's *proactive* (scan the graph for anomalies before anyone asks); this is *reactive* (capture real signal from the people actually reading and using the outputs, who may notice something no automated graph-walk would catch — a wrong business inference, a stale reference doc, a citation that's technically real but contextually misleading). Matches the human-in-the-loop discipline this project already leans on (LLM drafts, human confirms — `governance/roadmap/market-research/01-findings-2026-09-05.md` angle 2 found this is a real, regulation-backed 2026 norm, not just a nice-to-have). A real, concrete secondary benefit: the resulting flagged-anomaly log becomes genuine, ground-truth input *for* item 2's corpus-stability report — real human-sourced signal about what's actually wrong, not just what an automated walk can structurally detect, and a plausible additional trust-tier signal for the `evidence_basis`/`generationMethod` provenance fields already designed (a fact or edge with a history of being flagged is a real, different reliability signal than one with none). Not scheduled, not designed in detail (where the log lives, what the review workflow looks like) — recorded here alongside its two siblings.
4. **A real refinement to item 2, surfaced 2026-09-06: persist anomalies with an occurrence counter, not just a flat detected-once list.** Good idea — turns a static list into a prioritized one: an anomaly a real chain hits constantly is a different, more urgent problem than one that's technically true but never actually gets walked into. **Real schema implication, confirmed not hand-waved:** today "ambiguity" isn't a persisted thing at all — it's derived fresh, on demand, via a `GROUP BY`/`HAVING` query over `facts` (the exact query used to find the 42). Counting occurrences needs a genuine new table, not a bolt-on column — a stable identity per anomaly (e.g. `symbol_name` + the specific conflicting repo set), an incrementing count, and `first_seen`/`last_seen` timestamps. **One real nuance to resolve before building, not glossed over:** "every time it appears" has at least two different, non-interchangeable meanings worth counting separately — a real agent chain actually walking through the anomaly during a live request (usage frequency, arguably the more valuable signal — tells you it's load-bearing) versus a scheduled corpus-stability scan re-detecting the same still-present divergence (persistence over time — tells you it hasn't been fixed, not that anyone's hit it). Conflating the two into one counter would blur "this is actively causing problems" with "this is still true but nobody's touched it." Not scheduled, not designed in detail — recorded alongside items 2 and 3, which it directly strengthens (item 3's human-flagged log and item 2's automated re-detections could both feed the same per-anomaly counter, kept as separate columns per the nuance above).

**A further, real requirement noted 2026-09-06, deliberately not designed now:** a persisted, counted anomaly needs a real lifecycle, not just a number that only ever goes up. Whatever states are actually needed (resolved, dismissed as a false positive, paused/snoozed, accepted as intentional and not worth re-flagging) should be figured out when this is actually built, against real anomalies and real review behavior — not designed speculatively now, same discipline as everything else in this section.

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
