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
 * Interfaces -- Components & Services) from `angular_component`/
 * `angular_injectable` facts, replacing what used to be an open-ended LLM
 * discovery task. Added per governance/roadmap/v1-a-capability-synthesis-
 * contract-scope-2026-08-30.md, ported from firebase-oskey-dev's
 * buildPublicInterfacesSection() in this same file -- but NOT a line-for-
 * line port. Firebase's version enumerates each class's public
 * controller/service *methods* underneath it; Angular's Section 3 has no
 * equivalent concept (00-capability-synthesis.md's Section 3 only asks for
 * class name, selector for components, providedIn scope for injectables --
 * confirmed against 02-build-module-evidence.ts:766-782, which attaches
 * exactly those fields via evidence.selector/evidence.providedIn and
 * nothing resembling a per-class method list), so there is nothing to
 * enumerate underneath each entry.
 *
 * Only exported classes are included -- unexported classes aren't "public
 * interfaces" by definition, same reasoning as Firebase's version. BUT
 * unlike Firebase's `source_class`-based facts, `angular_component`/
 * `angular_injectable` facts do NOT carry `isExported` themselves --
 * confirmed against real pack data (01-extract-ast-evidence.ts:782-793's
 * `rawAngularDecorators.push(...)` never includes it, unlike the
 * `rawClasses.push(...)` a few lines above at :708-714, which does). Every
 * angular_component/angular_injectable class also gets its own
 * `source_class` fact from that same earlier loop, keyed by the same
 * `className`, which DOES carry `isExported` -- so this cross-references
 * `source_class` facts by className rather than reading a field that isn't
 * there. Caught by inspecting real capability-pack JSON before the first
 * real LLM call under this contract; an unconditional `f.evidence?.
 * isExported` check would have silently emptied this section on every real
 * capability, always. */
export function buildPublicInterfacesSection(facts: any[]): string {
  interface InterfaceEntry {
    className: string;
    kind: "Component" | "Injectable";
    selector: string | null;
    providedIn: string | null;
    factId: string;
  }

  const exportedClassNames = new Set<string>();
  for (const f of facts) {
    if (f.type === "source_class" && f.isExported && f.className) exportedClassNames.add(f.className);
  }

  const entries: InterfaceEntry[] = [];
  for (const f of facts) {
    if (f.type !== "angular_component" && f.type !== "angular_injectable") continue;
    const className = f.className ?? f.value ?? "(unnamed)";
    if (!exportedClassNames.has(className)) continue;
    entries.push({
      className,
      kind: f.type === "angular_component" ? "Component" : "Injectable",
      selector: f.evidence?.selector ?? null,
      providedIn: f.evidence?.providedIn ?? null,
      factId: f.id,
    });
  }

  if (entries.length === 0) {
    return "(no exported angular_component or angular_injectable facts evidenced in this capability's pack)";
  }

  entries.sort((a, b) => a.className.localeCompare(b.className));

  const lines: string[] = [];
  for (const e of entries) {
    const detail =
      e.kind === "Component"
        ? `selector: ${e.selector ? `\`${e.selector}\`` : "(none evidenced)"}`
        : `providedIn: ${e.providedIn ? `\`${e.providedIn}\`` : "(none evidenced)"}`;
    lines.push(`- **${e.className}** (${e.kind}) -- ${detail} \`\`${e.factId}\`\``);
  }
  return lines.join("\n");
}

/** Deterministically builds Section 5 (UI Composition) from
 * `angular_template_composition`/`angular_template_binding` facts. Added
 * for the module-level (03-module-level-synthesis.md) contract,
 * governance/roadmap/angular-app-oskey-io/03-module-level-contract-design.md.
 * Unlike Outbound Coupling (see buildImportBasedCouplingSection below), this
 * section's own purpose is "what does this look like and do on screen" --
 * every composed element (native HTML, third-party UI-library, or a real
 * app component) is genuinely relevant here, so there is no "is this real
 * coupling" judgment to make; a raw per-component enumeration is exactly
 * correct, not merely a shortcut. Grouped by component (className), each
 * with its composed child elements and its input/output bindings. */
