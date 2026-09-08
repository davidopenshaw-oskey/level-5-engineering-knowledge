// Steps 4-5 of governance/roadmap/mcp-direction/10-sectioncontent-
// implementation-tasklist.md. Real, verified 2026-09-06 against hand-
// constructed real-fact_id/fabricated-fact_id and matching/mismatching-
// heading cases (both correctly accepted and correctly rejected) before
// being wired into atomic-prd-agent.ts.
//
// adr-008.md's real reframe: these are NOT persona-prompt "rules" -- a
// prompt instruction the model happens to skip produces silently bad
// output, not a caught failure. Both checks here are mandatory, run
// unconditionally after every generation, and fail closed.
import type { GenerateResponse } from "genkit";
import type { GenerationOutput } from "./section-content";

// Every real fact_id actually returned by any tool call this run -- scans
// real tool RESPONSE payloads (not requests), across all three tools' real
// result shapes (SearchResult.factId, GraphNeighborFact.factId,
// ClusterMember.factId / ClusterEdge.sourceFactId+targetFactId).
export function extractRealFactIds(response: GenerateResponse<unknown>): Set<string> {
  const ids = new Set<string>();
  for (const message of response.messages) {
    for (const part of message.content) {
      if (!("toolResponse" in part) || !part.toolResponse) continue;
      const output = part.toolResponse.output;
      const collect = (value: unknown) => {
        if (Array.isArray(value)) {
          value.forEach(collect);
          return;
        }
        if (value && typeof value === "object") {
          for (const [key, v] of Object.entries(value)) {
            if ((key === "factId" || key === "sourceFactId" || key === "targetFactId") && typeof v === "string") ids.add(v);
            else collect(v);
          }
        }
      };
      collect(output);
    }
  }
  return ids;
}

// Fail-closed: every cited-list claim's evidenceIds must exact-substring-
// match a real fact_id actually seen in this run's own tool results. The
// persona must separately instruct citing fact_ids verbatim in backticks --
// a paraphrased citation would slip past this exact-match undetected.
export function checkFabrication(output: GenerationOutput, realFactIds: Set<string>): void {
  const fabricated: string[] = [];
  for (const section of output.sections) {
    if (section.content.kind !== "cited-list") continue;
    for (const item of section.content.items) {
      for (const id of item.evidenceIds) {
        if (!realFactIds.has(id)) fabricated.push(id);
      }
    }
  }
  if (fabricated.length > 0) {
    throw new Error(`[FABRICATED_CITATION] Cited fact_id(s) not present in this run's real tool results: ${fabricated.join(", ")}`);
  }
}

// Fail-closed: the run's rendered section headings must match the
// template's own declared LLM-authored heading list -- order-strict, not
// just presence-strict, since a reordered document is a real conformance
// failure (reading flow matters), not cosmetic.
export function checkTemplateConformance(output: GenerationOutput, expectedHeadings: string[]): void {
  const actual = output.sections.map(s => s.heading);
  const mismatch = actual.length !== expectedHeadings.length || actual.some((h, i) => h !== expectedHeadings[i]);
  if (mismatch) {
    throw new Error(`[TEMPLATE_NONCONFORMANT] Expected headings in order [${expectedHeadings.join(", ")}], got [${actual.join(", ")}].`);
  }
}
