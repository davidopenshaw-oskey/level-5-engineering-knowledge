-- Read-only, bounded inventory for firebase-oskey-dev / building.
-- Run: docker exec -i local-pgvector psql -U postgres -d facts_index -X -v ON_ERROR_STOP=1 -f - < building-inventory.sql
BEGIN READ ONLY;

SELECT current_database() AS database, current_user AS db_user, version() AS server_version;

WITH building AS (
  SELECT * FROM facts WHERE repo = 'firebase-oskey-dev' AND module = 'building'
)
SELECT kind, COALESCE(submodule, '(null)') AS submodule,
       count(*) AS facts, count(embedding) AS with_embedding
FROM building GROUP BY kind, COALESCE(submodule, '(null)') ORDER BY facts DESC, kind, submodule;

WITH building AS (
  SELECT * FROM facts WHERE repo = 'firebase-oskey-dev' AND module = 'building'
)
SELECT count(*) AS facts, count(embedding) AS with_embedding,
       count(*) FILTER (WHERE run_id IS NOT NULL) AS with_run_id,
       count(DISTINCT run_id) AS distinct_runs
FROM building;

WITH building AS (
  SELECT * FROM facts WHERE repo = 'firebase-oskey-dev' AND module = 'building'
)
SELECT er.run_id, er.repo, er.commit_sha, er.branch, er.extracted_at, er.is_current,
       count(b.fact_id) AS building_facts
FROM building b LEFT JOIN extraction_runs er ON er.run_id = b.run_id
GROUP BY er.run_id, er.repo, er.commit_sha, er.branch, er.extracted_at, er.is_current
ORDER BY building_facts DESC, er.extracted_at DESC NULLS LAST;

WITH building AS (
  SELECT * FROM facts WHERE repo = 'firebase-oskey-dev' AND module = 'building'
), incident AS (
  SELECT DISTINCT e.edge_id, e.source_fact_ref, e.target_fact_ref, e.source_repo, e.target_repo,
         e.connection_type, e.resolution_status,
         sf.module AS source_module, tf.module AS target_module,
         (sf.fact_id IS NOT NULL) AS source_resolves, (tf.fact_id IS NOT NULL) AS target_resolves
  FROM cross_repo_edges e
  LEFT JOIN facts sf ON sf.fact_ref = e.source_fact_ref
  LEFT JOIN facts tf ON tf.fact_ref = e.target_fact_ref
  WHERE EXISTS (SELECT 1 FROM building b WHERE b.fact_ref = e.source_fact_ref)
     OR EXISTS (SELECT 1 FROM building b WHERE b.fact_ref = e.target_fact_ref)
)
SELECT CASE
         WHEN source_repo <> target_repo THEN 'cross-repo'
         WHEN source_module = 'building' AND target_module = 'building' THEN 'within-module'
         ELSE 'cross-module'
       END AS edge_scope,
       connection_type, resolution_status,
       count(*) AS edges,
       count(*) FILTER (WHERE source_resolves AND target_resolves) AS both_endpoints_resolve,
       count(*) FILTER (WHERE NOT (source_resolves AND target_resolves)) AS an_endpoint_unresolved
FROM incident
GROUP BY 1, connection_type, resolution_status ORDER BY edges DESC, 1, 2, 3;

WITH building AS (
  SELECT * FROM facts WHERE repo = 'firebase-oskey-dev' AND module = 'building'
), incident AS (
  SELECT DISTINCT e.edge_id, e.source_fact_ref, e.target_fact_ref, e.source_repo, e.target_repo,
         sf.module AS source_module, tf.module AS target_module,
         (sf.fact_id IS NOT NULL) AS source_resolves, (tf.fact_id IS NOT NULL) AS target_resolves
  FROM cross_repo_edges e LEFT JOIN facts sf ON sf.fact_ref = e.source_fact_ref
  LEFT JOIN facts tf ON tf.fact_ref = e.target_fact_ref
  WHERE EXISTS (SELECT 1 FROM building b WHERE b.fact_ref = e.source_fact_ref)
     OR EXISTS (SELECT 1 FROM building b WHERE b.fact_ref = e.target_fact_ref)
)
SELECT count(*) AS incident_edges,
       count(*) FILTER (WHERE source_module = 'building' AND target_module = 'building') AS within_module,
       count(*) FILTER (WHERE source_repo = target_repo AND NOT (source_module = 'building' AND target_module = 'building')) AS cross_module,
       count(*) FILTER (WHERE source_repo <> target_repo) AS cross_repo,
       count(*) FILTER (WHERE source_resolves AND target_resolves) AS both_endpoints_resolve
FROM incident;

WITH building AS (
  SELECT * FROM facts WHERE repo = 'firebase-oskey-dev' AND module = 'building'
), ranked AS (
  SELECT *, row_number() OVER (PARTITION BY kind ORDER BY submodule NULLS LAST, file, line) AS kind_rank
  FROM building
  WHERE kind IN ('api_contract', 'controller_method', 'external_hook', 'firestore_trigger',
                 'function_declaration', 'imports_dependency', 'model_property',
                 'permission_candidate', 'permission_error', 'service_method', 'source_class', 'type_alias')
)
SELECT fact_id, fact_ref, kind, COALESCE(submodule, '(null)') AS submodule, file, line,
       symbol_name, left(description, 320) AS description_sample,
       COALESCE((SELECT string_agg(key, ', ' ORDER BY key) FROM jsonb_object_keys(payload) key), '') AS payload_keys
FROM ranked WHERE kind_rank = 1
ORDER BY kind
LIMIT 12;

WITH building AS (
  SELECT * FROM facts WHERE repo = 'firebase-oskey-dev' AND module = 'building'
), incident AS (
  SELECT DISTINCT e.edge_id, e.source_fact_ref, e.target_fact_ref, e.source_repo, e.target_repo,
         e.connection_type, e.resolution_status,
         sf.module AS source_module, tf.module AS target_module,
         sf.symbol_name AS source_symbol_name, tf.symbol_name AS target_symbol_name,
         (sf.fact_id IS NOT NULL) AS source_resolves, (tf.fact_id IS NOT NULL) AS target_resolves
  FROM cross_repo_edges e LEFT JOIN facts sf ON sf.fact_ref = e.source_fact_ref
  LEFT JOIN facts tf ON tf.fact_ref = e.target_fact_ref
  WHERE EXISTS (SELECT 1 FROM building b WHERE b.fact_ref = e.source_fact_ref)
     OR EXISTS (SELECT 1 FROM building b WHERE b.fact_ref = e.target_fact_ref)
)
SELECT edge_id, source_repo, source_module, source_symbol_name, target_repo, target_module,
       target_symbol_name, connection_type, resolution_status, source_resolves, target_resolves
FROM incident
ORDER BY CASE WHEN source_repo <> target_repo THEN 1
              WHEN source_module = 'building' AND target_module = 'building' THEN 2 ELSE 3 END,
         connection_type, edge_id
LIMIT 6;

ROLLBACK;
