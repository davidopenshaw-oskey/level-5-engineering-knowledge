-- Read-only evidence bundle for the createNonAppUserWithAccess wiki pilot.
BEGIN READ ONLY;

-- Candidate selection: inspect only these three resolved HTTP targets.
WITH candidates(symbol_name) AS (
  VALUES ('getBuildingsByPropertyId'), ('createNonAppUserWithAccess'),
         ('createOrganizationBuilding')
)
SELECT c.symbol_name, f.submodule, count(DISTINCT e.edge_id) AS resolved_http_edges,
       count(DISTINCT a.fact_ref) AS api_contracts
FROM candidates c
JOIN facts f ON f.repo = 'firebase-oskey-dev' AND f.module = 'building'
            AND f.symbol_name = c.symbol_name
LEFT JOIN cross_repo_edges e ON e.target_fact_ref = f.fact_ref
                            AND e.connection_type = 'HTTP_API_CALL'
                            AND e.resolution_status = 'resolved'
LEFT JOIN facts a ON a.repo = f.repo AND a.module = f.module
                 AND a.kind = 'api_contract' AND a.symbol_name = c.symbol_name
GROUP BY c.symbol_name, f.submodule ORDER BY c.symbol_name, f.submodule;

-- At most 20 direct named/caller facts, with run/commit provenance.
WITH selected AS (
  SELECT f.* FROM facts f
  WHERE f.repo = 'firebase-oskey-dev' AND f.module = 'building'
    AND (f.symbol_name = 'createNonAppUserWithAccess'
      OR f.payload ->> 'callerName' = 'createNonAppUserWithAccess'
      OR f.symbol_name LIKE 'OSKCreateNonAppUserWithAccessRequest.%'
      OR f.symbol_name LIKE 'OSKCreateNonAppUserwithAccessResponse.%')
  ORDER BY f.file, f.line, f.kind
  LIMIT 20
)
SELECT s.fact_ref, s.kind, s.submodule, s.file, s.line, s.symbol_name,
       left(s.description, 420) AS description,
       s.payload ->> 'calleeSymbol' AS callee_symbol,
       s.payload #>> '{evidence,requestType}' AS request_type,
       s.payload #>> '{evidence,responseType}' AS response_type,
       s.payload #>> '{evidence,arguments}' AS arguments,
       r.run_id, r.commit_sha, r.extracted_at, r.is_current
FROM selected s LEFT JOIN extraction_runs r ON r.run_id = s.run_id
ORDER BY s.file, s.line, s.kind;

-- At most 10 direct resolved HTTP edges for the chosen operation.
SELECT e.edge_id, e.source_repo, e.source_symbol, e.source_fact_ref,
       e.target_repo, e.target_symbol, e.target_fact_ref,
       e.connection_type, e.resolution_status, e.provenance,
       e.generated_at
FROM cross_repo_edges e
JOIN facts target ON target.fact_ref = e.target_fact_ref
WHERE target.repo = 'firebase-oskey-dev' AND target.module = 'building'
  AND target.symbol_name = 'createNonAppUserWithAccess'
  AND e.connection_type = 'HTTP_API_CALL' AND e.resolution_status = 'resolved'
ORDER BY e.edge_id LIMIT 10;

ROLLBACK;
