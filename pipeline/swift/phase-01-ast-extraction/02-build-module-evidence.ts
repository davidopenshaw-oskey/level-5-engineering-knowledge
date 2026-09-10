// **version:** 1.0.0
// **location:** level-5 phase 1 -- Swift
// © Oskey SAS. All rights reserved.
//
// Script 02: Module Evidence Builder (Phase 1) -- Swift.
// Real, ported structure from the TS/Kotlin pipelines' own 02-build-module-
// evidence.ts (fail-closed manifest validation, stableFactId assignment,
// per-module fact/evidence-graph/manifest output). Real, deliberate
// differences from Kotlin's copy, not a blind port: Swift's fact vocabulary
// is genuinely different (structs/protocols/extensions have no Kotlin
// analog; no objects/sealedHierarchies/usbWireConstants/
// webrtcSignalingTouchpoints exist for this family) -- matches
// 01-extract-ast-evidence.ts's own real evidenceType list exactly, per
// governance/roadmap/ios-oskey-dev/10-p1-build-tasklist-2026-09-10.md's
// Task 9. SHARED ACROSS EVERY SWIFT REPO, not forked per repo, same as
// 00/01 -- see 01-extract-ast-evidence.ts's own header for the full
// restructuring reasoning.

import fs from "fs";
import path from "path";
import {
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  loadNotifications,
  runContextPath,
} from "./_shared/run-utils";

const projectRoot = process.cwd();
const SOURCE_SCRIPT = "02-build-module-evidence";

// Real, deliberate scope limit vs. the TS/Kotlin pipelines' own version:
// `line` is EXCLUDED from fact identity for the same reason recorded in
// every other repo's own copy of this comment -- a line-shifting edit
// elsewhere in the file must not change a fact's own ID. `occurrenceOrdinal`
// is the real stability mechanism for fact types whose (type, file,
// primaryKey, secondaryKey) isn't provably unique on its own.
function stableFactId(input: {
  type: string;
  module: string;
  file: string;
  primaryKey: string;
  secondaryKey?: string | null;
  occurrenceOrdinal?: number;
}): string {
  const cleanPath = (input.file || "").replace(/\\/g, "/");
  const sec = input.secondaryKey ? `|${input.secondaryKey}` : "";
  const ord = input.occurrenceOrdinal !== undefined ? `|#${input.occurrenceOrdinal}` : "";
  return `${input.type}|${input.module}|${cleanPath}|${input.primaryKey}${sec}${ord}`;
}

function nextOccurrenceOrdinal(counterMap: Map<string, number>, type: string, file: string, primaryKey: string, secondaryKey?: string | null): number {
  const key = `${type}|${file}|${primaryKey}|${secondaryKey ?? ""}`;
  const next = (counterMap.get(key) ?? 0) + 1;
  counterMap.set(key, next);
  return next;
}

// Real Swift fact kinds this script actually knows how to type -- matches
// 01-extract-ast-evidence.ts's own real evidenceType list (which the
// manifest below validates against) exactly. `errors` is deliberately
// excluded -- required: false in that same manifest, same as Kotlin's own
// script never turns its own error records into a canonical, indexed fact
// type either.
const EXPECTED_EVIDENCE_TYPES = [
  "imports",
  "classes",
  "structs",
  "enums",
  "protocols",
  "extensions",
  "functions",
  "properties",
  "calls",
  "bleGattConstants",
];

