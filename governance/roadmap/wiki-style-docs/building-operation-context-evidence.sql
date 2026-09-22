-- Read-only traceability recovery for the selected wiki-pilot facts.
BEGIN READ ONLY;

WITH selected(fact_ref) AS (
  VALUES
    ('80c8ad28d03fe952da108853a6667048aea13641'),
    ('cb5655f1cbc39173e2c4fa8904a17856a3ba99ee'),
    ('c9cb78c24940c0b611a14f791a76f2e322ba4732'),
    ('22156263a374fcce3d74e6c09f06c2c2fba44ba6'),
    ('135bb55f8f89f17d69fde84e93fe28fad7b1fdd1'),
    ('ea88677be932b3c885c3801418f0b1e3d7c7b3d7'),
    ('e1af68a3a0aaf78662df5115952cc02e830ab150'),
    ('52b475756148816ba2cca3da396566a5fdaffc62'),
    ('aa0445f4747d672fe39fb58506a13d902fe06b20'),
    ('2eebe460a8e50fd4a3fc5e042cfd2dc720ba07fb'),
    ('cc101ae38a66ecaced83f081c71a013bc7bb9f02'),
    ('53646eab30fd2210530cbcd962f99a95a9539b95'),
    ('4675ea1c0554a0d785b35e39b722fb0d7f6d40a9')
)
SELECT f.fact_ref, f.repo, f.module, f.submodule, f.kind, f.file, f.line,
       f.symbol_name, left(f.description, 400) AS description,
       f.payload #>> '{evidence,arguments}' AS arguments,
       r.run_id, r.commit_sha, r.extracted_at, r.is_current
FROM selected s JOIN facts f ON f.fact_ref = s.fact_ref
LEFT JOIN extraction_runs r ON r.run_id = f.run_id
ORDER BY f.file, f.line, f.kind;

SELECT e.edge_id, e.source_repo, e.source_symbol, e.source_fact_ref,
       sf.file AS source_file, sf.line AS source_line, sf.run_id AS source_run_id,
       e.target_repo, e.target_symbol, e.target_fact_ref,
       tf.file AS target_file, tf.line AS target_line, tf.run_id AS target_run_id,
       e.connection_type, e.resolution_status, e.provenance, e.generated_at
FROM cross_repo_edges e
LEFT JOIN facts sf ON sf.fact_ref = e.source_fact_ref
LEFT JOIN facts tf ON tf.fact_ref = e.target_fact_ref
WHERE e.edge_id = 53640;

ROLLBACK;
