-- Schema proposal, not yet applied. See governance/roadmap/facts-serving-
-- strategy/ for the investigation this is built on, and ADR-005 for the
-- architectural decision. Every design choice below traces back to a real
-- finding from that investigation, called out inline.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- fuzzy/substring symbol search

-- ============================================================
-- 1. extraction_runs -- tracks which Phase 1 run is "current" per repo.
-- Ties directly to the open task-list item (prod vs staging as source of
-- truth) and to the staleness finding: every fact below is stamped with
-- the run it came from, so "how stale is this" is always answerable.
-- ============================================================
CREATE TABLE extraction_runs (
    run_id       text PRIMARY KEY,
    repo         text NOT NULL,
    commit_sha   text NOT NULL,
    branch       text NOT NULL,          -- 'staging' | 'develop' | whichever gets decided (task list item 2)
    extracted_at timestamptz NOT NULL,
    is_current   boolean NOT NULL DEFAULT false  -- exactly one TRUE per repo; sync job flips this
);

-- ============================================================
-- 2. facts -- one row per real Phase 1 fact, any repo, any fact type.
--
-- Deliberately ONE generic table with a jsonb payload, not 15 kind-
-- specific tables (one per fact type: api_contract, call_expression,
-- type_alias, enum, ...). Rejected the many-tables alternative because
-- Phase 1's own fact shapes already vary per kind and change over time
-- (e.g. task-list item 1 -- adding union values to type-alias facts --
-- would be a schema migration under a rigid design, but is just a new key
-- inside the same jsonb column here). The tradeoff: kind-specific queries
-- go through jsonb operators instead of plain columns -- acceptable given
-- Postgres's jsonb indexing is genuinely good, not a real cost.
-- ============================================================
CREATE TABLE facts (
    fact_id       text PRIMARY KEY,      -- the real, stable fact ID (e.g. "api_contract|organization|.../index.ts|createAnOrganization|#1") -- deliberately NOT the per-call short id (F1, F2...), which has no meaning outside one prompt
    repo          text NOT NULL,
    module        text NOT NULL,
    submodule     text,
    kind          text NOT NULL,         -- 'api_contract' | 'call_expression' | 'type_alias' | 'enum' | 'model_property' | ... (matches Phase 1's own fact-type names, unmodified)
    file          text NOT NULL,
    line          integer,               -- last known line at extraction time -- NOT authoritative long-term (see the staleness finding: 13 real merges moved things in ~2 months on one repo alone)
    symbol_name   text,                  -- best-effort normalized "primary name" regardless of kind (a type alias's name, a call's callerName, a model property's propertyName) -- the more durable half of a pointer, per the staleness finding's own recommendation
    payload       jsonb NOT NULL,        -- the full real fact record, untouched
    description   text,                  -- plain-English rendering of the fact, deterministically templated from payload where possible -- this is what gets embedded, not the raw jsonb
    -- GENERATED, not app-computed: Postgres maintains this automatically
    -- whenever `description` changes, so the sync script never has to
    -- remember to keep it in sync itself, and it can never drift from the
    -- real stored value. md5 is fine here -- this is change detection
    -- (like an HTTP ETag), not cryptographic security, so collision
    -- resistance beyond "won't happen by accident on this data volume"
    -- isn't needed.
    description_hash text GENERATED ALWAYS AS (md5(description)) STORED,
    embedding     vector(768),           -- confirmed 2026-09-02 against gemini-embedding-2's real, current spec: default output is 3072 dims, truncatable to Google's own recommended 768/1536/3072 -- 768 chosen as the smallest recommended size, cheapest to store/search; revisit only if retrieval quality demands more
    run_id        text NOT NULL REFERENCES extraction_runs(run_id),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX facts_repo_module_idx ON facts (repo, module, submodule);
CREATE INDEX facts_kind_idx ON facts (kind);
CREATE INDEX facts_symbol_trgm_idx ON facts USING gin (symbol_name gin_trgm_ops);
CREATE INDEX facts_payload_gin_idx ON facts USING gin (payload);  -- exact field queries, e.g. payload->>'contractType' = 'callable'
CREATE INDEX facts_embedding_idx ON facts USING hnsw (embedding vector_cosine_ops);
-- A full-text (to_tsvector) index was added and then dropped 2026-09-02 --
-- built for a hybrid vector+keyword search (governance/roadmap/facts-
-- serving-strategy/09-p2-build-tasklist.md tasks 8-9), tested against every
-- real example query used that day, and found to add nothing: it never
-- contributed the actual best result, caused a real regression on one
-- query, and added noise on the rest. Removed rather than kept "just in
-- case" -- real, negative evidence, not a theoretical concern. See
-- pipeline/facts-postgres-index/_shared/search.ts's own header for the
-- full account before re-adding anything like this.

-- ============================================================
-- 2b. embedding_calls -- real cost/economics tracking for every embedding
-- API call this pipeline makes. Added 2026-09-02 after being asked
-- directly "where are the call economics being stored" -- the honest
-- answer at that point was nowhere; this closes that gap before the first
-- real spend (task 6 in governance/roadmap/facts-serving-strategy/09-p2-
-- build-tasklist.md), not after. Mirrors this project's own established
-- discipline for the LLM generation calls (real, provider-reported usage
-- fields, not estimates) applied to embeddings specifically. Deliberately
-- its own table in this same database, not a write into the existing
-- Phase 2 LLM pipeline's run-notifications.json -- that system belongs to
-- the old P2 code this stage is explicitly not touching.
-- ============================================================
CREATE TABLE embedding_calls (
    call_id                bigserial PRIMARY KEY,
    called_at              timestamptz NOT NULL DEFAULT now(),
    repo                   text NOT NULL,
    module                 text NOT NULL,
    fact_count             integer NOT NULL,          -- how many facts were in this one API call
    billable_character_count integer,                 -- real, from EmbedContentResponse.metadata.billableCharacterCount -- Google's own actual billing basis, not an estimate
    total_token_count      integer,                    -- real, summed from each item's ContentEmbedding.statistics.tokenCount -- NULL if the provider didn't report it for any item, not treated as zero
    any_truncated          boolean NOT NULL DEFAULT false, -- true if any item's statistics.truncated was true -- a real, worth-flagging quality signal (a truncated description was probably too long, not just an accounting note)
    model                  text NOT NULL DEFAULT 'gemini-embedding-2',
    output_dimensionality  integer NOT NULL DEFAULT 768
);

CREATE INDEX embedding_calls_repo_module_idx ON embedding_calls (repo, module);

-- ============================================================
-- 3. cross_repo_edges -- the 118 real edges already computed by
-- pipeline/cross-repo-synthesis/phase-03-ecosystem-topology/06-build-
-- cross-repo-graph.ts (found 2026-09-02, corrects an earlier ADR-005
-- claim that this didn't exist yet). A separate table from `facts`
-- because an edge connects two symbols, potentially across repos -- not
-- itself one AST fact.
--
-- `provenance` directly encodes the real, load-bearing distinction that
-- script's own code discovered: HTTP_API_CALL edges are a clean AST-to-
-- AST join (ast_derived); PUBSUB_TOPIC_BINDING edges are NOT AST-
-- derivable at all and rest on a manually-confirmed external binding
-- (externally_configured) -- a genuine third tier beyond fact-backed and
-- source-only, and it must never be silently blended with ast_derived
-- rows, the same labeling discipline used throughout the hand-traces.
-- ============================================================
CREATE TABLE cross_repo_edges (
    edge_id           bigserial PRIMARY KEY,
    source_repo       text NOT NULL,
    source_symbol     text NOT NULL,
    source_fact_id    text,              -- added 2026-09-03 (governance/roadmap/facts-serving-strategy/14-...md, task 5a): the real fact_id this edge's source resolves to, when one exists. source_symbol alone (a human-readable "file:line -> name" string) can't be reliably joined back to `facts` in code without fragile string matching -- this column is the real join key retrieval traversal needs. Nullable in principle but every edge-building script populates it from real, already-available fact_id data at compute time, not a best-effort guess after the fact.
    target_repo       text NOT NULL,
    target_symbol     text NOT NULL,
    target_fact_id    text,              -- same rationale as source_fact_id. NULL is legitimate here specifically: an unresolved edge (resolution_status != 'resolved'/'confirmed') has no real target fact by definition.
    connection_type   text NOT NULL,     -- 'HTTP_API_CALL' | 'PUBSUB_TOPIC_BINDING' | 'INTRA_REPO_CALL' | 'FIRESTORE_EVENT_TRIGGER' | 'HARDWARE_SOCKET_PAYLOAD' | 'SHARED_COLLECTION'
    resolution_status text NOT NULL,     -- 'resolved' | 'confirmed' | 'probable' | 'unresolved' -- INTRA_REPO_CALL edges (task 4) preserve the real three-way confidence signal from resolved-engineering-graph.json rather than collapsing to a two-value scheme, so retrieval can weight a low-confidence edge differently
    provenance        text NOT NULL CHECK (provenance IN ('ast_derived', 'externally_configured')),
    confirmed_via     text,              -- populated only when provenance = 'externally_configured' -- the real evidence trail (GCP config, code comment, payload match), never left implicit
    details           text,
    synthesis_id      text NOT NULL,
    generated_at      timestamptz NOT NULL
);

CREATE INDEX cross_repo_edges_source_idx ON cross_repo_edges (source_repo, source_symbol);
CREATE INDEX cross_repo_edges_target_idx ON cross_repo_edges (target_repo, target_symbol);
CREATE INDEX cross_repo_edges_provenance_idx ON cross_repo_edges (provenance);
CREATE INDEX cross_repo_edges_source_fact_id_idx ON cross_repo_edges (source_fact_id);
CREATE INDEX cross_repo_edges_target_fact_id_idx ON cross_repo_edges (target_fact_id);
