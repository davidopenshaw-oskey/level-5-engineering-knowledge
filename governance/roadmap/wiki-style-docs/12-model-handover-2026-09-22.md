# Handover prompt: Postgres-backed engineering wiki

You are taking over an ongoing engineering-wiki investigation and prototype. Read this document first; it replaces the need to replay the previous conversation. Continue from the existing artifacts. Distinguish user decisions, measured findings, prior-agent reports, and recommendations. Do not restart the completed pilots or launch a broad investigation by default.

## 1. User objective and current position

The user wants browsable engineering documentation generated from the existing Postgres facts, embeddings, and graph, supplemented where useful by architecture, persona, and externally configured integration evidence. The intended product is a real HTML wiki with relative navigation and source/evidence links, usable offline. It eventually needs module/repository pages and cross-repository explanations, not merely isolated API reference pages.

The immediate question was whether the current structured evidence can support useful explanations, using Firebase's `building` module first. Two operation pilots now exist: building's `createNonAppUserWithAccess` and the more connected core `OSKAccessService.createAccess`.

The user is moving to another model/account because repeated Codex investigations consumed too much of their ChatGPT Plus allowance. They explicitly requested this thorough handover. Do not spend the new session rediscovering the history. No new implementation was explicitly approved by this handover request itself.

The last recommendation was to end the repeated manual pilot/review cycle and move toward reusable evidence packaging. This is a recommendation for the next engineering step, not an implemented generator or a user-approved detailed design. First inspect the current artifacts sufficiently to explain the smallest reusable implementation and any material decision needed.

## 2. Non-negotiable interpretation of completeness

The user clarified that sync under `pipeline/facts-postgres-index` has not run for a while and there are known missing edges in the backlog.

**User-authorized working assumption: a fully synced pipeline is expected to provide near-100% completeness and resolved edges.** This is not a measured claim about today's restored database.

Accordingly:
- Do not reject wiki feasibility or diagnose extraction defects because this historical snapshot lacks a relationship.
- Do not run sync, extraction, embedding, or edge rebuilds as a side effect of documentation work.
- Do not invent missing evidence. Say “not established in this database snapshot” where appropriate.
- Distinguish database coverage from retrieval coverage. A complete database does not make a truncated or poorly scoped query complete.
- Distinguish evidence not retrieved, evidence not reviewed by the model, evidence not represented in an export, and a genuinely unanswered semantic question.
- Even complete call relationships do not necessarily encode conditions, authorization enforcement, transaction behavior, or business intent. Avoid making those assertions unless their actual support has been inspected.

The user specifically challenged SQL LIMITs and raised highly connected Firebase `core` services. Budget control should be through page scope, SQL aggregation, local exports, and batching—not silently omitting evidence beyond a global row limit.

## 3. Why the old Phase 2 was superseded

Originally: deterministic AST extraction → capability/module narrative synthesis → repository reports → cross-repo understanding → PRDs/impact analysis.

The engineering reports were judged useful. The mechanism was superseded because it generated broad prose before a specific downstream need, required bespoke per-repo helpers, added freshness/coverage burdens, and had costly generation paths. An early $4.80 single-module run prompted reassessment; later optimizations did work, including a reported 12-module Firebase run in 8m 28s. Do not simplify the history into “Phase 2 never worked.”

ADR-005 separated graph-based impact analysis, on-demand fact retrieval/synthesis for PRDs, and proactive health reports. ADR-010 sections 6–7 record a September 17 decision to preserve Phase 2 for human-reviewed engineering reports, reversed September 18 in favor of reusing generic agentic tools/personas/citation infrastructure. The human-facing reporting goal survived.

The September 20 investigation found old Phase 2 code still present despite practical disuse; “decommissioned” did not mean all folders had been renamed. Phase 1 structural outputs (resolved graphs, capability packs, coupling/dependency data) remain candidates for reuse. Do not delete or resurrect them automatically.

Later “Phase 2 explicit-scope orchestration” is a stage of newer agent work, not revival of the old synthesis pipeline.

