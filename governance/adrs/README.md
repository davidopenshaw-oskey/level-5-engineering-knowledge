# Architectural Decision Records (`/governance/adrs`)

This directory captures the major architectural decisions, trade-offs, and design evolutions of the Level 5 Engineering Knowledge Platform.

---

## Records Catalog

- [`adr-000.md`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/governance/adrs/adr-000.md): Records the initial transition from manual AI interpretation (Phase 0) to deterministic AST evidence extraction (Phase 1) and the core decision to separate facts from knowledge.
- [`adr-001.md`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/governance/adrs/adr-001.md): Records the Antigravity-driven additions—Phase 1.5 AST corpus expansion, Phase 1.75 deterministic graph resolution (`04-build-resolved-graph.ts`), the 5-level synthesis hierarchy, and the LLM-agnostic directory architecture.
- [`adr-002.md`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/governance/adrs/adr-002.md): Records the decision to keep Phase 1 extraction strictly fact-based (e.g. fully-qualified type strings, unmodified), deferring all formatting/presentation choices to the Phase 2 synthesis layer.
- [`adr-003.md`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/governance/adrs/adr-003.md): Records the pivot realization that ADR-000's "don't throw raw source at the LLM" principle recurs at every synthesis layer, not just Phase 1 — a real module's full evidence graph can itself exceed context limits, so every Phase 2+ stage must independently bound its own LLM input.
- [`adr-004.md`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/governance/adrs/adr-004.md): Records the decision that information flowing into P2+ synthesis splits into three tiers (structural, deterministic-cross-reference, narrative), and only narrative content is safe to split across prompt bundles/hierarchical reduce — structural and deterministic facts must be computed once, completely, and delivered identically regardless of bundling, closing a correctness gap ADR-003 left open.
- [`adr-005.md`](file:///Users/dopenshaw/documentation/level-5_engineering_knowledge/governance/adrs/adr-005.md): Records (not yet decided) the pivot question of whether early whole-module prose synthesis is the right feeder for impact analysis and atomic PRDs, versus splitting into direct graph traversal, a retrieval (RAG-over-facts) index, and a separate proactive sanity/health-report generator — plus the finding that cross-repo edge-building is a deterministic join over already-extracted facts, not open research.
