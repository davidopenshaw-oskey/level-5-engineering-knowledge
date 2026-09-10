// **version:** 1.0.0
// **location:** level-5 phase 1 -- Kotlin/Android port
// © Oskey SAS. All rights reserved.
//
// Script 02: Module Evidence Builder (Phase 1) -- Kotlin/Android port.
// Real, ported structure from the TS pipelines' own 02-build-module-
// evidence.ts (fail-closed manifest validation, stableFactId assignment,
// per-module fact/evidence-graph/manifest output) -- see governance/roadmap/
// android-intercom-oskey-io/02-p1-build-tasklist.md Task 8 for why this is a
// real re-design, not a blind copy: this repo has no Mongo/routes/Joi/PubSub
// evidence at all, and adds real Kotlin/Android-specific fact kinds
// (kotlin_object, source_interface, kotlin_sealed_hierarchy, ble_gatt_
// constant, usb_wire_constant, webrtc_signaling_touchpoint) that TS's own
// script has no equivalent for. Fact-type naming and enrichment fields
// match governance/roadmap/android-intercom-oskey-io/14-task7-description-
// enrichment-built-and-verified-2026-09-09.md exactly -- that task designed
// these names and fields specifically so this script would have a concrete,
// pre-verified spec to build against.

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

// Real, deliberate scope limit vs. the TS pipeline's own version: `line` is
// EXCLUDED from fact identity for the exact reason recorded in every TS
// repo's own copy of this comment (governance/roadmap/03-token-economics-
// remediation-plan.md Stage 1) -- a line-shifting edit elsewhere in the file
// must not change a fact's own ID. `occurrenceOrdinal` is the real
// stability mechanism for fact types whose (type, file, primaryKey,
// secondaryKey) isn't provably unique on its own.
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

