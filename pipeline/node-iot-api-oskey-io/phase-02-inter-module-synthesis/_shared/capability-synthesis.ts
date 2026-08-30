// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Extracted from 01-generate-capability-based-profile.ts's Stage A loop and
// 01d-regenerate-single-capability.ts, which had independently built the
// same per-capability prompt-construction logic (01d's own header comment
// said as much: "Reuses the exact same prompt-construction logic as that
// script's Stage A loop"). Pulled out here per governance/roadmap/
// 04-complete-repo-run-and-repo-reports-plan.md Stage 1, as part of building
// 01a-generate-capability-syntheses.ts (a Stage-A-only runner for every pack
// in a module, so 01c can be run without paying for 01's now-superseded
// Stage B reduce call). Behavior is unchanged from both call sites' original
// logic -- this is a pure extraction, not a rewrite.

import { LlmProviderConfig, CACHE_BREAKPOINT_MARKER } from "./llm-adapter";
import { factsToCompactTable } from "../../phase-01-ast-extraction/_shared/run-utils";
// This repo's real request-contract fact type is route_definition + joi_schema_field,
// not Firebase's api_contract -- api-schema-resolver.ts is hardcoded to the latter and
// would silently resolve nothing here. See route-schema-resolver.ts's own header comment
// for why this join also can't be scoped to one capability pack's own facts the way
// Firebase's resolveApiSchemas(pack.facts) call is (governance/roadmap/
// node-iot-api-oskey-io/01-phase2-contract-design.md, Decision 2).
import { resolveRouteSchemas, formatResolvedRouteSchemas } from "./route-schema-resolver";

export interface CapabilityPackPayload {
  schemaVersion: string;
  runId: string;
  repoName: string;
  module: string;
  submodule: string;
  generatedAt: string;
  summary: { factCount: number };
  facts: any[];
}

export interface LoadedDoc {
  relPath: string;
  content: string;
}

export interface CapabilitySynthesisContext {
  runId: string;
  repoName: string;
  moduleName: string;
  llmConfigKey: string;
  llmConfig: LlmProviderConfig;
  moduleListSection: string;
  capabilitySynthesisDocs: LoadedDoc[];
  groundingDocs: LoadedDoc[];
  // The WHOLE module's facts (every capability pack combined, e.g. loaded
  // once from `${moduleName}-facts.json`) -- needed by resolveRouteSchemas
  // below, which cannot be scoped to one pack's own facts. See that
  // function's header comment. Loaded once per module by the caller, reused
  // across every capability call for that module -- not re-read per call.
  moduleFacts: any[];
}

/** Builds one capability-synthesis call's prompt, split at
 * CACHE_BREAKPOINT_MARKER between the stable prefix (contract + grounding
 * docs + module list -- identical across every capability call for this
 * module/run) and the variable per-capability content (evidence pack,
 * resolved API schemas, output-format instructions). See
 * CACHE_BREAKPOINT_MARKER's own comment in llm-adapter.ts for why the split
 * matters, and _shared/llm-adapter.ts's callGemini/callOpenAI for why a
 * non-Anthropic caller is still safe to use this unmodified (the marker gets
 * stripped, not misinterpreted). */
export function buildCapabilityPrompt(
  packName: string,
  pack: CapabilityPackPayload,
  ctx: CapabilitySynthesisContext
): { prompt: string; capRelPath: string } {
  const compactFacts = factsToCompactTable(pack.facts);
  const resolvedRouteSchemas = formatResolvedRouteSchemas(resolveRouteSchemas(ctx.moduleFacts, pack.facts));
  const capRelPath = `${packName}.md`;

  const stableSections: string[] = [];
  stableSections.push(`You are performing capability-level synthesis for one capability inside one module. Follow the supporting contract documents below exactly.`);
  stableSections.push(`## Supporting Contracts (persona, rules, output schema, task definition)`);
  for (const doc of ctx.capabilitySynthesisDocs) stableSections.push(`### ${doc.relPath}\n\n${doc.content}`);
  stableSections.push(`## Architectural Grounding Documents`);
  for (const doc of ctx.groundingDocs) stableSections.push(`### ${doc.relPath}\n\n${doc.content}`);
  stableSections.push(ctx.moduleListSection);

  const variableSections: string[] = [];
  variableSections.push(
    `## Generation Metadata (use these exact values verbatim)\n\n` +
      `- runId: ${ctx.runId}\n- generatedAt: ${pack.generatedAt}\n- repoName: ${ctx.repoName}\n- targetModule: ${ctx.moduleName}\n` +
      `- capability: ${packName}\n- llmConfigKey: ${ctx.llmConfigKey}\n- llmProvider: ${ctx.llmConfig.provider}\n- llmModel: ${ctx.llmConfig.model}`
  );
  variableSections.push(`## Capability Evidence Pack (${packName}, ${pack.summary.factCount} facts, compact table encoding)\n\n${compactFacts}`);
  variableSections.push(`## Resolved Route Request Schemas (deterministic join, not narrative -- use this directly)\n\n${resolvedRouteSchemas}`);
  variableSections.push(
    `## Output Format (mandatory)\n\n` +
      `Produce exactly one file. Wrap it EXACTLY as follows, with no other text before, between, or after:\n\n` +
      `===FILE: ${capRelPath}===\n<full content of the capability synthesis per the output schema>\n===END FILE===\n\n` +
      `Do not include any conversational preamble, explanation, or text outside this marked block.`
  );

  const prompt = stableSections.join("\n\n---\n\n") + CACHE_BREAKPOINT_MARKER + variableSections.join("\n\n---\n\n");
  return { prompt, capRelPath };
}
