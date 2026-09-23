BEGIN READ ONLY;

-- This query reproduces the service ranking table from the '10-core-hub-retrieval-coverage-2026-09-22.md' report.

-- Step 1: Identify all services in the 'core' module.
-- The report defines ownership relative to 'source_class' services.
WITH core_services AS (
    SELECT DISTINCT symbol_name AS service_name
    FROM facts
    WHERE repo = 'firebase-oskey-dev'
      AND module = 'core'
      AND kind = 'source_class'
      AND symbol_name LIKE '%Service'
),

-- Step 2: For each service, identify all facts it "owns".
-- Ownership is defined as the service name appearing in className or callerClass.
owned_facts AS (
    SELECT
        s.service_name,
        f.fact_ref
    FROM core_services s
    JOIN facts f ON f.repo = 'firebase-oskey-dev' AND f.module = 'core'
                 AND (f.payload->>'className' = s.service_name OR f.payload->>'callerClass' = s.service_name)
),

-- Step 3: Calculate fact counts per service.
fact_counts AS (
    SELECT
        service_name,
        count(*) AS facts
    FROM owned_facts
    GROUP BY service_name
),

-- Step 4: Identify all edges incident to each service and classify them.
incident_edges AS (
    SELECT DISTINCT -- Use DISTINCT on edge_id to handle edges between two facts of the same service
        of.service_name,
        e.edge_id,
        e.resolution_status,
        -- An edge is "in" if its target is owned by the service but its source is not.
        (e.target_fact_ref IN (SELECT fact_ref FROM owned_facts WHERE service_name = of.service_name)) AND
        (e.source_fact_ref NOT IN (SELECT fact_ref FROM owned_facts WHERE service_name = of.service_name)) AS is_inbound,
        -- An edge is "out" if its source is owned by the service but its target is not.
        (e.source_fact_ref IN (SELECT fact_ref FROM owned_facts WHERE service_name = of.service_name)) AND
        (e.target_fact_ref NOT IN (SELECT fact_ref FROM owned_facts WHERE service_name = of.service_name)) AS is_outbound,
        -- An edge is "internal" if both its source and target are owned by the service.
        (e.source_fact_ref IN (SELECT fact_ref FROM owned_facts WHERE service_name = of.service_name)) AND
        (e.target_fact_ref IN (SELECT fact_ref FROM owned_facts WHERE service_name = of.service_name)) AS is_internal
    FROM owned_facts of
    JOIN cross_repo_edges e ON e.source_fact_ref = of.fact_ref OR e.target_fact_ref = of.fact_ref
),

-- Step 5: Calculate edge counts per service.
edge_counts AS (
    SELECT
        service_name,
        count(DISTINCT edge_id) AS edges,
        count(DISTINCT CASE WHEN is_inbound THEN edge_id END) AS "in",
        count(DISTINCT CASE WHEN is_outbound THEN edge_id END) AS "out",
        count(DISTINCT CASE WHEN is_internal THEN edge_id END) AS internal,
        count(DISTINCT CASE WHEN resolution_status NOT IN ('resolved', 'confirmed') THEN edge_id END) AS unresolved
    FROM incident_edges
    GROUP BY service_name
),

-- Step 6: Identify neighboring services (other core services connected by edges).
fact_to_service_map AS (
    SELECT fact_ref, service_name FROM owned_facts
),
neighbor_pairs AS (
    SELECT
        source_map.service_name AS source_service,
        target_map.service_name AS target_service
    FROM cross_repo_edges e
    JOIN fact_to_service_map source_map ON e.source_fact_ref = source_map.fact_ref
    JOIN fact_to_service_map target_map ON e.target_fact_ref = target_map.fact_ref
    WHERE source_map.service_name != target_map.service_name
),
neighbor_counts AS (
    SELECT
        service_name,
        count(DISTINCT neighbor_service) AS neighbors
    FROM (
        SELECT source_service AS service_name, target_service AS neighbor_service FROM neighbor_pairs
        UNION
        SELECT target_service AS service_name, source_service AS neighbor_service FROM neighbor_pairs
    ) all_neighbors
    GROUP BY service_name
)

-- Final Step: Join all metrics and present the ranking table.
SELECT
    cs.service_name AS "Service",
    COALESCE(fc.facts, 0) AS "Facts",
    COALESCE(ec.edges, 0) AS "Edges",
    COALESCE(ec."in", 0) AS "In",
    COALESCE(ec."out", 0) AS "Out",
    COALESCE(ec.internal, 0) AS "Internal",
    COALESCE(nc.neighbors, 0) AS "Neighbors",
    COALESCE(ec.unresolved, 0) AS "Unresolved"
FROM core_services cs
LEFT JOIN fact_counts fc ON cs.service_name = fc.service_name
LEFT JOIN edge_counts ec ON cs.service_name = ec.service_name
LEFT JOIN neighbor_counts nc ON cs.service_name = nc.service_name
ORDER BY "Facts" DESC, "Edges" DESC;

-- The queries below are the original exports for the OSKAccessService pilot.

-- Export all facts owned by OSKAccessService
WITH owned AS (SELECT * FROM facts WHERE repo='firebase-oskey-dev' AND module='core' AND (payload->>'className'='OSKAccessService' OR payload->>'callerClass'='OSKAccessService'))
SELECT fact_ref,kind,file,line,symbol_name,payload->>'className' class_name,payload->>'callerClass' caller_class,payload->>'callerName' caller_name,payload->>'method' method,description,run_id FROM owned ORDER BY fact_ref;

-- Export all edges incident to OSKAccessService
WITH owned AS (SELECT fact_ref FROM facts WHERE repo='firebase-oskey-dev' AND module='core' AND (payload->>'className'='OSKAccessService' OR payload->>'callerClass'='OSKAccessService'))
SELECT DISTINCT e.edge_id,e.source_fact_ref,e.target_fact_ref,e.source_repo,e.target_repo,e.connection_type,e.resolution_status,e.provenance,e.generated_at FROM cross_repo_edges e JOIN owned o ON e.source_fact_ref=o.fact_ref OR e.target_fact_ref=o.fact_ref ORDER BY e.edge_id;

-- Export facts related to the 'createAccess' operation within OSKAccessService
WITH owned AS (SELECT * FROM facts WHERE repo='firebase-oskey-dev' AND module='core' AND (payload->>'className'='OSKAccessService' OR payload->>'callerClass'='OSKAccessService'))
SELECT fact_ref,kind,file,line,symbol_name,payload->>'calleeSymbol' callee_symbol,description,run_id FROM owned WHERE symbol_name='createAccess' OR payload->>'callerName'='createAccess' ORDER BY fact_ref;

ROLLBACK;