function main() {
  const REPO_NAME = process.env.REPO_NAME;
  if (!REPO_NAME) {
    throw new Error("[Fail-Closed] REPO_NAME environment variable is required and was not set.");
  }

  const runCtxPath = runContextPath(projectRoot, REPO_NAME);
  if (!fs.existsSync(runCtxPath)) {
    throw new Error(`[Fail-Closed] Could not find output/${REPO_NAME}/run-context.json. Please run \`00-scan-repo\` first.`);
  }

  const runContext = JSON.parse(fs.readFileSync(runCtxPath, "utf8"));
  const runId: string = runContext.runId;
  if (runContext.repoName !== REPO_NAME || !runId) {
    throw new Error(`[Fail-Closed] Missing or mismatched repoName/runId in output/${REPO_NAME}/run-context.json`);
  }

  const repoOutputDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
  const notificationsPath = path.join(repoOutputDir, "run-notifications.json");
  const notifications = loadNotifications(notificationsPath, runId, REPO_NAME);

  const rawDir = path.join(repoOutputDir, "facts");
  const manifestPath = path.join(rawDir, "ast-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_AST_MANIFEST_FATAL", `Missing required ast-manifest.json at '${manifestPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required ast-manifest.json at '${manifestPath}'.`);
  }

  let astManifest: any;
  try {
    astManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err: any) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MALFORMED_AST_MANIFEST_FATAL", `Malformed ast-manifest.json: ${err.message}`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Malformed ast-manifest.json: ${err.message}`);
  }

  // 1. Validate AST manifest structure & identity. Real, deliberate
  // difference from Kotlin's own copy: Kotlin's manifest carries a separate
  // top-level `errors: {file, recordCount}` summary object; Swift's own
  // 01-extract-ast-evidence.ts represents errors as just another artefact
  // entry (required: false) -- checked directly against the real manifest
  // this pipeline actually writes, not copied blindly from Kotlin's shape.
  if (
    typeof astManifest.schemaVersion !== "string" ||
    astManifest.runId !== runId ||
    astManifest.repoName !== REPO_NAME ||
    !Array.isArray(astManifest.artefacts) ||
    astManifest.artefacts.length === 0
  ) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MALFORMED_AST_MANIFEST_FATAL", `AST manifest structure or identity validation failed.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] AST manifest structure or identity validation failed.`);
  }

  // 2. Validate expected evidence types, each exactly once, record counts match
  const manifestTypeMap = new Map<string, any>();
  for (const art of astManifest.artefacts) {
    if (!art.evidenceType || typeof art.evidenceType !== "string") {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MALFORMED_AST_MANIFEST_FATAL", `Manifest artifact entry missing 'evidenceType'.`);
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Manifest artifact entry missing 'evidenceType'.`);
    }
    if (manifestTypeMap.has(art.evidenceType)) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "DUPLICATE_EVIDENCE_TYPE_FATAL", `Duplicate evidenceType '${art.evidenceType}' in ast-manifest.json.`, { evidenceType: art.evidenceType });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[DUPLICATE_EVIDENCE_TYPE_FATAL] Duplicate evidenceType '${art.evidenceType}'.`);
    }
    manifestTypeMap.set(art.evidenceType, art);
  }

  for (const expType of EXPECTED_EVIDENCE_TYPES) {
    if (!manifestTypeMap.has(expType)) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_EVIDENCE_TYPE_FATAL", `Expected evidenceType '${expType}' missing from ast-manifest.json.`, { missingEvidenceType: expType });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[MISSING_EVIDENCE_TYPE_FATAL] Expected evidenceType '${expType}' missing.`);
    }
    const art = manifestTypeMap.get(expType);
    const artPath = path.join(rawDir, art.file);
    if (!fs.existsSync(artPath)) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_EVIDENCE_FILE_FATAL", `Required AST evidence file '${art.file}' missing at '${artPath}'.`);
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Required AST evidence file '${art.file}' missing.`);
    }
    let arr: any[];
    try {
      arr = JSON.parse(fs.readFileSync(artPath, "utf8"));
    } catch (err: any) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MALFORMED_EVIDENCE_FILE_FATAL", `Malformed JSON in AST evidence file '${art.file}': ${err.message}`);
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] Malformed JSON in AST evidence file '${art.file}'.`);
    }
    if (!Array.isArray(arr)) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "INVALID_EVIDENCE_ARRAY_FATAL", `AST evidence file '${art.file}' must contain a JSON array.`);
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[Fail-Closed] AST evidence file '${art.file}' is not a JSON array.`);
    }
    if (arr.length !== art.recordCount) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "RECORD_COUNT_MISMATCH_FATAL", `Record count mismatch in '${art.file}': manifest claims ${art.recordCount}, actual is ${arr.length}.`, { file: art.file, manifestCount: art.recordCount, actualCount: arr.length });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[RECORD_COUNT_MISMATCH_FATAL] Record count mismatch in '${art.file}'.`);
    }
  }

  const modulesJsonPath = path.join(rawDir, "modules.json");
  if (!fs.existsSync(modulesJsonPath)) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_MODULES_JSON_FATAL", `Missing required modules.json at '${modulesJsonPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required modules.json.`);
  }
  const modulesList: Array<{ module: string }> = JSON.parse(fs.readFileSync(modulesJsonPath, "utf8"));
  const authoritativeModules = modulesList.map(m => m.module).sort();

  console.log(`Creating module evidence and evidence graphs for ${authoritativeModules.length} authoritative modules`);

  const loadFactFile = (filename: string): any[] => {
    const filePath = path.join(rawDir, filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  };

  const filesFact = loadFactFile("files.json");
  const importsDependencyFact = loadFactFile("ast-imports.json");
  const classesFact = loadFactFile("ast-classes.json");
  const structsFact = loadFactFile("ast-structs.json");
  const enumsFact = loadFactFile("ast-enums.json");
  const protocolsFact = loadFactFile("ast-protocols.json");
  const extensionsFact = loadFactFile("ast-extensions.json");
  const functionsFact = loadFactFile("ast-functions.json");
  const propertiesFact = loadFactFile("ast-properties.json");
  const callsFact = loadFactFile("ast-calls.json");
  const bleGattFact = loadFactFile("ast-ble-gatt-constants.json");

  const modulesBaseDir = path.join(repoOutputDir, "knowledge-pipeline", "modules");
  fs.mkdirSync(modulesBaseDir, { recursive: true });

  for (const moduleName of authoritativeModules) {
    const modDir = path.join(modulesBaseDir, moduleName);
    fs.mkdirSync(modDir, { recursive: true });

    const rawModuleFacts: any[] = [];
    const occurrenceCounters = new Map<string, number>();

    // 1. source_file
    for (const item of filesFact.filter((f: any) => f.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "source_file", module: moduleName, file: item.path, primaryKey: item.path }),
        runId,
        type: "source_file",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.path,
        line: 1,
        value: item.path,
        evidence: { sizeBytes: item.sizeBytes, kindHint: item.kindHint },
      });
    }

    // 2-6. class_declaration / struct_declaration / enum_declaration /
    // protocol_declaration / extension_declaration -- all five share the
    // same real shape (name/visibility/extendsTypes/parentType), Swift's
    // inheritance clause being a real LIST (not Kotlin/TS's single
    // extendsClass string) is preserved as extendsTypes, matching
    // sync-facts.ts's own Task 8 enrichment exactly (it reads this same
    // field name). `cases` (enums only, real raw-value/associated-value
    // data, Task 8's own real find) promoted to top level too, not left
    // buried in `evidence` alone -- sync-facts.ts's swiftEnumCases reader
    // checks the top-level field first.
    const emitTypeDecl = (items: any[], type: string) => {
      for (const item of items.filter((i: any) => i.module === moduleName)) {
        rawModuleFacts.push({
          id: stableFactId({
            type,
            module: moduleName,
            file: item.file,
            primaryKey: item.name,
            occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, type, item.file, item.name),
          }),
          runId,
          type,
          repo: REPO_NAME,
          module: moduleName,
          submodule: item.submodule,
          file: item.file,
          line: item.line,
          value: item.name,
          name: item.name,
          visibility: item.visibility,
          extendsTypes: item.extendsTypes,
          parentType: item.parentType,
          ...(item.cases && item.cases.length > 0 ? { cases: item.cases } : {}),
          evidence: { ...item },
        });
      }
    };
    emitTypeDecl(classesFact, "class_declaration");
    emitTypeDecl(structsFact, "struct_declaration");
    emitTypeDecl(enumsFact, "enum_declaration");
    emitTypeDecl(protocolsFact, "protocol_declaration");
    emitTypeDecl(extensionsFact, "extension_declaration");

    // 7. function_declaration -- secondaryKey is parentType (Swift's real
    // analog of Kotlin's owningClass: null for a real top-level function,
    // which is its own valid disambiguator). Ordinal on top for real Swift
    // overloads (same name, same parentType, different parameter list) --
    // not yet captured as a distinguishing field (parameters aren't
    // extracted, a known, honest gap -- see 01's own header), so overloads
    // collide into successive ordinals rather than being told apart by
    // signature. Real, accepted limitation, not silently hidden.
    for (const item of functionsFact.filter((f: any) => f.module === moduleName)) {
      const secondaryKey = item.parentType ?? null;
      rawModuleFacts.push({
        id: stableFactId({
          type: "function_declaration",
          module: moduleName,
          file: item.file,
          primaryKey: item.name,
          secondaryKey,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "function_declaration", item.file, item.name, secondaryKey),
        }),
        runId,
        type: "function_declaration",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.parentType ? `${item.parentType}.${item.name}` : item.name,
        name: item.name,
        owningClass: item.parentType,
        isStatic: item.isStatic,
        visibility: item.visibility,
        evidence: { ...item },
      });
    }

    // 8. model_property -- secondaryKey is parentType (null for a genuine
    // top-level property). owningClass promoted to top level for the same
    // reason Kotlin's own copy does -- Task 7/8's own enrichment reads it
    // from there.
    for (const item of propertiesFact.filter((p: any) => p.module === moduleName)) {
      const secondaryKey = item.parentType ?? null;
      rawModuleFacts.push({
        id: stableFactId({
          type: "model_property",
          module: moduleName,
          file: item.file,
          primaryKey: item.name,
          secondaryKey,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "model_property", item.file, item.name, secondaryKey),
        }),
        runId,
        type: "model_property",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.parentType ? `${item.parentType}.${item.name}` : item.name,
        propertyName: item.name,
        parentName: item.parentType ?? null,
        owningClass: item.parentType ?? null,
        isStatic: item.isStatic,
        isLet: item.isLet,
        visibility: item.visibility,
        evidence: { ...item },
      });
    }

    // 9. call_expression -- secondaryKey combines caller context + callee
    // text, same shape as Kotlin's own copy (callerFunction is Swift's
    // field name for what Kotlin calls callerName -- aliased here, not
    // renamed at the source, since callerFunction is the more accurate name
    // for Swift where the caller could just as easily be a computed
    // property's accessor as a real func). resolutionMethod/declarationFile
    // survive unchanged, including the real "self_reference" tag Swift's
    // own resolver uses that Kotlin's never needed.
    for (const item of callsFact.filter((c: any) => c.module === moduleName)) {
      const secondaryKey = `${item.callerFunction || "anon"}|${item.callerClass || "none"}`;
      rawModuleFacts.push({
        id: stableFactId({
          type: "call_expression",
          module: moduleName,
          file: item.file,
          primaryKey: item.calleeExpression,
          secondaryKey,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "call_expression", item.file, item.calleeExpression, secondaryKey),
        }),
        runId,
        type: "call_expression",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.calleeExpression,
        callerName: item.callerFunction,
        callerClass: item.callerClass,
        calleeExpression: item.calleeExpression,
        ...(item.arguments ? { arguments: item.arguments } : {}),
        declarationFile: item.declarationFile,
        declarationModule: item.declarationModule,
        resolutionMethod: item.resolutionMethod,
        evidence: { ...item },
      });
    }

    // 10. imports_dependency -- real, honest limitation, not silently
    // hidden: unlike Kotlin/TS's own copy, Swift's imports carry no
    // resolvedTargetModule/resolvedTargetSubmodule/importResolutionStatus
    // yet -- 01-extract-ast-evidence.ts never attempted per-import
    // cross-target resolution (Swift's `import ModuleName` is whole-module,
    // not per-symbol, and resolving which OSkey package a given import
    // name refers to needs the same cross-repo declaration data
    // resolved_via_import itself is still waiting on -- see that file's own
    // header comment). Fields left present but null so 06's own cross-
    // module-dependency-graph port (whenever cross-repo resolution lands)
    // has somewhere real to write into, not a schema it has to invent then.
    for (const item of importsDependencyFact.filter((i: any) => i.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "imports_dependency",
          module: moduleName,
          file: item.file,
          primaryKey: item.value,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "imports_dependency", item.file, item.value),
        }),
        runId,
        type: "imports_dependency",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.value,
        resolvedTargetModule: null,
        resolvedTargetSubmodule: null,
        importResolutionStatus: "not_yet_implemented",
        evidence: { ...item },
      });
    }

    // 11. ble_gatt_constant -- Task 6's real wire-format fact, no TS analog,
    // same shape Kotlin's own ble_gatt_constant already uses (deliberately
    // mirrored back in Task 6's own design).
    for (const item of bleGattFact.filter((b: any) => b.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "ble_gatt_constant", module: moduleName, file: item.file, primaryKey: item.name }),
        runId,
        type: "ble_gatt_constant",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.name,
        name: item.name,
        uuidValue: item.uuidValue,
        kind: item.kind,
        evidence: { ...item },
      });
    }

    // Property-based fact deduplication & conflicting-identity guard --
    // same discipline as every other repo's own copy: an identical
    // duplicate is silently merged (logged), a materially different fact
    // sharing an ID is a real bug and fails closed immediately.
    const factMap = new Map<string, { fact: any; jsonStr: string }>();
    let deduplicatedCount = 0;

    for (const rawFact of rawModuleFacts) {
      const id = rawFact.id;
      const jsonStr = JSON.stringify(rawFact);
      if (factMap.has(id)) {
        const existing = factMap.get(id)!;
        if (existing.jsonStr === jsonStr) {
          deduplicatedCount += 1;
        } else {
          addNotification(notifications, SOURCE_SCRIPT, "fatal", "DUPLICATE_FACT_IDENTITY_FATAL", `Materially different facts produced identical ID '${id}' in module '${moduleName}'.`, { module: moduleName, factId: id });
          writeNotificationsAtomically(notificationsPath, notifications);
          throw new Error(`[DUPLICATE_FACT_IDENTITY_FATAL] Conflicting facts for ID '${id}' in module '${moduleName}'.`);
        }
      } else {
        factMap.set(id, { fact: rawFact, jsonStr });
      }
    }

    if (deduplicatedCount > 0) {
      addNotification(notifications, SOURCE_SCRIPT, "warning", "FACT_DEDUPLICATED_WARNING", `Deduplicated ${deduplicatedCount} identical fact(s) in module '${moduleName}'.`, { module: moduleName, count: deduplicatedCount });
    }

    const facts = Array.from(factMap.values()).map(e => e.fact);
    facts.sort((a, b) => a.id.localeCompare(b.id));

    const moduleFiles = Array.from(new Set(facts.map(f => f.file))).sort();
    const summaryCounts = {
      files: moduleFiles.length,
      imports: facts.filter(f => f.type === "imports_dependency").length,
      classes: facts.filter(f => f.type === "class_declaration").length,
      structs: facts.filter(f => f.type === "struct_declaration").length,
      enums: facts.filter(f => f.type === "enum_declaration").length,
      protocols: facts.filter(f => f.type === "protocol_declaration").length,
      extensions: facts.filter(f => f.type === "extension_declaration").length,
      functions: facts.filter(f => f.type === "function_declaration").length,
      properties: facts.filter(f => f.type === "model_property").length,
      calls: facts.filter(f => f.type === "call_expression").length,
      bleGattConstants: facts.filter(f => f.type === "ble_gatt_constant").length,
      facts: facts.length,
    };

    const graphPayload = {
      schemaVersion: "1.0.0",
      runId,
      repoName: REPO_NAME,
      module: moduleName,
      generatedAt: new Date().toISOString(),
      summary: { totalFacts: facts.length, ...summaryCounts },
      facts,
    };

    const nowIso = new Date().toISOString();
    const manifestPayload = {
      schemaVersion: "1.0.0",
      runId,
      repoName: REPO_NAME,
      module: moduleName,
      generatedAt: nowIso,
      updatedAt: nowIso,
      artefacts: [
        { file: `${moduleName}-facts.json`, recordCount: facts.length },
        { file: `${moduleName}-evidence-graph.json`, documentCount: 1, factCount: facts.length },
      ],
      summary: summaryCounts,
    };

    writeJsonAtomically(path.join(modDir, `${moduleName}-facts.json`), facts, `${moduleName}-facts.json`);
    writeJsonAtomically(path.join(modDir, `${moduleName}-evidence-graph.json`), graphPayload, `${moduleName}-evidence-graph.json`);
    writeJsonAtomically(path.join(modDir, `${moduleName}-manifest.json`), manifestPayload, `${moduleName}-manifest.json`);

    console.log(`${moduleName}:`, summaryCounts);
  }

  addNotification(notifications, SOURCE_SCRIPT, "info", "MODULE_EVIDENCE_COMPLETED", "Module evidence synthesis completed successfully.");
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log("Complete");
  console.log("Wrote output/runs/.../knowledge-pipeline/modules/*");
}

main();
