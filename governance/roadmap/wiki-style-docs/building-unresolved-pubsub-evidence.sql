-- Read-only evidence inventory for unresolved Pub/Sub edges incident to
-- firebase-oskey-dev/building. Configuration comparison is documented in the
-- paired findings file; this SQL does not read or mutate the database.
BEGIN READ ONLY;

WITH building AS (
  SELECT fact_ref FROM facts
  WHERE repo = 'firebase-oskey-dev' AND module = 'building'
), unresolved AS (
  SELECT DISTINCT e.*
  FROM cross_repo_edges e
  WHERE e.connection_type = 'PUBSUB_TOPIC_BINDING'
    AND e.resolution_status = 'unresolved'
    AND (EXISTS (SELECT 1 FROM building b WHERE b.fact_ref = e.source_fact_ref)
      OR EXISTS (SELECT 1 FROM building b WHERE b.fact_ref = e.target_fact_ref))
)
SELECT e.edge_id, e.source_repo, e.source_symbol, e.source_fact_ref,
       e.target_repo, e.target_symbol, e.target_fact_ref,
       e.connection_type, e.resolution_status, e.provenance, e.confirmed_via,
       left(e.details, 500) AS edge_details, e.generated_at,
       sf.fact_id AS source_fact_id, sf.module AS source_module,
       sf.submodule AS source_submodule, sf.kind AS source_kind,
       sf.file AS source_file, sf.line AS source_line,
       left(sf.description, 350) AS source_description,
       (SELECT string_agg(key, ', ' ORDER BY key)
        FROM jsonb_object_keys(sf.payload) key) AS source_payload_keys,
       sr.run_id AS source_run_id, sr.commit_sha AS source_commit,
       sr.extracted_at AS source_extracted_at, sr.is_current AS source_run_current,
       tf.fact_id AS target_fact_id, tf.module AS target_module,
       tf.submodule AS target_submodule, tf.kind AS target_kind,
       tf.file AS target_file, tf.line AS target_line,
       left(tf.description, 350) AS target_description,
       (SELECT string_agg(key, ', ' ORDER BY key)
        FROM jsonb_object_keys(tf.payload) key) AS target_payload_keys,
       tr.run_id AS target_run_id, tr.commit_sha AS target_commit,
       tr.extracted_at AS target_extracted_at, tr.is_current AS target_run_current
FROM unresolved e
LEFT JOIN facts sf ON sf.fact_ref = e.source_fact_ref
LEFT JOIN extraction_runs sr ON sr.run_id = sf.run_id
LEFT JOIN facts tf ON tf.fact_ref = e.target_fact_ref
LEFT JOIN extraction_runs tr ON tr.run_id = tf.run_id
ORDER BY e.edge_id;

ROLLBACK;
