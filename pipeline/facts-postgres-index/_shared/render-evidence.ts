// **version:** 1.1.0
// **location:** level-5 P2 facts index (shared)
// © Oskey SAS. All rights reserved.
//
// Renders search() results into the atomic PRD template's Layer 2 (Evidence)
// section -- a deterministic render, no LLM involvement, per the design
// agreed in governance/roadmap/facts-serving-strategy/13-atomic-prd-
// pipeline-tasklist.md. Every fact rendered here came from a real Postgres
// row with a real fact_id -- there is no free-text citation-extraction step
// because there was never free text to extract from, unlike the old Phase 2
// pipeline this deliberately doesn't touch.
//
// Everything this function renders is fact-backed by construction (this
// pipeline never reads source directly the way the earlier hand-traces
// did) -- so there's no 🟢/🔵 split to make here. What DOES need honesty is
// confidence: a low-confidence search result must read as uncertain, not be
// dressed up as a solid finding just because it's the best we found.
//
// v1.1.0, 2026-09-03: numbered (1., 2., ...) in real search-rank order, not
// plain bullets -- Layer 3's technical proposal / constraints cite facts
// back by these same numbers (generate-atomic-prd.ts's citationList) instead
// of repeating the full fact_id inline, which read as noise to a developer.
// No separate appendix needed: validateLayer3Response already guarantees
// every Layer 3 citation is one of these exact facts, so this numbered list
// IS the appendix.
//
// v1.2.0, 2026-09-03 (task 5c, governance/roadmap/facts-serving-strategy/
// 14-...md): an optional second section renders real graph neighbors
// (_shared/graph-traversal.ts) of the vector-search anchors above --
// deliberately never merged into one flat list. Matches this project's
// own established honesty-labeling discipline (the earlier hand-traces'
// 🟢/🔵 split): a fact vector search matched semantically is a different
// kind of evidence than a fact structurally connected to one via a real
// call/API/pub-sub edge, and a reader should be able to tell which is
// which at a glance, not have to infer it. Numbering continues the same
// sequence (11, 12, ... after a 10-result anchor list) rather than
// restarting, so Layer 3 citations work identically against either list.

import type { SearchResponse } from "./search";
import type { GraphNeighborFact } from "./graph-traversal";

export function renderEvidence(response: SearchResponse, graphNeighbors: GraphNeighborFact[] = []): string {
  const parts: string[] = [];

  if (!response.confident) {
    parts.push(
      `**⚠ Low confidence.** ${response.lowConfidenceMessage} The facts below are the closest matches found, not a confirmed answer -- treat them as a starting point for investigation, not settled evidence.`
    );
  }

  if (response.results.length === 0) {
    parts.push("*(no facts found for this query)*");
    return parts.join("\n\n");
  }

  parts.push(
    response.results
      .map((r, i) => `${i + 1}. **${r.symbolName ?? "(unnamed)"}** (${r.kind}, ${r.repo}/${r.module}) — ${r.description} \`${r.factId}\``)
      .join("\n")
  );

  if (graphNeighbors.length > 0) {
    const startingNumber = response.results.length + 1;
    parts.push(
      `**Related via call graph** (structurally connected to the facts above via a real call/API/pub-sub edge -- not matched by the search query itself):`
    );
    parts.push(
      graphNeighbors
        .map((n, i) => {
          const connectionText = n.connections
            .map(c => `${c.direction === "outgoing" ? "called by" : "calls"} #${c.anchorNumber} (${c.connectionType})`)
            .join("; ");
          return `${startingNumber + i}. **${n.symbolName ?? "(unnamed)"}** (${n.kind}, ${n.repo}/${n.module}) — ${n.description} -- ${connectionText} \`${n.factId}\``;
        })
        .join("\n")
    );
  }

  return parts.join("\n\n");
}
