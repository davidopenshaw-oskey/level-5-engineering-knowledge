// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Generic LLM-synthesis plumbing shared across Phase 2 call types (module-
// level profile generation, capability-level synthesis, and the eventual
// module-synthesis reduce call) -- resolving/loading grounding and contract
// docs, calling the LLM, parsing its ===FILE:===-marked response, and
// writing output. Task-specific content (framing text, which contract file
// to load, what to name the output) is deliberately NOT here -- it lives
// wherever each specific task is defined, passed in as parameters. Before
// this existed, that task-specific content was hardcoded directly inside
// 00-generate-module-profile.ts, which meant every new call type (starting
// with capability synthesis) would have needed its own near-duplicate
// script just to get different framing text and output paths. See
// governance/roadmap/00-capability-based-module-synthesis.md, Stage 6.

import fs from "fs";
import path from "path";
import { RunNotifications, addNotification } from "../../phase-01-ast-extraction/_shared/run-utils";
import { callLlm, LlmProviderConfig } from "./llm-adapter";

export function readRequiredFile(absPath: string, description: string): string {
  if (!fs.existsSync(absPath)) {
    throw new Error(`[Fail-Closed] Required ${description} not found at '${absPath}'.`);
  }
  return fs.readFileSync(absPath, "utf8");
}

/** Splits an LLM response into files using explicit markers we instruct the
 * model to emit. Fails closed (throws) if the expected markers aren't found
 * or don't cover the expected output paths, rather than silently writing a
 * malformed or partial document. The closing ===END FILE=== marker is
 * REQUIRED, not optional -- a response truncated by hitting maxTokens ends
 * mid-content with no closing marker, and matching to end-of-string as a
 * fallback (the previous behavior here) silently accepts that truncated
 * text as if it were the complete document. Confirmed empirically 2026-08-01:
 * every capability-synthesis and reduce call in the first `building` test
 * run was truncated this way and went undetected until a manual tail-check
 * of the written files. */
export function splitMarkedFiles(responseText: string, expectedPaths: string[]): Map<string, string> {
  const filePattern = /===FILE:\s*(.+?)\s*===\r?\n([\s\S]*?)\r?\n===END FILE===/g;
  const found = new Map<string, string>();
  let match: RegExpExecArray | null;
  while ((match = filePattern.exec(responseText)) !== null) {
    const filePath = match[1].trim();
    const content = match[2].trim();
    found.set(filePath, content);
  }

  const missing = expectedPaths.filter(p => !found.has(p));
  if (missing.length > 0) {
    throw new Error(
      `[LLM_OUTPUT_PARSE_FAILED] Response did not contain expected ===FILE: ...=== markers for: ${missing.join(", ")}. ` +
        `Found markers for: ${Array.from(found.keys()).join(", ") || "(none)"}.`
    );
  }

  return found;
}

export interface ContractsRootConfig {
  contractsRoot: string;
  // "clone" (default) resolves contractsRoot against the cloned TARGET
  // repo; "pipelineRoot" resolves it against THIS pipeline's own repo
  // instead. See the fuller explanation on ModuleProfileConfig in
  // 00-generate-module-profile.ts -- kept there since that's the one place
  // this concept is actually configured today.
  contractsRootBase?: "clone" | "pipelineRoot";
}

export function resolveContractsRootAbs(projectRoot: string, clonePath: string, cfg: ContractsRootConfig): string {
  return cfg.contractsRootBase === "pipelineRoot" ? path.join(projectRoot, cfg.contractsRoot) : path.join(clonePath, cfg.contractsRoot);
}

/** Loads a list of relative doc paths (grounding docs, contract docs,
 * whatever) into {relPath, content} pairs, resolved against an already-
 * resolved contracts root. Fails closed per-file via readRequiredFile. */
export function loadDocs(contractsRootAbs: string, relPaths: string[], descriptionLabel: string): Array<{ relPath: string; content: string }> {
  return relPaths.map(relPath => ({
    relPath,
    content: readRequiredFile(path.join(contractsRootAbs, relPath), `${descriptionLabel} '${relPath}'`),
  }));
}

export interface DocumentCallSpec {
  // Path the LLM is instructed to wrap its output in (===FILE: <relPath>===)
  // and the path (relative to outputDocsDir) the parsed content is written to.
  relPath: string;
  // Fully-assembled prompt text for this one call -- shared context +
  // task-specific framing + Output Format instructions, already joined.
  prompt: string;
  // Label used in notification messages and console output only (e.g.
  // "profile", "api-reference", "capability:building_door") -- not parsed,
  // purely descriptive.
  kind: string;
}

/** Runs one LLM call per spec (in parallel), parses each response's single
 * expected ===FILE:=== marker, and writes the result under outputDocsDir.
 * This is the one truly generic, reusable unit: everything about WHAT is
 * being generated (framing text, evidence, output path) is already baked
 * into each spec's `prompt` and `relPath` by the caller -- this function
 * only knows how to run a call and write a file, not what task it's for.
 * Returns the written content keyed by relPath, so a caller that needs the
 * text again immediately (e.g. feeding capability outputs into a reduce
 * call) doesn't have to re-read what was just written back off disk. */
export async function runDocumentCalls(
  specs: DocumentCallSpec[],
  llmConfig: LlmProviderConfig,
  outputDocsDir: string,
  notifications: RunNotifications,
  sourceScript: string,
  contextLabel: string
): Promise<Map<string, string>> {
  const written = new Map<string, string>();
  await Promise.all(
    specs.map(async spec => {
      addNotification(
        notifications,
        sourceScript,
        "info",
        "SYNTHESIS_LLM_CALL_STARTED",
        `Calling LLM provider '${llmConfig.provider}' (model '${llmConfig.model}') for '${contextLabel}' (${spec.kind}).`,
        { contextLabel, kind: spec.kind, provider: llmConfig.provider, model: llmConfig.model }
      );

      const result = await callLlm(spec.prompt, llmConfig);

      addNotification(
        notifications,
        sourceScript,
        "info",
        "SYNTHESIS_LLM_CALL_COMPLETED",
        `LLM call completed for '${contextLabel}' (${spec.kind}).`,
        { contextLabel, kind: spec.kind, usage: result.usage }
      );

      const files = splitMarkedFiles(result.text, [spec.relPath]);
      const content = files.get(spec.relPath)!;
      const outPath = path.join(outputDocsDir, spec.relPath);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, content, "utf8");
      console.log(`Wrote: ${outPath}`);
      written.set(spec.relPath, content);
    })
  );
  return written;
}
