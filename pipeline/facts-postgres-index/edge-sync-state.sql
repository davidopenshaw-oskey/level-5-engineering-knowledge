-- edge_sync_state (W5b, 2026-09-26): additive, one row per (connection_type, source_repo) slice of
-- cross_repo_edges. Written only by pipeline:edges (build-edges.ts) via _shared/edge-sync-state.ts.
-- Apply once, in a granted write turn:
--   docker exec -i facts-postgres-index-local psql -U facts_index -d facts_index < pipeline/facts-postgres-index/edge-sync-state.sql
-- Idempotent. Touches no existing table or column.
CREATE TABLE IF NOT EXISTS edge_sync_state (
    connection_type text NOT NULL,
    source_repo     text NOT NULL,
    built_at        timestamptz NOT NULL,
    synthesis_id    text,             -- newest synthesis_id in the slice when recorded; a later value in the edge table means a builder was run by hand ("unrecorded")
    facts_run_id    text,             -- the source repo's current extraction run when recorded (informational; null for source_repo 'unknown')
    edge_count      integer NOT NULL,
    resolved_count  integer NOT NULL, -- resolved + confirmed, the statuses graph traversal follows
    dangling_source integer NOT NULL, -- edges whose source_fact_id has no fact
    dangling_target integer NOT NULL,
    inputs          jsonb NOT NULL,   -- {"<repo>": {"run_id", "fact_count", "fingerprint"}} for the source repo and the target repos of the slice's edges
    PRIMARY KEY (connection_type, source_repo)
);