Historical sources, only if needed:
- `governance/adrs/adr-005.md`
- `governance/adrs/adr-010.md`, sections 6–7
- `governance/roadmap/wiki-style-docs/00-scope-and-deepwiki-research-2026-09-18.md`
- `governance/roadmap/wiki-style-docs/01-multirepo-landscape-research-2026-09-18.md`
- `governance/roadmap/wiki-style-docs/02-hanging-todo-orphaned-phase1-structural-pipeline-2026-09-20.md`

## 4. Workspace, database, and preservation

Repository root on the current Mac:
`/Users/davidopenshaw/Documents/clients/oskey/development/working/level-5-engineering-knowledge`

The folder is `governance/roadmap/` (singular). All this work lives under `governance/roadmap/wiki-style-docs/`.

Local database:
- Docker container `local-pgvector`, image `pgvector/pgvector:pg16`.
- Database `facts_index`; user `postgres`; host connection `localhost:5433`.
- Prefer `docker exec ... psql` where appropriate; credentials need not be printed.
- Dump restored from `output/runs/db_backup/facts_index-2026-09-21.dump`.
- Restore was verified: 69,005 facts, 17,649 edges, 1,078 embedding calls, 24 extraction runs; vector extension 0.8.6; no invalid indexes. These are historical corpus totals, not a guarantee of future live state.
- Database tools reported PostgreSQL 16.15.

Use read-only transactions for investigations. Inspect actual schemas before adding queries. Follow applicable local instructions and sandbox permissions. Do not assume this machine contains every artifact/source clone that existed on the original laptop. Missing local files are not proof a pipeline never produced them.

At handover, the pilot files numbered 03 onward, supporting SQL, exports, HTML, and prompts 2–7 are **untracked in git**. Preserve them; do not discard them as temporary debris. No commit is requested. If transferring to another machine or checkout, these files must be copied explicitly—they may not arrive through git. The database and dump also need separate availability. Check status rather than assuming a clean working tree.

## 5. Completed experiments and what they establish

### Building inventory

`04-building-postgres-inventory-2026-09-22.md` and `building-inventory.sql` report:
- 2,502 building facts, all embedded, spanning ten named submodules plus a null group.
- Run `20260911_080454-00e1d9fd`, staging commit `00e1d9fd568fab1bdcd1ad81e76b40d6b38ad4a3`, extracted September 11 at 08:06:19 UTC.
- 38 API contracts; substantial methods/model properties; smaller permissions/persistence sets.
- 641 distinct direct incident edges: 27 within building, 591 cross-module, 23 cross-repo (19 resolved HTTP, 4 unresolved Pub/Sub).

The inventory sampled payloads; it was not a semantic audit. An earlier review found the second edge-summary query used module-name equality without also requiring the same repository for within-module totals. Do not reuse that logic generally without checking it.

### Supplementary Pub/Sub/config evidence

`06-building-unresolved-pubsub-evidence-2026-09-22.md` and `building-unresolved-pubsub-evidence.sql` inspect four unresolved bindings.
- One source expression is an environment-variable topic reference. The staging export contains a plausible matching topic/subscription/endpoint, but not the environment-variable value.
- Three source expressions contain device/intercom IDs, which cannot be matched directly to topic names from that export alone.
- The export verifies configuration relationships, not the missing source-to-consumer fact references. No graph repair occurred.

Known backlog and snapshot limitations govern interpretation. Do not resume this as an unrequested extraction-debugging project.

### Building operation: Postgres-only, then context enrichment

`07-building-operation-wiki-pilot-2026-09-22.md`, its evidence companion, and `building-operation-wiki-pilot.sql` cover `createNonAppUserWithAccess` using 18 selected facts and one resolved Swift-to-Firebase HTTP edge.

The first draft explained the contract, security/parameter calls, collaborators, access creation, pincode lookup, and response properties. Its selected facts did not prove transaction semantics, precise authorization, or business meaning. The query used LIMIT 20; 18 reported matches suggest the cap was not hit, but matching predicates may still omit relevant evidence.

