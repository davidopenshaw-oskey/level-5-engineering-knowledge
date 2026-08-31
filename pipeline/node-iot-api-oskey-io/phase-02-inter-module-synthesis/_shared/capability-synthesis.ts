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

/** Deterministically builds capability contract Section 3 (Public Interfaces
 * — Route Handlers & Controllers) from `route_definition` + `controller_method`
 * facts, replacing what used to be an open-ended LLM discovery task. Ported
 * from firebase-oskey-dev's V1-A fix (governance/roadmap/
 * v1-a-capability-synthesis-contract-scope-2026-08-30.md) but NOT a
 * byte-for-byte copy -- that version builds from `controller_method`/
 * `service_method` with a controller-vs-service kind split, which does not
 * apply here. This repo's contract already documents (Phase 1 Handoff 3,
 * verified against real data) a genuinely different two-tier shape:
 *
 * - **Route Handler class(es)** -- the true HTTP entry point, sourced from
 *   `route_definition.handlerClass`/`.handlerMethod` (already-resolved
 *   literal fields), NOT from `route_handler_method` facts. Confirmed
 *   directly: this repo's real routed methods are arrow-function-valued
 *   class properties, invisible to the generic method-extraction that
 *   produces `route_handler_method` facts -- that fact type, where present,
 *   only ever shows a class's *other* private helper methods.
 * - **Controller class(es)** -- the Mongo-backed data-access layer, sourced
 *   from `controller_method` facts' `className`/`method`/
 *   `evidence.visibility`, filtered to `visibility === "public"`. There is
 *   no third "service" tier here (unlike Firebase) -- `service_method`
 *   facts only exist in `_module_root`'s infra grouping (Decision 4), never
 *   as part of any capability's own Public Interfaces.
 *
 * Both tiers require the class to also appear as an exported `source_class`
 * fact -- same "only exported classes are public interfaces by definition"
 * rule Firebase's version applies, confirmed both route-handler and
 * controller classes are always recorded as `source_class` facts in this
 * repo's real data. */
export function buildPublicInterfacesSection(facts: any[]): string {
  interface ClassMeta {
    file: string;
    line: number;
    factId: string;
  }

  const classMeta = new Map<string, ClassMeta>();
  for (const f of facts) {
    if (f.type === "source_class" && f.isExported && f.className) {
      classMeta.set(f.className, { file: f.file, line: f.line, factId: f.id });
    }
  }

  interface RouteHandlerEntry {
    method: string;
    httpMethod: string;
    httpPath: string;
    factId: string;
  }
  const routeHandlersByClass = new Map<string, RouteHandlerEntry[]>();
  for (const f of facts) {
    if (f.type !== "route_definition" || !f.handlerClass || !f.handlerMethod) continue;
    if (!classMeta.has(f.handlerClass)) continue;
    const arr = routeHandlersByClass.get(f.handlerClass) ?? [];
    if (!arr.some(e => e.method === f.handlerMethod)) {
      arr.push({ method: f.handlerMethod, httpMethod: f.method, httpPath: f.httpPath, factId: f.id });
    }
    routeHandlersByClass.set(f.handlerClass, arr);
  }

  interface ControllerMethodEntry {
    method: string;
    visibility: string;
    factId: string;
  }
  const controllerMethodsByClass = new Map<string, ControllerMethodEntry[]>();
  for (const f of facts) {
    if (f.type !== "controller_method" || !f.className) continue;
    if (!classMeta.has(f.className)) continue;
    const arr = controllerMethodsByClass.get(f.className) ?? [];
    arr.push({
      method: f.method ?? f.symbol ?? "(unnamed)",
      visibility: f.evidence?.visibility ?? "public",
      factId: f.id,
    });
    controllerMethodsByClass.set(f.className, arr);
  }

  if (routeHandlersByClass.size === 0 && controllerMethodsByClass.size === 0) {
    return "(no exported route handler or controller classes evidenced in this capability's pack)";
  }

  const lines: string[] = [];

  if (routeHandlersByClass.size > 0) {
    lines.push(`**Route Handler Class(es)** (the true HTTP entry point for this capability's routes)`);
    for (const className of Array.from(routeHandlersByClass.keys()).sort()) {
      const meta = classMeta.get(className)!;
      lines.push(`- **${className}** \`\`${meta.factId}\`\``);
      for (const m of routeHandlersByClass.get(className)!.sort((a, b) => a.method.localeCompare(b.method))) {
        lines.push(`  - \`${m.method}\` (${m.httpMethod} ${m.httpPath}) \`\`${m.factId}\`\``);
      }
    }
  }

  if (controllerMethodsByClass.size > 0) {
    if (lines.length > 0) lines.push("");
    lines.push(`**Controller Class(es)** (the Mongo-backed data-access layer this capability's route handlers call into)`);
    for (const className of Array.from(controllerMethodsByClass.keys()).sort()) {
      const meta = classMeta.get(className)!;
      const publicMethods = controllerMethodsByClass
        .get(className)!
        .filter(m => m.visibility === "public")
        .sort((a, b) => a.method.localeCompare(b.method));
      lines.push(`- **${className}** \`\`${meta.factId}\`\``);
      if (publicMethods.length === 0) {
        lines.push(`  - (no public controller methods evidenced for this class)`);
      } else {
        for (const m of publicMethods) {
          lines.push(`  - \`${m.method}\` \`\`${m.factId}\`\``);
        }
      }
    }
  }

  return lines.join("\n");
}