export function buildUiCompositionSection(facts: any[]): string {
  interface ComponentUi {
    className: string;
    composed: Array<{ elementTag: string; factId: string }>;
    bindings: Array<{ elementTag: string; bindingKind: string; bindingName: string; bindingValueRaw: string | null; factId: string }>;
  }

  const byClass = new Map<string, ComponentUi>();
  const getEntry = (className: string): ComponentUi => {
    let e = byClass.get(className);
    if (!e) {
      e = { className, composed: [], bindings: [] };
      byClass.set(className, e);
    }
    return e;
  };

  for (const f of facts) {
    if (f.type === "angular_template_composition") {
      const className = f.evidence?.className ?? "(unknown component)";
      getEntry(className).composed.push({ elementTag: f.evidence?.elementTag ?? "(unknown)", factId: f.id });
    } else if (f.type === "angular_template_binding") {
      const className = f.evidence?.className ?? "(unknown component)";
      getEntry(className).bindings.push({
        elementTag: f.evidence?.elementTag ?? "(unknown)",
        bindingKind: f.evidence?.bindingKind ?? "(unknown)",
        bindingName: f.evidence?.bindingName ?? "(unknown)",
        bindingValueRaw: f.evidence?.bindingValueRaw ?? null,
        factId: f.id,
      });
    }
  }

  if (byClass.size === 0) {
    return "(no angular_template_composition or angular_template_binding facts evidenced in this capability's pack)";
  }

  const lines: string[] = [];
  const sortedClasses = Array.from(byClass.values()).sort((a, b) => a.className.localeCompare(b.className));
  for (const c of sortedClasses) {
    lines.push(`- **${c.className}**`);
    if (c.composed.length === 0) {
      lines.push(`  - No child elements/components composed in its template beyond what bindings below show.`);
    } else {
      for (const el of c.composed) lines.push(`  - Composes \`${el.elementTag}\` \`\`${el.factId}\`\``);
    }
    if (c.bindings.length > 0) {
      for (const b of c.bindings) {
        const valuePart = b.bindingValueRaw ? ` = \`${b.bindingValueRaw}\`` : "";
        lines.push(`  - \`${b.elementTag}\`.${b.bindingKind}(\`${b.bindingName}\`)${valuePart} \`\`${b.factId}\`\``);
      }
    }
  }
  return lines.join("\n");
}

/** Deterministically builds the import-based half of Section 8 (Outbound
 * Coupling) from `imports_dependency` facts, filtered to genuinely OUTBOUND
 * (cross-module) targets -- an import resolving within the same module
 * isn't module-level "outbound coupling" by this section's own definition
 * ("every other module/submodule this capability depends on"). Confirmed
 * safe to make deterministic (unlike the template-composition half, which
 * stays LLM-authored -- see the contract's own explanation): `02-build-
 * module-evidence.ts` already resolves `resolvedTargetModule`/
 * `resolvedTargetSubmodule`/`importResolutionStatus` on every
 * imports_dependency fact at extraction time, the same real resolution
 * `06-build-cross-module-dependency-graph.ts` and call-edges.ts's own
 * filtering already rely on -- nothing here is a new inference. */
export function buildImportBasedCouplingSection(facts: any[], thisModuleName: string): string {
  interface CouplingEntry {
    targetModule: string;
    targetSubmodule: string | null;
    moduleSpecifier: string;
    resolutionStatus: string;
    file: string;
    line: number;
    factId: string;
  }

  const entries: CouplingEntry[] = [];
  for (const f of facts) {
    if (f.type !== "imports_dependency") continue;
    const targetModule = f.resolvedTargetModule ?? f.evidence?.resolvedTargetModule ?? null;
    if (!targetModule || targetModule === thisModuleName) continue;
    entries.push({
      targetModule,
      targetSubmodule: f.resolvedTargetSubmodule ?? f.evidence?.resolvedTargetSubmodule ?? null,
      moduleSpecifier: f.value ?? f.evidence?.moduleSpecifier ?? "(unknown)",
      resolutionStatus: f.importResolutionStatus ?? f.evidence?.importResolutionStatus ?? "unknown",
      file: f.file,
      line: f.line,
      factId: f.id,
    });
  }

  if (entries.length === 0) {
    return "(no import-based cross-module dependencies evidenced in this capability's pack -- see the LLM-authored Template-Composition Coupling content below for the other coupling mechanism)";
  }

  entries.sort((a, b) => a.targetModule.localeCompare(b.targetModule) || a.moduleSpecifier.localeCompare(b.moduleSpecifier));

  const lines: string[] = [];
  for (const e of entries) {
    const target = e.targetSubmodule ? `${e.targetModule}/${e.targetSubmodule}` : e.targetModule;
    lines.push(`- -> **${target}** via \`${e.moduleSpecifier}\` (${e.resolutionStatus}) -- \`${e.file}\` (line ${e.line}) \`\`${e.factId}\`\``);
  }
  return lines.join("\n");
}

// buildExternalHooksSection was authored here 2026-08-30 for the
// module-level contract's Section 12, then removed the same day: Angular's
// real external-hooks-adjacent fact family (external_hook/pubsub_topic/
// environment_variable/storage_path/http_or_client_path/pubsub_event_route)
// was built for backend Pub/Sub-style detection this frontend app has zero
// real instances of (confirmed against the real cloned source), while the
// case the section is actually for -- real external SDK usage, e.g.
// @angular/fire/@ngx-translate, confirmed present in 79 real files -- isn't
// classified into any fact type a deterministic builder could read. A
// version restricted to that fact family would have been silently,
// permanently empty for every real module -- worse than the LLM-authored
// version it would have replaced, not just incomplete. Section 12 stays
// LLM-authored in contracts/03-module-level-synthesis.md; see that
// contract's "What you do NOT write" section for the full reasoning.