// Real Kotlin/Android fact kinds this script actually knows how to type --
// matches 01-extract-ast-evidence.ts's own real evidenceType list (which
// the manifest below validates against) exactly. No methods/exports/
// typeAliases/mongoOperations/routeDefinitions/joiSchemaFields/
// pubsubOperationRoutes here -- none of those exist for this repo, see this
// file's own header comment.
const EXPECTED_EVIDENCE_TYPES = [
  "imports",
  "classes",
  "objects",
  "interfaces",
  "functions",
  "enums",
  "sealedHierarchies",
  "properties",
  "calls",
  "webrtcSignalingTouchpoints",
  "bleGattConstants",
  "usbWireConstants",
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
  const manifestPath = path.join(rawDir, "ast-evidence-manifest.json");

  if (!fs.existsSync(manifestPath)) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_AST_MANIFEST_FATAL", `Missing required ast-evidence-manifest.json at '${manifestPath}'.`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Missing required ast-evidence-manifest.json at '${manifestPath}'.`);
  }

  let astManifest: any;
  try {
    astManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err: any) {
    addNotification(notifications, SOURCE_SCRIPT, "fatal", "MALFORMED_AST_MANIFEST_FATAL", `Malformed ast-evidence-manifest.json: ${err.message}`);
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(`[Fail-Closed] Malformed ast-evidence-manifest.json: ${err.message}`);
  }

  // 1. Validate AST manifest structure & identity
  if (
    typeof astManifest.schemaVersion !== "string" ||
    astManifest.runId !== runId ||
    astManifest.repoName !== REPO_NAME ||
    !Array.isArray(astManifest.artefacts) ||
    astManifest.artefacts.length === 0 ||
    typeof astManifest.errors !== "object" ||
    typeof astManifest.errors?.file !== "string" ||
    !Number.isFinite(astManifest.errors?.recordCount)
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
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "DUPLICATE_EVIDENCE_TYPE_FATAL", `Duplicate evidenceType '${art.evidenceType}' in ast-evidence-manifest.json.`, { evidenceType: art.evidenceType });
      writeNotificationsAtomically(notificationsPath, notifications);
      throw new Error(`[DUPLICATE_EVIDENCE_TYPE_FATAL] Duplicate evidenceType '${art.evidenceType}'.`);
    }
    manifestTypeMap.set(art.evidenceType, art);
  }

  for (const expType of EXPECTED_EVIDENCE_TYPES) {
    if (!manifestTypeMap.has(expType)) {
      addNotification(notifications, SOURCE_SCRIPT, "fatal", "MISSING_EVIDENCE_TYPE_FATAL", `Expected evidenceType '${expType}' missing from ast-evidence-manifest.json.`, { missingEvidenceType: expType });
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
  const importsFact = loadFactFile("ast-imports.json");
  const classesFact = loadFactFile("ast-classes.json");
  const objectsFact = loadFactFile("ast-objects.json");
  const interfacesFact = loadFactFile("ast-interfaces.json");
  const functionsFact = loadFactFile("ast-functions.json");
  const enumsFact = loadFactFile("ast-enums.json");
  const sealedHierarchiesFact = loadFactFile("ast-sealed-hierarchies.json");
  const propertiesFact = loadFactFile("ast-properties.json");
  const callsFact = loadFactFile("ast-calls.json");
  const webrtcTouchpointsFact = loadFactFile("ast-webrtc-signaling-touchpoints.json");
  const bleGattFact = loadFactFile("ast-ble-gatt-constants.json");
  const usbWireFact = loadFactFile("ast-usb-wire-constants.json");

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

    // 2. source_class -- real risk (not yet observed, added defensively):
    // nested classes mean two DIFFERENT outer classes in the same file
    // could each declare an inner class with the same simple name. An
    // ordinal costs nothing and removes any doubt, same reasoning the TS
    // pipeline's own model_property ordinal used.
    for (const item of classesFact.filter((c: any) => c.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "source_class",
          module: moduleName,
          file: item.file,
          primaryKey: item.name,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "source_class", item.file, item.name),
        }),
        runId,
        type: "source_class",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.name,
        className: item.name,
        extendsClass: item.extendsClass,
        extendsClassTypeArguments: item.extendsTypeArguments,
        isSealed: item.isSealed,
        isData: item.isData,
        isAbstract: item.isAbstract,
        visibility: item.visibility,
        evidence: { ...item },
      });
    }

    // 3. kotlin_object -- Kotlin's own construct, no TS analog.
    for (const item of objectsFact.filter((o: any) => o.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "kotlin_object",
          module: moduleName,
          file: item.file,
          primaryKey: item.name,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "kotlin_object", item.file, item.name),
        }),
        runId,
        type: "kotlin_object",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.name,
        className: item.name,
        extendsClass: item.extendsClass,
        extendsClassTypeArguments: item.extendsTypeArguments,
        evidence: { ...item },
      });
    }

    // 4. source_interface
    for (const item of interfacesFact.filter((i: any) => i.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "source_interface",
          module: moduleName,
          file: item.file,
          primaryKey: item.name,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "source_interface", item.file, item.name),
        }),
        runId,
        type: "source_interface",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.name,
        className: item.name,
        extendsClass: item.extendsClass,
        extendsClassTypeArguments: item.extendsTypeArguments,
        visibility: item.visibility,
        evidence: { ...item },
      });
    }

    // 5. function_declaration -- secondaryKey is owningClass (null for a
    // real top-level function, which is its own valid disambiguator since
    // Kotlin permits at most one top-level function of a given name per
    // file). Ordinal on top, for real Kotlin overloads (same name, same
    // owningClass, different parameter list) -- a real, common pattern
    // this repo's own Hilt-injected constructors and Compose preview
    // overloads both produce.
    for (const item of functionsFact.filter((f: any) => f.module === moduleName)) {
      const secondaryKey = item.owningClass ?? null;
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
        value: item.owningClass ? `${item.owningClass}.${item.name}` : item.name,
        name: item.name,
        owningClass: item.owningClass,
        isComposable: item.isComposable,
        isSuspend: item.isSuspend,
        parameters: item.parameters,
        returnType: item.returnType,
        evidence: { ...item },
      });
    }

    // 6. enum_declaration
    for (const item of enumsFact.filter((e: any) => e.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "enum_declaration",
          module: moduleName,
          file: item.file,
          primaryKey: item.name,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "enum_declaration", item.file, item.name),
        }),
        runId,
        type: "enum_declaration",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.name,
        name: item.name,
        members: item.members,
        evidence: { ...item },
      });
    }

    // 7. kotlin_sealed_hierarchy -- no TS analog.
    for (const item of sealedHierarchiesFact.filter((s: any) => s.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({
          type: "kotlin_sealed_hierarchy",
          module: moduleName,
          file: item.file,
          primaryKey: item.name,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "kotlin_sealed_hierarchy", item.file, item.name),
        }),
        runId,
        type: "kotlin_sealed_hierarchy",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.name,
        name: item.name,
        subclasses: item.subclasses,
        evidence: { ...item },
      });
    }

    // 8. model_property -- secondaryKey is owningClass (null for a genuine
    // top-level property). isConstructorPromoted/owningClass both survive
    // onto the top-level fact -- Task 7's own enrichment already reads
    // them from there.
    for (const item of propertiesFact.filter((p: any) => p.module === moduleName)) {
      const secondaryKey = item.owningClass ?? null;
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
        value: item.owningClass ? `${item.owningClass}.${item.name}` : item.name,
        propertyName: item.name,
        parentName: item.owningClass ?? null,
        owningClass: item.owningClass ?? null,
        isConstructorPromoted: item.isConstructorPromoted ?? false,
        declaredType: item.declaredType,
        evidence: { ...item },
      });
    }

    // 9. call_expression -- secondaryKey combines caller context + callee
    // text (mirrors TS's own callerName|argSig shape; unlike TS, argument
    // text is NOT folded into the secondaryKey here -- occurrenceOrdinal
    // already disambiguates repeated same-caller/same-callee call sites in
    // file order, and changing an argument shouldn't change a fact's own
    // stable ID). Real, honestly-tagged resolutionMethod/declarationFile
    // survive unchanged -- see 01-extract-ast-evidence.ts's own header
    // comment for why "confirmed" is never used here. `arguments` (real gap
    // found and fixed 2026-09-09, see 17-model-property-description-gaps-
    // homeButtons-2026-09-09.md) survives as a plain data field.
    for (const item of callsFact.filter((c: any) => c.module === moduleName)) {
      const secondaryKey = `${item.callerName || "anon"}|${item.callerClass || "none"}`;
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
        callerName: item.callerName,
        callerClass: item.callerClass,
        calleeExpression: item.calleeExpression,
        ...(item.arguments ? { arguments: item.arguments } : {}),
        declarationFile: item.declarationFile,
        declarationModule: item.declarationModule,
        resolutionMethod: item.resolutionMethod,
        evidence: { ...item },
      });
    }

    // 10. imports_dependency -- resolvedTargetModule/resolvedTargetSubmodule
    // promoted to top-level (not just nested in evidence), same reasoning
    // as the TS pipeline's own copy of this comment: 06/07's own cross-
    // module/intra-module graph builders read these directly, and any
    // future factsToCompactTable-equivalent for this repo would drop the
    // evidence blob before it reaches an LLM prompt.
    for (const item of importsFact.filter((i: any) => i.module === moduleName)) {
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
        resolvedTargetModule: item.resolvedTargetModule,
        resolvedTargetSubmodule: item.resolvedTargetSubmodule,
        importResolutionStatus: item.importResolutionStatus,
        evidence: { ...item },
      });
    }

    // 11. ble_gatt_constant / usb_wire_constant / webrtc_signaling_touchpoint
    // -- Task 5's real wire-format facts, no TS analog.
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

    for (const item of usbWireFact.filter((u: any) => u.module === moduleName)) {
      rawModuleFacts.push({
        id: stableFactId({ type: "usb_wire_constant", module: moduleName, file: item.file, primaryKey: item.name }),
        runId,
        type: "usb_wire_constant",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.name,
        name: item.name,
        hexValue: item.hexValue,
        comment: item.comment,
        evidence: { ...item },
      });
    }

    for (const item of webrtcTouchpointsFact.filter((w: any) => w.module === moduleName)) {
      const secondaryKey = `${item.direction}|${item.callerName || "anon"}`;
      rawModuleFacts.push({
        id: stableFactId({
          type: "webrtc_signaling_touchpoint",
          module: moduleName,
          file: item.file,
          primaryKey: item.eventExpression ?? "unknown_event",
          secondaryKey,
          occurrenceOrdinal: nextOccurrenceOrdinal(occurrenceCounters, "webrtc_signaling_touchpoint", item.file, item.eventExpression ?? "unknown_event", secondaryKey),
        }),
        runId,
        type: "webrtc_signaling_touchpoint",
        repo: REPO_NAME,
        module: moduleName,
        submodule: item.submodule,
        file: item.file,
        line: item.line,
        value: item.eventExpression,
        direction: item.direction,
        eventExpression: item.eventExpression,
        callerClass: item.callerClass,
        evidence: { ...item },
      });
    }

    // Property-based fact deduplication & conflicting-identity guard --
    // same discipline as the TS pipeline's own copy: an identical
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
      classes: facts.filter(f => f.type === "source_class").length,
      objects: facts.filter(f => f.type === "kotlin_object").length,
      interfaces: facts.filter(f => f.type === "source_interface").length,
      functions: facts.filter(f => f.type === "function_declaration").length,
      composableFunctions: facts.filter(f => f.type === "function_declaration" && f.isComposable).length,
      enums: facts.filter(f => f.type === "enum_declaration").length,
      sealedHierarchies: facts.filter(f => f.type === "kotlin_sealed_hierarchy").length,
      properties: facts.filter(f => f.type === "model_property").length,
      calls: facts.filter(f => f.type === "call_expression").length,
      bleGattConstants: facts.filter(f => f.type === "ble_gatt_constant").length,
      usbWireConstants: facts.filter(f => f.type === "usb_wire_constant").length,
      webrtcSignalingTouchpoints: facts.filter(f => f.type === "webrtc_signaling_touchpoint").length,
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
