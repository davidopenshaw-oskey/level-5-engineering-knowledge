BEGIN READ ONLY;
WITH owned AS (SELECT * FROM facts WHERE repo='firebase-oskey-dev' AND module='core' AND (payload->>'className'='OSKAccessService' OR payload->>'callerClass'='OSKAccessService'))
SELECT fact_ref,kind,file,line,symbol_name,payload->>'className' class_name,payload->>'callerClass' caller_class,payload->>'callerName' caller_name,payload->>'method' method,description,run_id FROM owned ORDER BY fact_ref;
WITH owned AS (SELECT fact_ref FROM facts WHERE repo='firebase-oskey-dev' AND module='core' AND (payload->>'className'='OSKAccessService' OR payload->>'callerClass'='OSKAccessService'))
SELECT DISTINCT e.edge_id,e.source_fact_ref,e.target_fact_ref,e.source_repo,e.target_repo,e.connection_type,e.resolution_status,e.provenance,e.generated_at FROM cross_repo_edges e JOIN owned o ON e.source_fact_ref=o.fact_ref OR e.target_fact_ref=o.fact_ref ORDER BY e.edge_id;
WITH owned AS (SELECT * FROM facts WHERE repo='firebase-oskey-dev' AND module='core' AND (payload->>'className'='OSKAccessService' OR payload->>'callerClass'='OSKAccessService'))
SELECT fact_ref,kind,file,line,symbol_name,payload->>'calleeSymbol' callee_symbol,description,run_id FROM owned WHERE symbol_name='createAccess' OR payload->>'callerName'='createAccess' ORDER BY fact_ref;
-- Full semantic export for the worked operation; payloads retained locally, no embeddings.
WITH operation AS (SELECT * FROM facts WHERE repo='firebase-oskey-dev' AND module='core'
 AND (payload->>'className'='OSKAccessService' OR payload->>'callerClass'='OSKAccessService')
 AND (symbol_name='createAccess' OR payload->>'callerName'='createAccess'))
SELECT f.fact_ref,f.repo,f.module,f.submodule,f.kind,f.file,f.line,f.symbol_name,f.description,f.payload,r.run_id,r.commit_sha,r.extracted_at,r.is_current
FROM operation f LEFT JOIN extraction_runs r ON r.run_id=f.run_id ORDER BY f.fact_ref;
WITH operation AS (SELECT fact_ref FROM facts WHERE repo='firebase-oskey-dev' AND module='core'
 AND (payload->>'className'='OSKAccessService' OR payload->>'callerClass'='OSKAccessService')
 AND (symbol_name='createAccess' OR payload->>'callerName'='createAccess'))
SELECT DISTINCT e.*,sf.file source_file,sf.line source_line,sf.run_id source_run,tf.file target_file,tf.line target_line,tf.run_id target_run
FROM cross_repo_edges e JOIN operation o ON e.source_fact_ref=o.fact_ref OR e.target_fact_ref=o.fact_ref
LEFT JOIN facts sf ON sf.fact_ref=e.source_fact_ref LEFT JOIN facts tf ON tf.fact_ref=e.target_fact_ref ORDER BY e.edge_id;
ROLLBACK;
