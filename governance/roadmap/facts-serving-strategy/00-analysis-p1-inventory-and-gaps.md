# P3a Analysis — What P1 Already Has, and What's Actually Missing

**Status:** Investigation only. No technical design or task list yet — see `01-qa-vision-and-examples.md` for the open questions this analysis raises, which need real answers before any build decision.

**Background:** `governance/adrs/adr-005.md` records the pivot question this investigation exists to answer: is a retrieval layer over Phase 1 facts the right way to serve impact analysis and atomic PRD drafting, and if so, what does it actually need. This document is P3a's first step — an honest inventory of what already exists versus what would need to be built, grounded in the real files this pipeline produces today (checked directly against a real run, not assumed).

---

## 1. The two objectives, restated plainly

- **Impact analysis:** given a proposed change (a file, a method, an endpoint, a Firestore path), answer "what else does this affect" — across one repo, and ideally across the three repos where a real workflow crosses boundaries (e.g. a mobile action that triggers a Firebase function that talks to a physical device).
- **Atomic PRD drafting:** given a proposed new feature or change, answer "what already exists in this area today" — precisely enough that a PRD can be scoped against real current behavior, not against a guess or an out-of-date memory of the codebase.

Both objectives are about answering *specific, scoped* questions on demand — neither is about producing one comprehensive document meant to be read start to end. That's the same distinction this pipeline's own module-level reports don't make today (they're comprehensive-by-default, not scoped-by-question).

---

## 2. What P1 already produces, per repo, checked against a real run

Every repo's Phase 1 run produces (paths shown for `firebase-oskey-dev`, same shape for Angular/node-iot):

**Raw fact files** (`facts/ast-*.json`) — one file per fact type, e.g. `ast-api-contracts.json`, `ast-calls.json`, `ast-classes.json`, `ast-firestore-hints.json`, `ast-firestore-triggers.json`, `ast-permission-hints.json`, `ast-pubsub-event-routes.json`, `ast-methods.json`, `ast-model-properties.json`, plus `files.json`/`modules.json`. Every individual fact record already carries a stable, unique ID, its file/line, its module/submodule, and a `type` — real example, checked directly: a fact record looks like `{id, runId, type, repo, module, submodule, file, line, value, method, contractType, handlerName, handlerStartLine, handlerEndLine, handlerResolutionStatus, evidence}`. This is already close to "one row per fact" shape a database or search index would want.

**Per-module derived artifacts** (`knowledge-pipeline/modules/<module>/`) — `capability-packs/*.json` (facts grouped and de-duplicated by capability — 216 facts in `organization`'s `_module_root` pack alone, real count), `cross-module-dependencies.json`, `intra-module-coupling.json`, `<module>-evidence-graph.json`. These are already the exact inputs Phase 2's synthesis calls consume today.

**Repo-wide** (`knowledge-pipeline/resolved-engineering-graph.json`) — resolved call edges (who calls whom, across modules), RBAC requirements, unresolved call edges (edges Phase 1 couldn't confidently resolve — already an honest "we don't know" category, not silently dropped), and ownership hints (which capability likely owns a given Firestore path).

**What this means for the two objectives:**
- Impact analysis's "what does this affect" question is *already answerable today, within one repo*, by walking `resolved-engineering-graph.json`'s call edges — no new extraction needed, just a traversal tool that doesn't exist yet as a standalone thing (today it only gets consumed as an input to Phase 2's prose).
- Atomic PRD's "what exists today" question has no existing way to search across it except reading the raw JSON files directly, or reading Phase 2's prose reports (which summarize at module scope, not at the precision a specific PRD question might need).

---

## 3. Real, already-identified gaps (not speculative)

- **No cross-repo call-graph edges exist yet**, even though the connecting identifiers already exist in the facts on both sides of each boundary (confirmed during ADR-005's discussion: Angular's `ast-firebase-callable-calls.json` records the literal Firebase callable name it calls; Firebase's `api_contract` facts with `contractType: "callable"` record the matching exported name; node-iot's `pubsub_topic` facts record resolved topic names matching Firebase's publish/subscribe routes). This is a real, scoped, buildable gap — a join script, not a design problem.
- **No search/retrieval layer exists over the facts at all.** Today, finding "everything relevant to X" means either already knowing which module/file to look in, or reading a Phase 2 report and hoping the relevant detail wasn't summarized away.
- **No standalone impact-analysis tool exists**, even though the underlying graph data does. The traversal logic would need to be written as its own thing, not extracted from inside Phase 2's synthesis code.
- **No definition of "atomic PRD" output shape exists yet** — what a finished one looks like, what sections it needs, how "atomic" is being scoped (one capability? one Firestore path? one user-facing flow?) is not written down anywhere in this codebase.
- **No real example questions exist yet** for either objective — everything discussed so far (this document included) has been in the abstract. This is the most important gap to close first, and is what `01-qa-vision-and-examples.md` asks for directly.

---

## 4. What this document deliberately does NOT do

It does not propose a database, a schema, a chunking strategy, or a build plan. Every prior conversation this session that jumped to a technical answer (Postgres/pgvector, embeddings, batching) before the real questions in Section 3 were answered risks solving a version of the problem nobody has confirmed is the real one yet. That technical design work is real and still coming — it's P2 and the rest of P3a, once the open questions below have real answers.
