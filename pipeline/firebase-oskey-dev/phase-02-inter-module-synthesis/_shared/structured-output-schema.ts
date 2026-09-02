// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Stage 1's JSON Schema (governance/roadmap/firebase-oskey-dev/11-structured-
// output-citation-pilot.md), moved verbatim from the Stage 2 experiment
// script into shared production code for Stage 4's real `01e` wiring. Passed
// to Gemini as `responseSchema` with `responseMimeType: "application/json"`
// (grammar-constrained decoding, Arm C from the pilot -- the arm the
// production migration decision actually rests on) via `callGemini`'s
// `config.responseSchema`, never as prompt text alone.
//
// Field shapes here MUST stay in sync with structured-output-render.ts's
// StructuredModuleResponse/StructuredCapability/StructuredFinding etc.
// interfaces -- there is deliberately no code-generation step between the
// two (a single small schema, hand-kept in sync, was judged simpler than a
// generator for one caller).

export const MODULE_LEVEL_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    moduleWide: {
      type: "object",
      properties: {
        executiveSummary: { type: "string" },
        architecturalPosition: { type: "string" },
        ownershipConclusions: {
          type: "array",
          description: "One entry per Firestore path touched by more than one capability.",
          items: {
            type: "object",
            properties: {
              path: { type: "string" },
              owningCapability: { type: "string" },
              rationale: { type: "string" },
              confidence: { type: "string", enum: ["confirmed", "inferred"] },
              evidenceIds: { type: "array", items: { type: "string" } },
            },
            required: ["path", "owningCapability", "rationale", "confidence", "evidenceIds"],
          },
        },
        crossCuttingPermissionsRisks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              finding: { type: "string" },
              confidence: { type: "string", enum: ["confirmed", "inferred"] },
              relatedCapabilities: { type: "array", items: { type: "string" } },
              evidenceIds: { type: "array", items: { type: "string" } },
            },
            required: ["title", "finding", "confidence", "relatedCapabilities", "evidenceIds"],
          },
        },
        architecturalObservations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              finding: { type: "string" },
              confidence: { type: "string", enum: ["confirmed", "inferred"] },
              relatedCapabilities: { type: "array", items: { type: "string" } },
              evidenceIds: { type: "array", items: { type: "string" } },
            },
            required: ["title", "finding", "confidence", "relatedCapabilities", "evidenceIds"],
          },
        },
        crossCuttingRisksAndOpenQuestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              finding: { type: "string" },
              confidence: { type: "string", enum: ["confirmed", "inferred", "unknown"] },
              relatedCapabilities: { type: "array", items: { type: "string" } },
              evidenceIds: { type: "array", items: { type: "string" } },
            },
            required: ["title", "finding", "confidence", "relatedCapabilities", "evidenceIds"],
          },
        },
      },
      required: ["executiveSummary", "architecturalPosition", "ownershipConclusions", "crossCuttingPermissionsRisks", "architecturalObservations", "crossCuttingRisksAndOpenQuestions"],
    },
    capabilities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Exact submodule name as given in the fact table's submodule column." },
          summary: { type: "string" },
          primaryResponsibilities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                responsibility: { type: "string" },
                confidence: { type: "string", enum: ["confirmed", "inferred"] },
                evidenceIds: { type: "array", items: { type: "string" } },
              },
              required: ["responsibility", "confidence", "evidenceIds"],
            },
          },
          dataOwnership: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                fieldsOwned: { type: "string" },
                evidenceIds: { type: "array", items: { type: "string" } },
              },
              required: ["path", "fieldsOwned", "evidenceIds"],
            },
          },
          notablePermissionsObservations: {
            type: "array",
            description: "Empty array if nothing genuinely stands out for this capability -- do not pad with generic content.",
            items: {
              type: "object",
              properties: {
                finding: { type: "string" },
                confidence: { type: "string", enum: ["confirmed", "inferred"] },
                evidenceIds: { type: "array", items: { type: "string" } },
              },
              required: ["finding", "confidence", "evidenceIds"],
            },
          },
          openQuestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                evidenceIds: { type: "array", items: { type: "string" } },
              },
              required: ["question", "evidenceIds"],
            },
          },
        },
        required: ["name", "summary", "primaryResponsibilities", "dataOwnership", "openQuestions"],
      },
    },
  },
  required: ["moduleWide", "capabilities"],
};
