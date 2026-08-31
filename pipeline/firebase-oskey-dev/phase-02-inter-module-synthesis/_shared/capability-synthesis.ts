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
import { resolveApiSchemas, formatResolvedApiSchemas } from "./api-schema-resolver";

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
  const resolvedApiSchemas = formatResolvedApiSchemas(resolveApiSchemas(pack.facts));
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
  variableSections.push(`## Resolved API Request/Response Schemas (deterministic join, not narrative -- use this directly)\n\n${resolvedApiSchemas}`);
  variableSections.push(
    `## Output Format (mandatory)\n\n` +
      `Produce exactly one file. Wrap it EXACTLY as follows, with no other text before, between, or after:\n\n` +
      `===FILE: ${capRelPath}===\n<full content of the capability synthesis per the output schema>\n===END FILE===\n\n` +
      `Do not include any conversational preamble, explanation, or text outside this marked block.`
  );

  const prompt = stableSections.join("\n\n---\n\n") + CACHE_BREAKPOINT_MARKER + variableSections.join("\n\n---\n\n");
  return { prompt, capRelPath };
}

/** Deterministically builds capability contract Section 3 (Public
 * Interfaces & Controllers) from `source_class` + `controller_method`/
 * `service_method` facts, replacing what used to be an open-ended LLM
 * discovery task. Added 2026-08-30, governance/roadmap/
 * v1-a-capability-synthesis-contract-scope-2026-08-30.md -- confirmed via
 * real fact checks (apps/mail, and cross-checked against the pipeline's
 * largest/most complex capabilities: supplierStaff, building_unit_
 * nonAppUser, organization_intercom_communication) that Phase 1 already
 * identifies every controller/service class and its public methods, with
 * classifyMethod()'s controller/service tag (02-build-module-evidence.ts)
 * already attached per method. Only exported classes are included --
 * unexported classes aren't "public interfaces" by definition. Only
 * `visibility: "public"` methods are listed, matching the section's own
 * intent (public entry points, not internal helpers).
 *
 * `exported_symbol` (barrel-file re-exports) and `function_declaration`
 * (deployment/wiring functions like getCallableFunctionTriggers) are
 * deliberately NOT included here -- checked directly against real data and
 * confirmed neither represents a genuine additional public-interface
 * category: exported_symbol facts just re-point at classes already listed
 * here, and the one function_declaration checked was Cloud Functions
 * registration wiring, not a business-facing interface. Revisit only if a
 * future repo/module surfaces a real counter-example. */
export function buildPublicInterfacesSection(facts: any[]): string {
  interface ClassMeta {
    file: string;
    line: number;
    factId: string;
  }
  interface MethodEntry {
    method: string;
    kind: "controller" | "service";
    visibility: string;
    factId: string;
  }

  const classMeta = new Map<string, ClassMeta>();
  for (const f of facts) {
    if (f.type === "source_class" && f.isExported && f.className) {
      classMeta.set(f.className, { file: f.file, line: f.line, factId: f.id });
    }
  }

  const methodsByClass = new Map<string, MethodEntry[]>();
  for (const f of facts) {
    if (f.type !== "controller_method" && f.type !== "service_method") continue;
    if (!f.className || !classMeta.has(f.className)) continue;
    const kind: "controller" | "service" = f.type === "controller_method" ? "controller" : "service";
    const entry: MethodEntry = {
      method: f.method ?? f.symbol ?? "(unnamed)",
      kind,
      visibility: f.evidence?.visibility ?? "public",
      factId: f.id,
    };
    const arr = methodsByClass.get(f.className) ?? [];
    arr.push(entry);
    methodsByClass.set(f.className, arr);
  }

  if (classMeta.size === 0) {
    return "(no exported controller/service classes evidenced in this capability's pack)";
  }

  const lines: string[] = [];
  const sortedClasses = Array.from(classMeta.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [className, meta] of sortedClasses) {
    const allMethods = (methodsByClass.get(className) ?? []).sort((a, b) => a.method.localeCompare(b.method));
    const publicMethods = allMethods.filter(m => m.visibility === "public");
    const kind = allMethods.length > 0 ? allMethods[0].kind : null;
    const kindLabel = kind === "controller" ? "Controller" : kind === "service" ? "Service" : "Class";
    lines.push(`- **${className}** (${kindLabel}) \`\`${meta.factId}\`\``);
    if (publicMethods.length === 0) {
      lines.push(`  - (no public controller/service methods evidenced for this class)`);
    } else {
      for (const m of publicMethods) {
        lines.push(`  - \`${m.method}\` \`\`${m.factId}\`\``);
      }
    }
  }
  return lines.join("\n");
}

