# Prompt 1: traversal hubs and "method → calls in its body": investigate, challenge the decision, design

**Standing rule: never run `git add` or `git commit`, under any circumstance. Writing files is fine; only the user commits.**

**Mode: investigate → decide/document. No build.** Don't edit any code under `mcp-server/**` or `pipeline/**`, and don't write to any database. Read-only SQL against live `facts_index`, and read-only calls to the real traversal functions, are fine and expected. **No LLM calls and no agent runs in this session.** If an agent run is needed to settle something, design it, estimate its cost, and stop for the user.

The user is a PM: explain mechanisms plainly, and bring each decision as a recommendation with its trade-off. **The user explicitly wants real pushback on the decision below, not agreement.**

## The problem, in short

Graph walks (`mcp-server/db/graph-traversal.ts`) follow every `resolved`/`confirmed` edge that has a target, breadth-first, up to `maxDepth` 6 and `maxFacts` 80. A walk that reaches a heavily linked fact (a "hub") fills its 80-fact budget at that fact's first step and returns `truncated: true`. The facts it actually wanted, reached through the hub's other neighbours, never make it in. The known worst case is the UI-kit view `OSKUIKit::OSKUIExpanded`: 85 incoming `PACKAGE_SYMBOL_USE` edges plus 79 incoming `PACKAGE_METHOD_CALL` edges to its `init`.

A second, related gap: **a walk can reach a method's declaration but can't step to the calls inside that method**. Call edges run call fact → callee declaration, and nothing links a declaration to the call facts in its body. So button → kit method → backend is findable hop by hop, but not as one walk. Example: `PACKAGE_METHOD_CALL` reaches `OSKCKUserInvitesService.userSendInvitation`'s declaration (`:26`), but the `HTTP_API_CALL` to Firebase `user::createUserInvitation` starts at the call fact at `:37` inside it. The same gap exists from Firebase trigger handlers to their bodies. Both problems are about how walks move, so design them together: a containment step adds many more edges to follow, which makes hubs worse.

## The decision to check (user decision, 2026-10-01)

During the call-resolution build, two different policies were applied to hubs:

1. **Same-repo call edges (W6, `INTRA_REPO_CALL_DECLARED`): hubs are fenced off when the edges are built.** Any callee whose fan-in is above `exp(Q3 + 3·IQR)` of the repo's log fan-in gets **no edges at all**. A repo with IQR 0 falls back to the fence pooled over all repos. Live today: iOS `trackEvent` 62, `trackScreen` 43, `OSKCrashlyticsService.init` 18, `triggerHapticFeedback` 17; Kotlin `ButtonTestBenchComponent` 26, `emit` 24, `sendIntentToServiceClass` 18, `trackEvent` 17, `setDevice` 17, `checkAndStopLocalRingBackTone` 16; Firebase and Angular have their own. Those edges don't exist in the DB.
2. **App → kit method edges (`PACKAGE_METHOD_CALL`): no fence; all 404 kept.** The user's decision, as recorded: *"Walk flooding around UI-kit hubs belongs in traversal, not in edge removal."* Lane E's reasoning: a walk from `OSKUIExpanded` returning its 79 call sites is the true answer to "who uses this component?".

**Your first job is to test whether "handle hubs in traversal, not by removing edges" is the right call. Argue against it seriously before you accept it.** Specifically:
- Is it consistent with (1)? W6 already removes hub edges at build time. Should those come back (stored, then handled in traversal), or should the same build-time fence apply to `PACKAGE_METHOD_CALL`/`PACKAGE_SYMBOL_USE` too? Or is the difference justified? Analytics/logging calls might be noise, while "who uses this UI component" might be signal. If so, say what in the data, not the names, tells them apart.
- Who consumes the edges besides our walks? The wiki team reads a **copy** of the DB and runs its own queries (`governance/roadmap/downstream-app-feedback/`). An edge removed at build time is gone for them too; a traversal rule only affects our MCP tools. Weigh that.
- What does each option cost a future session? Edge-side fences need a rebuild and change slice md5s; traversal changes touch the MCP tools both PRD agents use.
- If you conclude the decision is wrong, or right only in part, say so plainly, with the evidence, and propose what should replace it. Don't soften it.

## Read first, in this order

1. `governance/roadmap/call-resolution-same-repo-edges/00-findings-and-plan-2026-10-01.md` §8: the last two bullets (hubs; no method → body link).
2. `governance/roadmap/call-resolution-same-repo-edges/01-build-spec-2026-10-01.md`, Build log: `[Lane E] E3` (the fence degeneration, the PMC fan-in report and the fence options A/B/C), `[Coordinator] E3 validated; user decisions on the fences`, and the round-2 `[Lane K] READY TO SYNC` (Kotlin hubs). Skim the rest only as needed.
3. `governance/roadmap/dynamic-pipeline-architecture/38-build-plan-cross-repo-edges-four-joins-2026-09-21.md`: Stage B's hub measurement and **P8** (~line 1063): `findGraphNeighbors(OSKUIExpanded)` 85 rows / 35 KB, `walkBoundedCluster` 73 KB, truncated at depth 1. That was before `PACKAGE_METHOD_CALL` existed.
4. Code: `mcp-server/db/graph-traversal.ts` (all of it: `expandWithGraphNeighbors`, `walkBoundedCluster` and its comment block ~:160-197, `findGraphNeighbors` ~:261); its callers `mcp-server/src/index.ts` (the MCP tools), `mcp-server/agent-poc/atomic-prd-agent.ts` (~:195-225) and `capability-fanout-prd-agent.ts` (~:565-595); the W6 fence in `pipeline/facts-postgres-index/build-cross-repo-edges.ts` (`intraRepoCallDeclaredJoin`, ~:1600-1800).
   - Note: an earlier hand-off claims `graph-traversal.ts:178-183` "anticipates include the hub with its count, don't expand". The coordinator didn't find that wording there. Check it; don't rely on it.
