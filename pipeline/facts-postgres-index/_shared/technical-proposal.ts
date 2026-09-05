// **version:** 1.0.0
// **location:** level-5 P2 facts index (shared)
// © Oskey SAS. All rights reserved.
//
// The one LLM call in the atomic PRD pipeline -- produces Layer 3
// (Technical Proposal) plus User Stories, Acceptance Criteria, and
// Constraints together in a single structured-output call, per the design
// agreed in governance/roadmap/facts-serving-strategy/13-atomic-prd-
// pipeline-tasklist.md. Deliberately standalone, not importing from
// phase-02-inter-module-synthesis/_shared/llm-adapter.ts or reusing
// config/llm-providers.json -- same isolation principle already applied to
// embedding-adapter.ts in this same directory.
//
// Schema-enforced (responseSchema, grammar-constrained decoding), not
// free-text -- this pipeline never uses the regex/footnote citation
// mechanism the old Phase 2 pipeline used before its own structured-output
// migration. Every claim below carries its own evidenceIds, validated
// against the real fact IDs actually retrieved by search() -- a claim
// citing a fact ID that wasn't in the real evidence handed to this call is
// a fabrication, caught the same way the earlier structured-output work
// caught it, not assumed away.

import { GoogleGenAI } from "@google/genai";
import type { SearchResult } from "./search";

const PROJECT_ID = "test-ai-oskey-io";
const LOCATION = "global";
const MODEL = "gemini-3.5-flash"; // same production default already proven for structured output this session

const SCHEMA = {
  type: "object",
  properties: {
    technicalProposal: {
      type: "array",
      description: "Non-binding technical proposal points -- a starting point for a developer/agent to review against the current codebase, not an instruction.",
      items: {
        type: "object",
        properties: {
          point: { type: "string" },
          evidenceIds: { type: "array", items: { type: "string" }, description: "Real fact IDs from the supplied evidence that support this point. Never invented." },
        },
        required: ["point", "evidenceIds"],
      },
    },
    userStories: {
      type: "array",
      description: "Suggested, not authoritative -- the PM should confirm or edit these. Grounded in real actor/role facts in the evidence and the business context supplied, not invented.",
      items: {
        type: "object",
        properties: {
          actor: { type: "string" },
          goal: {
            type: "string",
            description: "A short clause completing 'I want ___', lowercase, no leading 'to' and no trailing period -- e.g. 'schedule a resident's departure date in advance', not 'Schedule a resident's departure date' or a full sentence.",
          },
          reason: {
            type: "string",
            description: "A short clause completing 'so that ___', lowercase, no trailing period -- e.g. 'access is removed automatically without manual work', not 'To automate...' or a full sentence.",
          },
        },
        required: ["actor", "goal", "reason"],
      },
    },
    acceptanceCriteria: {
      type: "array",
      description: "Checkable conditions for this workflow being done, grounded in the real evidence -- not paragraphs, one condition per item.",
      items: { type: "string" },
    },
    constraints: {
      type: "array",
      description: "Real, hard boundaries found in the evidence, stated positively -- e.g. 'N existing call sites perform an exhaustive check; widening this requires reviewing all N, not just adding a case.' Empty array if none found -- do not invent one to fill the section.",
      items: {
        type: "object",
        properties: {
          constraint: { type: "string" },
          evidenceIds: { type: "array", items: { type: "string" } },
        },
        required: ["constraint", "evidenceIds"],
      },
    },
  },
  required: ["technicalProposal", "userStories", "acceptanceCriteria", "constraints"],
};

export interface TechnicalProposalPoint {
  point: string;
  evidenceIds: string[];
}
export interface UserStory {
  actor: string;
  goal: string;
  reason: string;
}
export interface Constraint {
  constraint: string;
  evidenceIds: string[];
}
export interface Layer3Response {
  technicalProposal: TechnicalProposalPoint[];
  userStories: UserStory[];
  acceptanceCriteria: string[];
  constraints: Constraint[];
}

export interface Layer3ValidationResult {
  fabricatedEvidenceIds: string[];
}

/** Array-membership check against the real fact IDs actually retrieved --
 * the same discipline as the earlier structured-output work's
 * validateStructuredResponse, independently implemented here per this
 * pipeline's own scope boundary (no import from the old Phase 2 code). */
export function validateLayer3Response(response: Layer3Response, realFactIds: Set<string>): Layer3ValidationResult {
  const allEvidenceIds: string[] = [
    ...response.technicalProposal.flatMap(p => p.evidenceIds),
    ...response.constraints.flatMap(c => c.evidenceIds),
  ];
  return { fabricatedEvidenceIds: allEvidenceIds.filter(id => !realFactIds.has(id)) };
}

export async function generateTechnicalProposal(businessContext: string, evidence: SearchResult[]): Promise<Layer3Response> {
  const evidenceText = evidence
    .map(r => `- fact_id: ${r.factId}\n  ${r.kind} in ${r.repo}/${r.module}: ${r.symbolName ?? "(unnamed)"} -- ${r.description}`)
    .join("\n");

  const prompt = `## Business Context (from the Product Manager)\n\n${businessContext}\n\n---\n\n## Real Evidence (from the codebase, already retrieved -- do not invent facts beyond these)\n\n${evidenceText}\n\n---\n\n## Your job\n\nUsing ONLY the evidence above, produce a non-binding technical proposal, suggested user stories, checkable acceptance criteria, and any real constraints found in the evidence. Every technical proposal point and constraint must cite the real fact_id(s) from the evidence above that support it -- never a fact_id not listed above, never a range, never invented. If the evidence doesn't support a genuine constraint, return an empty constraints array rather than inventing one.\n\nReturn ONLY a single JSON object matching this exact shape (no markdown code fence, no conversational text before or after):\n\n${JSON.stringify(SCHEMA, null, 2)}`;

  const ai = new GoogleGenAI({ enterprise: true, project: PROJECT_ID, location: LOCATION });
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.2, maxOutputTokens: 8192 },
  });

  if (!response.text) {
    throw new Error(`[LLM_CALL_FAILED] Technical proposal call returned no text (finishReason: ${response.candidates?.[0]?.finishReason ?? "unknown"}).`);
  }

  return JSON.parse(response.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));
}
