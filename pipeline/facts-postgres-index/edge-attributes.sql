-- attributes on cross_repo_edges (W4d, 2026-09-27): additive, nullable jsonb, no default. Structured facts about an edge
-- (client operation, path shape, flags ...), written only by joins that set it; NULL for every other edge.
-- Apply once, in a granted write turn:
--   docker exec -i facts-postgres-index-local psql -U facts_index -d facts_index < pipeline/facts-postgres-index/edge-attributes.sql
-- Idempotent.
ALTER TABLE cross_repo_edges ADD COLUMN IF NOT EXISTS attributes jsonb;