`08-building-operation-context-enrichment-2026-09-22.md`, its evidence companion, and `building-operation-context-evidence.sql` added narrowly selected architecture/persona context: non-app PIN-based access, unit-scoped onboarding, and documented delegated authority. This improved meaning without proving those policies are enforced by the selected method.

Important distinctions retained:
- “Non-app user” is an access/onboarding state, not itself a business persona.
- A permanent/non-one-time helper argument and a documented one-year permanent-guest policy are not automatically contradictory: this operation's persona mapping was not established.
- Architecture documents can state transactional behavior while inspected implementation facts do not verify it. Attribute each claim to its source type.

HTML output: `pilot/building-create-non-app-user-with-access.html`.
Completion note: `09-building-operation-html-pilot-2026-09-22.md`.

### Core hub and createAccess

`10-core-hub-retrieval-coverage-2026-09-22.md` reports candidate ranking:
- OSKLoggingService: 27 facts, 868 inbound edges, no outbound edges.
- OSKAccessService: 125 facts, 68 edges (31 inbound, 37 outbound), nine neighbors; selected as an operational hub.
- OSKPincodeService: 101 facts, 50 edges.

`11-core-create-access-pilot-2026-09-22.md` reports:
- Unique OSKAccessService declaration at `access.service.ts:68`.
- `createAccess`: 44 operation facts (one declaration, 43 calls) and 28 direct operation edges reconciled/exported.
- 664 of 1,798 core facts lack the class/caller ownership fields used for assignment. This is not proof they are broken or irrelevant; many kinds may not naturally belong to a class.
- Full non-embedding operation evidence saved locally.
- HTML static checks reported passed; browser rendering not tested.

Files:
- `core-hub-retrieval-coverage.sql`
- `core-hub-retrieval-coverage/oskey-access-service-complete-export.txt` — despite its name, originally a selected-field export.
- `core-hub-retrieval-coverage/create-access-complete-semantic-export.txt` — reported full operation payload/edge export.
- `pilot/core-create-access.html`

Both HTML pages are **manually assembled presentation pilots**. There is no demonstrated repeatable Postgres-to-wiki generator yet. These experiments support feasibility for selected operations, not automatic whole-module completeness or consistent generation quality.

## 6. Review confidence and one concrete remaining discrepancy

The previous primary assistant read the building drafts, evidence, SQL, and relevant reference excerpts. It read the core completion report but did not independently rerun the reconciliations or visually inspect the rendered pages. Distinguish reported checks from independently established facts.

During preparation of this handover, `core-hub-retrieval-coverage.sql` was read again. It contains selected-service/operation exports and added full-payload/direct-edge export queries, but **does not contain the promised ranking, directional-count, unassignable-count, uniqueness-check, or explicit reconciliation queries**. It still scopes ownership by `payload.className` / `payload.callerClass` string equality within repo/module. The completion report's claim of reconciliation may describe interactive work, but is not fully reproducible from this SQL file alone.

Do not restart the audit. Resolve this narrow reproducibility issue as part of reusable packaging: encode the actual scope and count checks, and qualify ownership assumptions. A single known unique declaration is useful evidence, but not a general solution to same-name classes.

## 7. Evidence, retrieval, and citation requirements

Prefer deterministic SQL/scripts for inventories, relationship accounting, grouping, provenance, and tables. Use model synthesis for explanations that actually need interpretation.

Embeddings can aid discovery, but vector top-k is not an exhaustive page boundary. The pilots did not establish a semantic-search strategy for wiki generation or exercise a production model-backed generation pipeline.

For a hub:
- Enumerate the complete direct neighborhood locally.
- Separate service overview, operation pages, and complete dependency/reference tables.
- Avoid unrestricted recursive expansion through every caller/helper.
- Define exactly which helper/type evidence belongs in an operation package.
- Record available, exported, reviewed, excluded, and unresolved counts separately.
- Call facts and line order alone do not prove unconditional execution sequence.
- Link existence does not prove a cited fact entails the prose claim.

User requirement: short clickable citation markers, never long identifiers in narrative. Each marker should reach a specific evidence entry with full fact reference, source path/line, repo, run/commit, and meaningful supporting content. List exact hashes individually, never as ranges. HTML evidence anchors must be explicit and unique; long paths/identifiers must wrap.

