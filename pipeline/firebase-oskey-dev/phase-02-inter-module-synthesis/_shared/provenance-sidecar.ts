// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Decision A1 (governance/roadmap/phase 2-llm q&a/01 facts-vs-decisions-for-
// review.md), fixed 2026-08-11: each generated document's dependencies and
// citations, persisted as structured data alongside the prose, not only
// embedded inside it. Two independent reasons this stopped being optional:
// (1) our own future invalidation work (Facts 1/2) needs to know what a
// document was actually generated from without re-deriving it from prose;
// (2) a downstream consumer -- specifically, the tech team's RAG/retrieval
// layer, which intends to index these documents -- cannot reliably recover a
// citation that only exists as a prose fragment once that fragment has been
// chunked, retrieved, or paraphrased (this is exactly what Fact 8 already
// warned about, now with a real, named consumer).
//
// Deliberately minimal, NOT the full persistent-knowledge-model bet
// (Decision A2 -- Signals, Conflicts, Reviews, lineage, Document snapshots).
// This is a sidecar, not a database: one JSON file per generated document,
// written next to it, containing what it was generated from and what its
// citations resolved to. Whether A2's heavier machinery is still needed on
// top of this is explicitly gated on finding the interface with the RAG
// retrieval layer first -- see governance/roadmap/03-token-economics-
// remediation-plan.md.

import fs from "fs";
import path from "path";
import { validateCitations, CitationStatus } from "./citation-validator";

export type GeneratorType = "llm" | "deterministic";

export interface ProvenanceSidecar {
  schemaVersion: string;
  documentPath: string;
  generatedAt: string;
  generatorType: GeneratorType;
  // Caller-supplied, deliberately unstructured beyond the type -- what this
  // document was actually built from. Shape varies by document kind (a
  // capability output's generatedFrom differs from an assembled module
  // profile's), which is fine: a RAG consumer indexing this treats it as
  // opaque metadata, not something it parses field-by-field.
  generatedFrom: Record<string, unknown>;
  citations: Array<{
    kind: "file-line" | "fact-id";
    raw: string;
    factId?: string;
    file?: string;
    status: CitationStatus;
  }>;
  citationSummary: {
    total: number;
    verified: number;
    lineUnverified: number;
    fileNotFound: number;
  };
}

/** Builds and writes a provenance sidecar next to `documentPath`, at
 * `<documentPath>.provenance.json`. `facts` is whatever evidence the
 * document's citations should be checked against -- same evidence graph
 * already used for citation validation at each call site, not re-fetched
 * here. Returns the sidecar so callers can also fold its summary into their
 * own notifications without re-reading the file back off disk. */
export function writeProvenanceSidecar(
  documentPath: string,
  content: string,
  facts: any[],
  generatedFrom: Record<string, unknown>,
  generatorType: GeneratorType
): ProvenanceSidecar {
  const validation = validateCitations(content, facts);

  const sidecar: ProvenanceSidecar = {
    schemaVersion: "1.0.0",
    documentPath,
    generatedAt: new Date().toISOString(),
    generatorType,
    generatedFrom,
    citations: validation.allCitations.map(c => ({
      kind: c.kind,
      raw: c.contextSnippet,
      factId: c.factId,
      file: c.file || undefined,
      status: c.status,
    })),
    citationSummary: {
      total: validation.totalCitations,
      verified: validation.verified,
      lineUnverified: validation.lineUnverified.length,
      fileNotFound: validation.fileNotFound.length,
    },
  };

  const sidecarPath = `${documentPath}.provenance.json`;
  fs.mkdirSync(path.dirname(sidecarPath), { recursive: true });
  fs.writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2), "utf8");

  return sidecar;
}
