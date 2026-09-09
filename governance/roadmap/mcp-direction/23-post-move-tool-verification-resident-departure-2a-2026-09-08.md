# Post-move tool verification — resident-departure-2a — 2026-09-08

Real test, per Task 1's own still-open verification gap: `21-task1-mcp-server-repo-root-move-2026-09-07.md`'s only post-move check was a boot smoke test (process stays alive, tool wiring resolves) — it did not exercise a real tool call end-to-end. This session ran the real `01-mcp-tool-server-tasklist.md` Step 2 test: re-run a known case through the moved code and compare against a real pre-move baseline.

## Setup

- Business request: exact text (byte-for-byte, copied from the pre-move baseline output's own "Business Request" section) of the resident-departure-2a PGO departure-date scenario, from `01-qa-vision-and-examples.md`'s Example 2a.
- Baseline compared against: `output/agent-runs/prds/test/2026-09-07-005-resident-departure-2a-tool-desc-fix-regression-test.md` (pre-move, same persona/template/business-request).
- Ran `mcp-server/agent-poc/atomic-prd-agent.ts` directly (not the MCP server itself — same as the baseline run) via `PERSONA_FILE=governance/roadmap/mcp-direction/atomic-prd-agent-skills.md`, against the real local Postgres (`facts-postgres-index-local`), post-move — i.e. through `mcp-server/db/search.ts` / `mcp-server/db/graph-traversal.ts`, the forked copies created by the move, not `_shared/`.

## Real result

**Tool layer confirmed working correctly through the move.** 33 real tool calls made (23 `search_facts`, walk_cluster calls interleaved), real evidence retrieved from the actual local Postgres — comparable in shape to the baseline's 29 tool calls (23 `search_facts`, 5 `walk_cluster`, 1 `get_graph_neighbors`). The relocated `mcp-server/db/` copies are genuinely resolving and returning real fact data post-move, not just booting cleanly.

**The run itself did not complete** — rejected by the mandatory, code-enforced `checkFabrication` validator (`adr-008.md` §2's fail-closed check) before any output was written:

```
Error: [FABRICATED_CITATION] Cited fact_id(s) not present in this run's real tool results:
  service_method|core/access|...|OSKAccessService|deleteAccessById|#1,
  service_method|core/access|...|OSKAccessMessagePublisherService|publishMessageToAllACDs|#1 (x2)
```

The real underlying facts exist and were genuinely retrieved this run — but under the module segment `core` (e.g. `service_method|core|functions/src/modules/core/modules/access/services/access.service.ts|OSKAccessService|deleteAccessById|#1`), not `core/access`. The model's own citation strings hallucinated an extra path segment when reconstructing the fact_id rather than copying the real tool-result string verbatim. This is a citation-string fabrication, not a missing- or wrong-data problem — the real fact was in evidence, the string identifying it wasn't reproduced faithfully.

## Interpretation

This looks like the same general class of citation-fidelity issue this project has already found and partially addressed (the 2026-09-07 `search_facts` retry-waste fix, and the fail-closed fabrication check itself, which is precisely the mechanism designed to catch this rather than let a wrong citation ship silently). Nothing here points to the repo-root move as the cause — the failure is in the model's citation construction, downstream of tool calls that themselves succeeded. Not confirmed as pre-existing-and-unrelated with a second data point, though — this is n=1 post-move.

**Real gap this leaves open**: no post-move output markdown was produced, so the direct "does the moved code reproduce the same real data" comparison (Step 2's actual bar) is not yet closed for resident-departure-2a — only the weaker "tool layer resolves and returns real data" claim is. Decided with the user not to spend a retry attempt closing that gap this session; picking it up later (either a fresh retry, or trying a different one of the known test cases) is open.