5. ADR-005 and ADR-007..009 in `governance/adrs/` (how graph traversal fits the retrieval design), and the memories `project_call_resolution_same_repo_edges.md` and `project_capability_fanout_prd_thread.md`.

## Facts about this environment you must not get wrong

- **DB:** container `facts-postgres-index-local` (port 5433), database `facts_index`, user `facts_index`, live and shared. Read-only here. Use `</dev/null` with `docker exec ... psql -c`, or it can hang. State on 2026-10-01 after round 2: 69,643 facts, 22,678 edges, 31 slices (`governance/roadmap/call-resolution-same-repo-edges/03-baseline-round2-before-2026-10-01.json` plus the round-2 Build log).
- **`fact_ref` = `sha1(fact_id)`**, Postgres-generated, and the traversal joins on it. Some Swift `fact_id`s contain newlines: compare `fact_ref`s, never raw IDs through line-based tools.
- **Traversal follows any `connection_type`** that is `resolved`/`confirmed` with a target. There is no type allowlist.
- **Call facts carry the information a containment link would need:** Swift `callerMember`/`callerFunction` + `callerClass` + file; Kotlin `callerMember` (= `callerName`) + file, with declarations carrying `owningClass`; TS (Firebase, Angular, node-iot) `callerName`/`callerStartLine`/`callerEndLine`. Measure how reliably each matches its declaration fact; don't assume.
- **Past agent runs** are in `output/agent-runs/prds/test/` (`*.md` plus `*.meta.json`). Check whether they record which walk/expand calls were made and with which anchors. If they do, replaying those exact calls against today's graph is a free, real test.
- **CLAUDE.md rules that bind you:** cheap bounded real tests before reasoning in the abstract; keep a "before" measurement; always dynamic (no hand-typed hub lists; any rule must come from the data); write findings to the doc as they happen; delete scratch scripts once their findings are written up; **flag any spend before it happens.**

## Procedure

**Step 1. Measure today's graph (read-only).**
- Fan-in and fan-out per fact, by connection type and repo, on live edges: the top hubs now, after round 2 (`OSKUIExpanded` and others; Kotlin; Firebase; Angular), and how many walks would hit one.
- Re-run P8's measurement on today's graph: `findGraphNeighbors` and `walkBoundedCluster` from `OSKUIExpanded`, and from 3-5 realistic anchors a PRD agent would start from (from the past runs' records if they exist; otherwise from `mcp-server/test-questions/`, e.g. `1e-dummy-prd-ios-invitations-cloudkit-firebase.md`). For each, record: facts returned, bytes, `truncated`, depth reached, and **which facts were lost because a hub ate the budget**. That last number is the real cost of the problem.
- For the containment gap: how many declaration → body-call links would exist per repo, how reliably they match, and how a walk from the invitation example changes if they existed (simulate it in SQL; don't build it).

**Step 2. Test the decision (see above).** Put the evidence for and against "traversal, not edge removal" side by side, including the W6 inconsistency and the wiki consumer.

**Step 3. Options and design.** For hubs, at least: (a) build-time fences on more edge types; (b) traversal-side hub collapse (return the hub with its count, don't expand through it, perhaps with a way to ask for it explicitly); (c) direction- or type-aware rules (e.g. don't fan out over incoming edges at a fact you reached by an outgoing one); (d) a budget-aware walk, so one hub can't take the whole 80-fact budget; (e) anything better the data suggests. For containment: a derived edge type stored in the DB versus a containment step in the traversal. For each option: what it fixes in the Step 1 measurements, what it breaks or hides, who it affects (our agents, the wiki), how it's tested, its rough cost. Recommend one combined design.

**Step 4. Write it up and stop.** Write `governance/roadmap/traversal-hubs-and-containment/00-findings-and-design-<date>.md`: the Step 1 numbers, the decision check with a clear verdict, the options, the recommendation, and a bounded test plan for the build. The test plan includes **a before/after real agent run, with its estimated LLM cost, which needs the user's approval before anyone runs it**. If the recommendation is an architectural change to retrieval, say whether it needs an ADR (CLAUDE.md: new architectural decisions get one, plus a catalog entry in `governance/adrs/README.md`). Draft it as **Proposed**; don't mark it Accepted. Then stop, and give the user the decisions to make in plain terms.

## Out of scope

Building anything; changing edges, facts or the fence; the Angular import-alias defect; the "protocol" wording; any `gcloud`; any LLM call or agent run.

## Addendum 2026-10-02 (user-approved, sent to the running session by message)

**Also in scope: an interface → implementation step.** Call links whose target is an interface or protocol requirement (`memberTargetIsProtocolRequirement = true`: about 57 Kotlin W6 links, about 81 Swift W6 links, about 41 iOS calls) stop at the interface method, not the code that runs (e.g. Kotlin `repository.getAccesses` → `OSKAccessesRepository.getAccesses`, not `…Impl`). Nothing links an interface method to its implementations. In Step 1, measure per repo how many such targets have exactly one in-repo implementation, several, or none. In Step 3, design it next to containment: a stored derived edge vs a traversal step. Read-only, no spend, as above.
