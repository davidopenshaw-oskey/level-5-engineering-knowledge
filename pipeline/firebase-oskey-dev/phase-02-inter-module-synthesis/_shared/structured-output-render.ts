// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Stage 3 of governance/roadmap/firebase-oskey-dev/11-structured-output-
// citation-pilot.md's Firebase production migration -- renders the
// schema-enforced structured LLM response (Stage 1's JSON Schema) into the
// same 0-14 numbered markdown document 01e-generate-module-level-profile.ts
// already produces today, and validates its evidence IDs against real
// facts. Deliberately does NOT touch the deterministic sections (4, 5, 7-8,
// 10, 11) -- those stay exactly as they are, built from facts directly by
// existing code (buildPublicInterfacesSection etc.), untouched by whether
// the LLM-authored sections are structured or free-text.
//
// Real simplification over today's free-text pipeline, not a workaround:
// evidenceIds are already a clean array of short-ID strings per finding, so
// restoration is a direct idMap lookup (no regex needed at all -- no
// expandShortIdRangeCitations/expandBundledShortIdCitations/
// findUnrestoredShortIdCitations equivalent exists here because there is no
// free-text shape for those bugs to occur in), and validation is a real
// array-membership check, not text extraction from prose. The one real
// simplification of the source data itself: this schema only supports
// fact-ID evidence, not the free-text contract's separate file-line
// citation form (used today for citing an unwieldy multi-line
// call_expression id) -- acceptable for this migration since fact-ID is
// the dominant form in real usage, revisit if that turns out to matter.

import { EvidenceAppendixEntry, formatEvidenceAppendix } from "../../phase-01-ast-extraction/_shared/run-utils";

export interface StructuredFinding {
  title: string;
  finding: string;
  confidence: string;
  relatedCapabilities: string[];
  evidenceIds: string[];
}

export interface StructuredOwnershipConclusion {
  path: string;
  owningCapability: string;
  rationale: string;
  confidence: string;
  evidenceIds: string[];
}

export interface StructuredResponsibility {
  responsibility: string;
  confidence: string;
  evidenceIds: string[];
}

export interface StructuredDataOwnership {
  path: string;
  fieldsOwned: string;
  evidenceIds: string[];
}

export interface StructuredPermissionsObservation {
  finding: string;
  confidence: string;
  evidenceIds: string[];
}

export interface StructuredOpenQuestion {
  question: string;
  evidenceIds: string[];
}

export interface StructuredCapability {
  name: string;
  summary: string;
  primaryResponsibilities: StructuredResponsibility[];
  dataOwnership: StructuredDataOwnership[];
  notablePermissionsObservations?: StructuredPermissionsObservation[];
  openQuestions: StructuredOpenQuestion[];
}

export interface StructuredModuleResponse {
  moduleWide: {
    executiveSummary: string;
    architecturalPosition: string;
    ownershipConclusions: StructuredOwnershipConclusion[];
    crossCuttingPermissionsRisks: StructuredFinding[];
    architecturalObservations: StructuredFinding[];
    crossCuttingRisksAndOpenQuestions: StructuredFinding[];
  };
  capabilities: StructuredCapability[];
}

// Real, found 2026-08-31 on the FIRST real production call under this
// migration (module 'organization', gemini-3.5-flash, real gemini-default
// config -- not a pilot/comparison run): two `evidenceIds` array elements
// came back as `"F558, F559"` and `"F2318, F2327"` -- one array-of-strings
// element bundling two real short IDs with a comma, instead of two separate
// array elements. The schema's `type: "string"` constraint on each element
// doesn't (and structurally can't) prevent this -- it only fails to
// validate as a real ID once looked up directly, which is exactly the
// failure this pipeline's validation exists to catch. Narrower and safer
// than the free-text mechanism's equivalent bundled-citation problem
// (governance/roadmap/firebase-oskey-dev/11-structured-output-citation-
// pilot.md): there is no open-ended prose to scan, just one known field
// shape to split on a known delimiter, real fact short IDs are always
// exactly `F\d+`, and a token that still doesn't match after splitting is
// left as-is and correctly caught by fabricatedEvidenceIds/unresolvable
// rendering below -- this never silently drops or invents an ID.
function normalizeEvidenceIds(ids: string[]): string[] {
  return ids.flatMap(id => id.split(/[,\s]+/).filter(Boolean));
}

/** Real evidence-ID validation against the module's own real facts -- an
 * array-membership check, not citation-validator.ts's text-extraction
 * approach, since there is no prose to extract from. capabilityNameSet lets
 * a bad `name` field (a capability that doesn't match any real pack) get
 * caught the same way the free-text pipeline's SINGLE_CAPABILITY_NAME_
 * REMAPPED/missingCapabilities checks do, just via direct lookup. */
export interface StructuredValidationResult {
  totalEvidenceIds: number;
  fabricatedEvidenceIds: string[];
  unknownCapabilityNames: string[];
  missingCapabilityNames: string[];
}

export function validateStructuredResponse(
  parsed: StructuredModuleResponse,
  idMap: Record<string, string>,
  realPackNames: string[]
): StructuredValidationResult {
  const allEvidenceIds: string[] = [];
  const collect = (obj: any) => {
    if (Array.isArray(obj)) { for (const v of obj) collect(v); return; }
    if (obj && typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) {
        if (k === "evidenceIds" && Array.isArray(v)) allEvidenceIds.push(...normalizeEvidenceIds(v as string[]));
        else collect(v);
      }
    }
  };
  collect(parsed);

  const fabricatedEvidenceIds = allEvidenceIds.filter(id => !idMap[id]);
  const realPackNameSet = new Set(realPackNames);
  const respondedNames = new Set(parsed.capabilities.map(c => c.name));
  const unknownCapabilityNames = parsed.capabilities.map(c => c.name).filter(n => !realPackNameSet.has(n));
  const missingCapabilityNames = realPackNames.filter(n => !respondedNames.has(n));

  return { totalEvidenceIds: allEvidenceIds.length, fabricatedEvidenceIds, unknownCapabilityNames, missingCapabilityNames };
}