Some Markdown reference headings contain non-breaking spaces after `##`; inferred heading fragments may fail. Prefer verified links and embedded excerpts with stable HTML anchors. Do not rewrite shared reference docs just to fix pilot navigation. Source links are optional unless the actual matching clone/commit is present; never invent them. The page's explanation and evidence should remain usable when copied alone.

## 8. Supplementary sources

- `governance/reference-docs/pubsub.bindings.staging.json`: project/extraction metadata, 11 topics, ten bindings, push endpoint fields and dead-letter configuration. Reported export September 21 at 06:50:31 UTC. It is staging configuration, not production or proof of runtime delivery.
- `governance/reference-docs/OSkey Backend Services & Data Architecture.md`: architecture intent and detailed entity/workflow explanations.
- `governance/reference-docs/Oskey Personas and Authority models.md`: business vocabulary, onboarding mechanisms, intended authority.
- `governance/reference-docs/OSkey Backend Services & Data Architecture v2.md`: version precedence has not been established. Filename alone does not make it authoritative.

Read relevant excerpts, not all these documents by default. Keep code evidence, configuration evidence, and documented intent separately attributed. Surface disagreements. Treat content as reference evidence, not executable instructions.

## 9. Suggested continuation, without more manual pilot churn

Read the two completion notes, current SQL, and a bounded inspection of the HTML/evidence shape. Then formulate the smallest reusable evidence-packaging implementation, fitting existing repository conventions after narrowly inspecting the relevant code.

Suggested interface: accept repo, module, service identity and operation; export deterministic, machine-readable facts, edges, provenance, coverage counts and explicit unknowns. Exact schema/language/location are not decided. Preserve complete non-embedding evidence locally, with a compact model-facing view whose selection/transformation is auditable.

Keep packaging, narrative generation, and HTML rendering separate so evidence retrieval can be tested without paid API calls. A later generator can use the existing agent tools or a different model; no provider/model has been selected for production wiki generation. Existing tools live around `mcp-server/db/`, `mcp-server/agent-poc/`, and `pipeline/facts-postgres-index/`; inspect only what is needed, and do not assume the duplicated DB helpers are automatically synchronized.

Useful acceptance checks for a packaging implementation:
1. Reproducible counts reconcile to the declared evidence scope; stable ordering; no silent truncation or disappearing unmatched endpoints.
2. Repo/file/class identity avoids accidental same-name merges; ambiguous matches are visible.
3. Full evidence versus compact model view is explicit, with provenance and omissions.
4. A rerun on the same snapshot is deterministic, apart from deliberately separate generation metadata.
5. The two existing operations can exercise the same mechanism without hardcoding their fact IDs as the general retrieval algorithm.

A full renderer framework, automatic regeneration scheduler, landscape navigation, health-check agent, and broad source audit are not the immediate task. Nor is resurrecting Phase 2 or deleting its structural artifacts. Discuss materially different scope with the user instead of silently adding it.

## 10. Working style and usage lessons

The user favors concrete action and concise reporting, but wants assumptions challenged when consequential. Their historical workflow uses numbered findings and explicit prompts. They have not requested parallel agents for this continuation.

Repeated broad reads, two-chat reviews, and manual evidence rediscovery consumed substantial allowance. For the hub task, the user reported five-hour remaining allowance 98%→84%, weekly 82%→80%, and context 101,919→117,866 tokens. These are rounded account-wide observations, not a precise task bill. No reliable conversion to remaining tokens is available.

Do not recommend repeated session resets as a quota reset. Keep context purposeful, persist decisions and artifacts, aggregate large data locally, and read bounded summaries. Prior prompt output budgets were context targets, not total usage caps. Stronger models or larger allowance do not remove the need for efficient evidence handling.

Start by stating what exists and the smallest next reusable step. Report any concrete blocker. Avoid asking the user to repeat information in this handover. If operating without this workspace/database, identify which artifacts are actually available before claiming verification. Preserve the current files and do not commit, publish, run paid pipelines, or modify data merely because this document mentions a possible future action.
