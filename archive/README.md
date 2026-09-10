# Archive (`/archive`)

This directory contains decommissioned scripts, legacy working papers, and superseded contracts preserved for historical auditability.

---

## Contents

- `decomm_03-build-evidence-graph.ts`: Superseded evidence graph builder.
- `decommissioned_ai-task-contract-v1.0.md`: Retired AI task contract.
- `INV-001-internal-working-paper-v0.2.md`: Working notes from early Phase 1 exploration.
- `decomm_06-build-cross-repo-graph.ts`: Archived 2026-09-09 -- formerly `pipeline/cross-repo-synthesis/phase-03-ecosystem-topology/06-build-cross-repo-graph.ts`. Its real cross-repo-edge computation (HTTP_API_CALL joins + the manually-curated pub/sub binding table) was superseded by `pipeline/facts-postgres-index/build-cross-repo-edges.ts`, which fixed a real bare-handler-name join bug (see that script's own header comment) and reads live Postgres facts directly instead of on-disk JSON. Its real output (118 edges) has already been overwritten in the same `cross_repo_edges` table by the new script's correctly-computed rows. The rest of `pipeline/cross-repo-synthesis/` (the `phase-05-atomic-prd-impact/` stub) was removed alongside it -- its described contents (`prompt-template.md`, `contract.md`) no longer lived there; the real, active PRD pipeline is `pipeline/facts-postgres-index/generate-atomic-prd.ts`. See `governance/adrs/adr-007.md`'s 2026-09-09 update note for the full reasoning.