/** Renders the module-wide + per-capability sections (1, 2, 3, 6, 9, 12, 13
 * in 01e's real numbering) from the structured response, footnoting every
 * evidence ID with the same `(FactId:#NNN)` convention the free-text
 * pipeline already uses, so Section 14's real format is unchanged and every
 * other downstream consumer (citation-validator.ts's FACT_ID_PATTERN,
 * human readers used to the existing convention) sees the identical shape.
 * Returns the rendered section strings (caller splices in the deterministic
 * sections 0/4/5/7-8/10/11 exactly as 01e does today) plus the appendix for
 * Section 14. */
export function renderStructuredModuleProfile(
  parsed: StructuredModuleResponse,
  idMap: Record<string, string>
): { sections: Record<"1" | "2" | "3" | "6" | "9" | "12" | "13", string>; appendix: EvidenceAppendixEntry[] } {
  const appendix: EvidenceAppendixEntry[] = [];
  const markerByFactId = new Map<string, number>();
  let nextMarker = 1;

  const footnotesFor = (evidenceIds: string[]): string => {
    return normalizeEvidenceIds(evidenceIds)
      .map(shortId => {
        const realId = idMap[shortId];
        if (!realId) return `(unresolvable:${shortId})`; // surfaces loudly in the rendered doc rather than silently vanishing -- caught separately by validateStructuredResponse's fabricatedEvidenceIds too
        let marker = markerByFactId.get(realId);
        if (marker === undefined) {
          marker = nextMarker++;
          markerByFactId.set(realId, marker);
          appendix.push({ marker, kind: "fact-id", factId: realId });
        }
        return `(FactId:#${String(marker).padStart(3, "0")})`;
      })
      .join(" ");
  };

  const renderFinding = (f: StructuredFinding): string => {
    const rel = f.relatedCapabilities?.length ? ` (${f.relatedCapabilities.join(", ")})` : "";
    return `- **${f.title}**${rel} [${f.confidence}]: ${f.finding} ${footnotesFor(f.evidenceIds)}`;
  };

  const mw = parsed.moduleWide;

  const section1 = mw.executiveSummary;
  const section2 = mw.architecturalPosition;

  const section3 = parsed.capabilities
    .map(
      cap =>
        `**${cap.name}**\n\n${cap.summary}\n\n` +
        cap.primaryResponsibilities.map(r => `- ${r.responsibility} [${r.confidence}] ${footnotesFor(r.evidenceIds)}`).join("\n")
    )
    .join("\n\n");

  const ownershipConclusionText = mw.ownershipConclusions.length
    ? mw.ownershipConclusions
        .map(o => `- **${o.path}** → \`${o.owningCapability}\` [${o.confidence}]: ${o.rationale} ${footnotesFor(o.evidenceIds)}`)
        .join("\n")
    : "*(no Firestore path touched by more than one capability -- no cross-capability ownership conclusion needed)*";
  const dataOwnershipText = parsed.capabilities
    .map(cap => `**${cap.name}**\n\n` + cap.dataOwnership.map(o => `- \`${o.path}\`: ${o.fieldsOwned} ${footnotesFor(o.evidenceIds)}`).join("\n"))
    .join("\n\n");
  const section6 = `**Ownership conclusion:**\n\n${ownershipConclusionText}\n\n**Per-capability evidence:**\n\n${dataOwnershipText}`;

  const permissionsRiskText = mw.crossCuttingPermissionsRisks.length
    ? mw.crossCuttingPermissionsRisks.map(renderFinding).join("\n")
    : "*(no cross-cutting permissions risk identified)*";
  const notablePermissionsText = parsed.capabilities
    .map(cap => {
      const items = cap.notablePermissionsObservations ?? [];
      const body = items.length ? items.map(p => `- ${p.finding} [${p.confidence}] ${footnotesFor(p.evidenceIds)}`).join("\n") : "*(nothing notable for this capability)*";
      return `**${cap.name}**\n\n${body}`;
    })
    .join("\n\n");
  const section9 = `**Cross-cutting risk callouts:**\n\n${permissionsRiskText}\n\n**Per-capability evidence:**\n\n${notablePermissionsText}`;

  const section12 = mw.architecturalObservations.length ? mw.architecturalObservations.map(renderFinding).join("\n") : "*(no cross-cutting architectural observation identified)*";

  const crossCuttingRisksText = mw.crossCuttingRisksAndOpenQuestions.length
    ? mw.crossCuttingRisksAndOpenQuestions.map(renderFinding).join("\n")
    : "*(no cross-cutting risk identified)*";
  const openQuestionsText = parsed.capabilities
    .map(cap => `**${cap.name}**\n\n` + (cap.openQuestions.length ? cap.openQuestions.map(q => `- ${q.question} ${footnotesFor(q.evidenceIds)}`).join("\n") : "*(none)*"))
    .join("\n\n");
  const section13 = `**Cross-cutting risks:**\n\n${crossCuttingRisksText}\n\n**Per-capability open questions:**\n\n${openQuestionsText}`;

  return { sections: { "1": section1, "2": section2, "3": section3, "6": section6, "9": section9, "12": section12, "13": section13 }, appendix };
}

export { formatEvidenceAppendix };