/** Deterministically builds capability contract Section 4 (API Contracts &
 * Firestore Triggers) from `api_contract` + `firestore_trigger` facts, the
 * same "assembled, not synthesized" treatment as buildPublicInterfacesSection
 * above. Added 2026-08-30 as part of the module-level consolidation cutover
 * (governance/roadmap/firebase-oskey-dev/10-module-level-production-cutover-
 * plan.md, Part A Step 1) -- unlike Section 5 (Data Ownership), checked and
 * confirmed these ARE clean field-renders: an api_contract fact's
 * contractType/handlerName/handlerResolutionStatus are already-resolved,
 * literal fields, no path-construction-style interpretation needed. Reuses
 * the existing resolveApiSchemas/formatResolvedApiSchemas (api-schema-
 * resolver.ts) for the request/response schema join, which was already
 * deterministic before this change -- this just folds the surrounding
 * per-endpoint metadata listing (contract type, handler resolution status)
 * into the same deterministic pass instead of leaving it as LLM prose. */
export function buildApiContractsSection(facts: any[]): string {
  const apiContracts = facts.filter(f => f.type === "api_contract");
  const firestoreTriggers = facts.filter(f => f.type === "firestore_trigger");

  if (apiContracts.length === 0 && firestoreTriggers.length === 0) {
    return "(no api_contract or firestore_trigger facts evidenced in this capability's pack)";
  }

  const lines: string[] = [];
  if (apiContracts.length > 0) {
    lines.push(`**API Contracts**`);
    const sorted = [...apiContracts].sort((a, b) => (a.value ?? "").localeCompare(b.value ?? ""));
    for (const f of sorted) {
      lines.push(
        `- **${f.value ?? f.method ?? "(unnamed)"}** (${f.contractType ?? "unknown"}) -- handler \`${f.handlerName ?? "(unknown)"}\`, resolution: ${f.handlerResolutionStatus ?? "unknown"} \`\`${f.id}\`\``
      );
    }
    const resolved = resolveApiSchemas(facts);
    lines.push("");
    lines.push(`**Resolved API Request/Response Schemas** (deterministic join, not narrative)`);
    lines.push(formatResolvedApiSchemas(resolved));
  }

  if (firestoreTriggers.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push(`**Firestore Triggers**`);
    const sorted = [...firestoreTriggers].sort((a, b) => (a.handlerName ?? "").localeCompare(b.handlerName ?? ""));
    for (const f of sorted) {
      lines.push(
        `- Trigger handler \`${f.handlerName ?? "(unknown)"}\` -- resolution: ${f.handlerResolutionStatus ?? "unknown"} \`\`${f.id}\`\``
      );
    }
  }

  return lines.join("\n");
}

/** Deterministically builds capability contract Section 8 (External Hooks)
 * from `pubsub_publish_call`/`pubsub_topic`/`external_hook`/
 * `pubsub_event_route` facts. Added 2026-08-30, same cutover plan as
 * buildApiContractsSection above. Checked against real data: these facts'
 * fields (sourceHandler/dataType/targetCalls for event routes; the raw
 * literal value for publish calls and external hooks) are already-resolved,
 * literal -- no interpretation needed to enumerate them, only to categorize
 * WHAT a hook represents (e.g. "this is Cloud Tasks scheduling"), which is
 * intentionally left to the LLM's Responsibilities/Open-Questions sections
 * rather than attempted here -- this function's job is coverage
 * (which hooks exist, where), not classification. */
export function buildExternalHooksSection(facts: any[]): string {
  const publishCalls = facts.filter(f => f.type === "pubsub_publish_call");
  const topics = facts.filter(f => f.type === "pubsub_topic");
  const externalHooks = facts.filter(f => f.type === "external_hook");
  const eventRoutes = facts.filter(f => f.type === "pubsub_event_route");

  if (publishCalls.length === 0 && topics.length === 0 && externalHooks.length === 0 && eventRoutes.length === 0) {
    return "(no external hooks, Pub/Sub topics, or environment variables directly evidenced in this capability's pack)";
  }

  const lines: string[] = [];
  const renderGroup = (title: string, items: any[], render: (f: any) => string) => {
    if (items.length === 0) return;
    if (lines.length > 0) lines.push("");
    lines.push(`**${title}**`);
    for (const f of items) lines.push(render(f));
  };

  renderGroup("Pub/Sub Publish Calls", publishCalls, f => `- \`${f.value ?? "(unknown)"}\` (detection: ${f.detectionMethod ?? "unknown"}) \`\`${f.id}\`\``);
  renderGroup("Pub/Sub Topics", topics, f => `- \`${f.value ?? "(unknown)"}\` \`\`${f.id}\`\``);
  renderGroup("External Hooks", externalHooks, f => `- \`${f.value ?? "(unknown)"}\` (${f.file}:${f.line}) \`\`${f.id}\`\``);
  renderGroup(
    "Pub/Sub Event Routes",
    eventRoutes,
    f =>
      `- \`${f.sourceHandler ?? "(unknown)"}\` -> data type \`${f.dataType ?? "(unknown)"}\` (resolution: ${f.dataTypeResolutionStatus ?? "unknown"}), targets: ${
        Array.isArray(f.targetCalls) ? f.targetCalls.join(", ") : "(none)"
      } \`\`${f.id}\`\``
  );

  return lines.join("\n");
}
