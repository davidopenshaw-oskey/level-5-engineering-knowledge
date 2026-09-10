// **version:** 1.0.0
// **location:** level-5 phase 1
// © Oskey SAS. All rights reserved.
//
// Script 01: AST Evidence Extractor (Phase 1) -- Swift.
// Walks every real .swift file (under `modulesRoot`) and emits raw AST
// facts: classes, structs, enums, protocols, extensions, functions,
// properties, imports, and call expressions (with real, tagged-confidence
// resolution).
//
// SHARED ACROSS EVERY SWIFT REPO in the ios-oskey-dev family, not forked
// per repo -- restructured 2026-09-10, see 00-scan-repo.ts's own header for
// the full reasoning (governance/roadmap/ios-oskey-dev/12-pipeline-
// restructure-shared-swift-scripts-2026-09-10.md).
//
// Real, load-bearing differences from the TS/Kotlin repos' own copies of
// this script, per governance/roadmap/ios-oskey-dev/08-...md and
// 09-task1-decision-swiftsyntax-2026-09-09.md:
//
// - The actual PARSE happens in a separate compiled Swift subprocess
//   (./swift-extractor/.build/release/swift-extractor), invoked here via
//   child_process -- SwiftSyntax, unlike ts-morph/tree-sitter-kotlin, is not
//   an npm-consumable library. This script reads that subprocess's raw
//   per-file JSON facts and does everything else (cross-file resolution,
//   fact-file writing, error-tolerance gating) in TypeScript, matching every
//   other repo's pipeline shape as closely as the toolchain split allows.
// - Call resolution has THREE tiers, not Kotlin's two, because Swift's
//   visibility model is target-based, not package-based: resolved_via_import
//   (cross-target -- a call resolved via a specific OTHER OSkey package this
//   file imports) / resolved_via_same_target (Swift's analog of Kotlin's
//   resolved_via_same_package -- files in the SAME SPM target see each other
//   with NO import needed at all, which is why this tier is more load-bearing
//   here than Kotlin's own) / unresolved.
// - REAL, HONEST LIMITATION, not silently hidden: `resolved_via_import`
//   requires ANOTHER OSkey package's own declarations to already be
//   extracted and loaded, which no repo in this family does yet as of this
//   restructuring (P1 build tasklist Task 11, cross-repo resolution, is not
//   built) -- so `resolved_via_import` never fires for ANY repo this script
//   runs against today, and every call to an external framework
//   (Foundation, CoreBluetooth, Combine, os, ...) is tagged `unresolved`,
//   same as a real gap would be. Distinguishing "expected external, not a
//   gap" from "our own code, should have resolved" is real, deferred,
//   cross-repo work, not solved in this pass. Never silently claim a
//   confidence tier this script cannot actually back up.

import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import {
  RunNotifications,
  addNotification,
  writeJsonAtomically,
  writeNotificationsAtomically,
  loadNotifications,
  runContextPath,
  requireRepoNameEnv,
} from "./_shared/run-utils";

const projectRoot = process.cwd();

type FileRecord = { repo: string; module: string; submodule: string | null; path: string; kindHint: string; sizeBytes: number };

type SwiftImportFact = { module: string; line: number };
type SwiftEnumCaseFact = { name: string; rawValue: string | null; associatedValues: string[] };
type SwiftDeclFact = { name: string; line: number; visibility: string; extendsTypes: string[]; parentType: string | null; cases: SwiftEnumCaseFact[] };
type SwiftFunctionFact = { name: string; line: number; visibility: string; isStatic: boolean; parentType: string | null };
type SwiftPropertyFact = { name: string; line: number; visibility: string; isStatic: boolean; isLet: boolean; parentType: string | null };
type SwiftCallFact = { calleeExpression: string; rootIdentifier: string; line: number; callerFunction: string | null; callerType: string | null; arguments: string[] };

type SwiftFileFacts = {
  path: string;
  diagnosticCount: number;
  diagnosticMessages: string[];
  imports: SwiftImportFact[];
  classes: SwiftDeclFact[];
  structs: SwiftDeclFact[];
  enums: SwiftDeclFact[];
  protocols: SwiftDeclFact[];
  extensions: SwiftDeclFact[];
  functions: SwiftFunctionFact[];
  properties: SwiftPropertyFact[];
  calls: SwiftCallFact[];
};

type SwiftExtractionResult = {
  schemaVersion: string;
  totalFiles: number;
  filesWithDiagnostics: number;
  totalDiagnostics: number;
  files: SwiftFileFacts[];
};

type DeclLocation = { file: string; module: string };

function main() {
  const REPO_NAME = requireRepoNameEnv();

  const repoConfigPath = path.join(projectRoot, "config", "repos.json");
  const repoConfig = JSON.parse(fs.readFileSync(repoConfigPath, "utf8"));
  const targetRepoCfg = repoConfig.repositories?.find((r: any) => r.name === REPO_NAME);
  if (!targetRepoCfg) {
    throw new Error(`[Fail-Closed] Repository '${REPO_NAME}' not found in config/repos.json.`);
  }
  if (targetRepoCfg.astTool !== "SwiftSyntax") {
    throw new Error(`[Fail-Closed] This script only handles Swift repos (astTool: "SwiftSyntax") -- '${REPO_NAME}' is configured with astTool '${targetRepoCfg.astTool}'.`);
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

  const runDir = path.join(projectRoot, "output", "runs", REPO_NAME, runId);
  const factsDir = path.join(runDir, "facts");
  const notificationsPath = path.join(runDir, "run-notifications.json");
  const notifications = loadNotifications(notificationsPath, runId, REPO_NAME);

  const clonePath = path.join(projectRoot, "output", "clones", REPO_NAME);
  const filesListPath = path.join(factsDir, "files.json");
  if (!fs.existsSync(filesListPath)) {
    throw new Error(`[Fail-Closed] Missing required facts/files.json. Please run \`00-scan-repo\` first.`);
  }
  const filesList: FileRecord[] = JSON.parse(fs.readFileSync(filesListPath, "utf8"));
  const filesByPath = new Map(filesList.map(f => [f.path, f]));

  // --- Invoke the Swift subprocess against the whole clone (not just
  // modulesRoot) so its own "path" field is directly comparable to
  // files.json's own clonePath-relative paths -- then filter down to exactly
  // the files 00-scan-repo.ts already decided are in scope (Sources/ only,
  // Tests/ excluded), rather than re-deciding scope here. ---
  const extractorBinary = path.join(__dirname, "swift-extractor", ".build", "release", "swift-extractor");
  if (!fs.existsSync(extractorBinary)) {
    throw new Error(`[Fail-Closed] swift-extractor binary not found at '${extractorBinary}' -- run 'swift build -c release' in that directory first.`);
  }

  const subprocessOutputPath = path.join(runDir, "knowledge-pipeline", "swift-extractor-raw.json");
  console.log(`Invoking swift-extractor against ${clonePath} ...`);
  const stdout = execFileSync(extractorBinary, [clonePath, subprocessOutputPath], { encoding: "utf8" });
  console.log(stdout.trim());

  const rawResult: SwiftExtractionResult = JSON.parse(fs.readFileSync(subprocessOutputPath, "utf8"));
  const inScopeFiles = rawResult.files.filter(f => filesByPath.has(f.path));

  addNotification(
    notifications,
    "01-extract-ast-evidence",
    "info",
    "SWIFT_EXTRACTOR_INVOKED",
    `swift-extractor processed ${rawResult.totalFiles} files repo-wide; ${inScopeFiles.length} are in scope (modulesRoot Sources/, matching files.json).`,
    { totalFilesProcessed: rawResult.totalFiles, inScopeFiles: inScopeFiles.length }
  );

  // --- Pass 1: build the same-target declaration table from every real
  // class/struct/enum/protocol/function across all in-scope files,
  // REGARDLESS of nesting depth -- matching Kotlin's own resolver precedent
  // exactly (its declLocation walk uses findNodesOfType with no depth
  // restriction, so a class's own METHODS are indexed the same as top-level
  // functions). Real bug found and fixed 2026-09-10: an earlier version of
  // this pass restricted to parentType===null (top-level only) and produced
  // 0 real same-target resolutions out of 433 real calls on this repo's own
  // code -- almost every real call here is to a sibling method within the
  // same class (e.g. `stopScan()` called from another method of
  // OSKBKCentralManager), which a top-level-only index can never see.
  // Extensions are deliberately NOT added here -- an extension adds members
  // to an EXISTING type, it does not declare a new name.
  //
  // Known, honest, accepted limitation (same one Kotlin's own flat
  // `${pkg}.${name}` map already has, not a new problem introduced here): a
  // method name reused across two different classes in this repo will
  // collide in this flat, name-only map, resolving to whichever declaration
  // was indexed last. This is a real limit of a non-compiler-exact,
  // syntax-only resolver -- tagged resolved_via_same_target, never
  // "confirmed", precisely because of this.
  const declLocation = new Map<string, DeclLocation>();
  for (const file of inScopeFiles) {
    const rec = filesByPath.get(file.path)!;
    for (const kindList of [file.classes, file.structs, file.enums, file.protocols]) {
      for (const decl of kindList) {
        declLocation.set(decl.name, { file: file.path, module: rec.module });
      }
    }
    for (const fn of file.functions) {
      // Real bug found and fixed 2026-09-10, immediately after adding
      // init/deinit extraction: "init" and "deinit" are generic Swift
      // keywords, not distinguishing declaration names -- nearly every real
      // type has its own "init". Indexing them here made declLocation.get
      // ("init") resolve to whichever class's init happened to be indexed
      // LAST across the whole repo, producing spurious resolved_via_same_
      // target matches on ordinary `.init(...)`/shorthand-initializer call
      // sites (confirmed directly: OSKBKEncryptionService's own `.init(...)`
      // call "resolved" to its own file only by coincidence of iteration
      // order, not because the match was real). Excluded from the
      // resolution table entirely -- these calls fall through to the
      // "self"/"super"-style self_reference handling below instead, which
      // is the honest answer (a bare `.init(...)`/`super.init(...)` always
      // refers to the type already being constructed, not a name that
      // needs -- or can safely use -- cross-file lookup).
      if (fn.name === "init" || fn.name === "deinit") continue;
      declLocation.set(fn.name, { file: file.path, module: rec.module });
    }
  }

  // --- Pass 2: emit facts per file ---
  const rawImports: any[] = [];
  const rawClasses: any[] = [];
  const rawStructs: any[] = [];
  const rawEnums: any[] = [];
  const rawProtocols: any[] = [];
  const rawExtensions: any[] = [];
  const rawFunctions: any[] = [];
  const rawProperties: any[] = [];
  const rawCalls: any[] = [];
  const rawErrors: any[] = [];
  const rawBleGattConstants: any[] = [];

  let resolvedViaImport = 0;
  let resolvedViaSameTarget = 0;
  let unresolvedCalls = 0;

  for (const file of inScopeFiles) {
    const rec = filesByPath.get(file.path)!;
    const base = { repo: REPO_NAME, module: rec.module, submodule: rec.submodule, file: file.path };

    if (file.diagnosticCount > 0) {
      for (const message of file.diagnosticMessages) {
        rawErrors.push({ ...base, line: 1, message });
      }
    }

    for (const imp of file.imports) {
      rawImports.push({ ...base, line: imp.line, value: imp.module });
    }

    const emitDecl = (kindList: SwiftDeclFact[], target: any[]) => {
      for (const d of kindList) {
        target.push({
          ...base,
          line: d.line,
          name: d.name,
          visibility: d.visibility,
          extendsTypes: d.extendsTypes,
          parentType: d.parentType,
          ...(d.cases.length > 0 ? { cases: d.cases } : {}),
        });
      }
    };
    emitDecl(file.classes, rawClasses);
    emitDecl(file.structs, rawStructs);
    emitDecl(file.enums, rawEnums);
    emitDecl(file.protocols, rawProtocols);
    emitDecl(file.extensions, rawExtensions);

    for (const fn of file.functions) {
      rawFunctions.push({ ...base, line: fn.line, name: fn.name, visibility: fn.visibility, isStatic: fn.isStatic, parentType: fn.parentType });
    }
    for (const p of file.properties) {
      rawProperties.push({ ...base, line: p.line, name: p.name, visibility: p.visibility, isStatic: p.isStatic, isLet: p.isLet, parentType: p.parentType });
    }

    for (const call of file.calls) {
      // Skip self-references -- "self"/"super" as a root identifier is never
      // a resolvable declaration name, and treating it as an unresolved
      // real-code gap would misrepresent completely ordinary Swift.
      if (call.rootIdentifier === "self" || call.rootIdentifier === "super") {
        // callerClass, not callerType: the shared facts-postgres-index/
        // sync-facts.ts's existing callExpressionDoc branch (built for TS/
        // Kotlin) reads fact.callerClass -- renamed at this emission
        // boundary, not upstream in the Swift extractor, so the raw
        // swift-extractor JSON keeps the more accurate Swift-specific name
        // (a call's enclosing type can just as easily be a struct/enum/
        // protocol, not only a class) while the wire-format fact this
        // script writes stays cross-language-compatible for free.
        rawCalls.push({ ...base, line: call.line, calleeExpression: call.calleeExpression, callerFunction: call.callerFunction, callerClass: call.callerType, declarationFile: null, declarationModule: null, resolutionMethod: "self_reference" });
        continue;
      }

      let declarationFile: string | null = null;
      let declarationModule: string | null = null;
      let resolutionMethod: "resolved_via_import" | "resolved_via_same_target" | "unresolved" = "unresolved";

      // resolved_via_import (cross-target, via another OSkey package's own
      // declLocation table) is NOT implemented in this pass -- deliberately,
      // not an oversight. It has nothing to match against yet: this is the
      // first (pilot) repo in the family to be built, so no other package's
      // declarations have been extracted. Real work for Task 11, once
      // ios-oskey-dev's own resolver can load sibling repos' facts. Adding a
      // check here now that can only ever no-op would be dead code, not a
      // real capability -- see this file's own header comment.

      // resolved_via_same_target: Swift's real, load-bearing tier -- files in
      // the SAME SPM target see each other with no import needed at all.
      const target = declLocation.get(call.rootIdentifier);
      if (target) {
        declarationFile = target.file;
        declarationModule = target.module;
        resolutionMethod = "resolved_via_same_target";
      }

      // resolvedViaImport stays permanently 0 until Task 11 actually
      // implements the resolved_via_import tier -- see this file's own
      // header comment. Not compared here on purpose: nothing in this
      // function can ever assign resolutionMethod that value yet, and
      // `tsc --noEmit -p .` correctly flags a literal comparison against it
      // as unreachable -- a real signal, not suppressed.
      if (resolutionMethod === "resolved_via_same_target") resolvedViaSameTarget++;
      else unresolvedCalls++;

      rawCalls.push({
        ...base,
        line: call.line,
        calleeExpression: call.calleeExpression,
        callerFunction: call.callerFunction,
        callerClass: call.callerType,
        declarationFile,
        declarationModule,
        resolutionMethod,
        ...(call.arguments.length > 0 ? { arguments: call.arguments } : {}),
      });
    }

    // Task 6: BLE GATT wire-format constants -- real, high-value domain
    // fact, direct Swift analog of Kotlin's own ast-ble-gatt-constants.json
    // (android-intercom-oskey-io/01-extract-ast-evidence.ts). Detected
    // structurally: any `CBUUID(string: "...")` call -- Swift/CoreBluetooth's
    // real analog to Kotlin's `UUID.fromString("...")`. Real, confirmed
    // finding while designing this (2026-09-10): 5 of this repo's own 6 real
    // UUID constants are BYTE-FOR-BYTE IDENTICAL to Android's own
    // OSKUUIDTable.kt values (advertizingServiceUUID, unlockServiceUUID,
    // unlockCentralCmdCharUUID, unlockPeripheralCmdCharUUID,
    // doorStatusCharUUID) -- real, direct evidence the two platforms
    // implement the SAME physical BLE lock protocol, not independent
    // reimplementations. The 6th (sesameAdvertizingServiceUUID) has no
    // Android equivalent -- a real, Swift-only extension (a different lock
    // hardware vendor/brand), not a gap.
    //
    // The constant's NAME comes from the property declaration on the SAME
    // line (confirmed real and consistent: every one of this repo's own real
    // UUID constants is a single-line `static let NAME = CBUUID(string:
    // "...")`) -- a deliberate line-correlation join across two already-
    // separate fact lists, not a guess; real, honest limitation: would break
    // if a future constant's declaration and initializer ever span multiple
    // lines, not currently the case anywhere in this repo (checked directly).
    // `kind` classified from THIS repo's own real, observed naming
    // convention (contains "Service" -> service, contains "Char" ->
    // characteristic) -- NOT Kotlin's GATT_SERVICE_*/GATT_CHAR_* prefix
    // convention, which does not exist in this repo's own real style
    // (camelCase suffix, not a screaming-snake-case prefix). Falls back to
    // "unknown" for a name that doesn't match either pattern, so a future
    // differently-named UUID constant is still captured, not dropped.
    for (const call of file.calls) {
      if (call.calleeExpression !== "CBUUID") continue;
      const stringArg = call.arguments.find(a => a.startsWith("string:"));
      if (!stringArg) continue;
      const uuidMatch = stringArg.match(/"([^"]+)"/);
      if (!uuidMatch) continue;
      const uuidValue = uuidMatch[1];

      const matchingProperty = file.properties.find(p => p.line === call.line);
      if (!matchingProperty) continue; // Real, honest skip -- no correlated property name found, don't fabricate one.

      const lowerName = matchingProperty.name.toLowerCase();
      const kind = lowerName.includes("service")
        ? "service"
        : lowerName.includes("char")
        ? "characteristic"
        : lowerName.includes("descriptor") || lowerName.includes("ccc")
        ? "descriptor"
        : "unknown";

      rawBleGattConstants.push({ ...base, line: call.line, name: matchingProperty.name, uuidValue, kind });
    }
  }

  addNotification(
    notifications,
    "01-extract-ast-evidence",
    "info",
    "CALL_RESOLUTION_SUMMARY",
    `Call resolution: ${resolvedViaImport} resolved_via_import, ${resolvedViaSameTarget} resolved_via_same_target, ${unresolvedCalls} unresolved (unresolved includes real external-framework calls -- Foundation/CoreBluetooth/Combine/etc -- not distinguished from a real gap in this pass, see this script's own header comment).`,
    { resolvedViaImport, resolvedViaSameTarget, unresolvedCalls }
  );

  // AST error-tolerance gate -- implemented from day one per this repo's own
  // config/repos.json astErrorTolerancePercent, not left unenforced the way
  // android-intercom-oskey-io's own Task 8 found and had to fix after the
  // fact. targetRepoCfg loaded once, up top, alongside the astTool check.
  const astErrorTolerancePercent: number = targetRepoCfg?.astErrorTolerancePercent ?? 0;

  const attemptedFileCount = inScopeFiles.length;
  const erroredFileCount = inScopeFiles.filter(f => f.diagnosticCount > 0).length;
  const errorRatePercent = attemptedFileCount > 0 ? (erroredFileCount / attemptedFileCount) * 100 : 0;

  if (errorRatePercent > astErrorTolerancePercent) {
    addNotification(
      notifications,
      "01-extract-ast-evidence",
      "fatal",
      "AST_ERROR_TOLERANCE_EXCEEDED",
      `AST extraction found parse errors in ${erroredFileCount}/${attemptedFileCount} files (${errorRatePercent.toFixed(2)}%), exceeding configured tolerance of ${astErrorTolerancePercent}%.`,
      { erroredFileCount, attemptedFileCount, errorRatePercent, astErrorTolerancePercent },
      true
    );
    writeNotificationsAtomically(notificationsPath, notifications);
    throw new Error(
      `[Fail-Closed] AST extraction error rate ${errorRatePercent.toFixed(2)}% exceeds configured tolerance of ${astErrorTolerancePercent}% (${erroredFileCount}/${attemptedFileCount} files).`
    );
  } else if (erroredFileCount > 0) {
    addNotification(
      notifications,
      "01-extract-ast-evidence",
      "warning",
      "AST_ERRORS_WITHIN_TOLERANCE",
      `AST extraction found parse errors in ${erroredFileCount}/${attemptedFileCount} files (${errorRatePercent.toFixed(2)}%), within configured tolerance of ${astErrorTolerancePercent}%.`,
      { erroredFileCount, attemptedFileCount, errorRatePercent, astErrorTolerancePercent }
    );
  }

  writeJsonAtomically(path.join(factsDir, "ast-imports.json"), rawImports, "facts/ast-imports.json");
  writeJsonAtomically(path.join(factsDir, "ast-classes.json"), rawClasses, "facts/ast-classes.json");
  writeJsonAtomically(path.join(factsDir, "ast-structs.json"), rawStructs, "facts/ast-structs.json");
  writeJsonAtomically(path.join(factsDir, "ast-enums.json"), rawEnums, "facts/ast-enums.json");
  writeJsonAtomically(path.join(factsDir, "ast-protocols.json"), rawProtocols, "facts/ast-protocols.json");
  writeJsonAtomically(path.join(factsDir, "ast-extensions.json"), rawExtensions, "facts/ast-extensions.json");
  writeJsonAtomically(path.join(factsDir, "ast-functions.json"), rawFunctions, "facts/ast-functions.json");
  writeJsonAtomically(path.join(factsDir, "ast-properties.json"), rawProperties, "facts/ast-properties.json");
  writeJsonAtomically(path.join(factsDir, "ast-calls.json"), rawCalls, "facts/ast-calls.json");
  writeJsonAtomically(path.join(factsDir, "ast-errors.json"), rawErrors, "facts/ast-errors.json");
  writeJsonAtomically(path.join(factsDir, "ast-ble-gatt-constants.json"), rawBleGattConstants, "facts/ast-ble-gatt-constants.json");

  const astManifest = {
    schemaVersion: "1.0.0",
    runId,
    repoName: REPO_NAME,
    generatedAt: new Date().toISOString(),
    artefacts: [
      { file: "ast-imports.json", evidenceType: "imports", recordCount: rawImports.length, required: true },
      { file: "ast-classes.json", evidenceType: "classes", recordCount: rawClasses.length, required: true },
      { file: "ast-structs.json", evidenceType: "structs", recordCount: rawStructs.length, required: true },
      { file: "ast-enums.json", evidenceType: "enums", recordCount: rawEnums.length, required: true },
      { file: "ast-protocols.json", evidenceType: "protocols", recordCount: rawProtocols.length, required: true },
      { file: "ast-extensions.json", evidenceType: "extensions", recordCount: rawExtensions.length, required: true },
      { file: "ast-functions.json", evidenceType: "functions", recordCount: rawFunctions.length, required: true },
      { file: "ast-properties.json", evidenceType: "properties", recordCount: rawProperties.length, required: true },
      { file: "ast-calls.json", evidenceType: "calls", recordCount: rawCalls.length, required: true },
      { file: "ast-errors.json", evidenceType: "errors", recordCount: rawErrors.length, required: false },
      { file: "ast-ble-gatt-constants.json", evidenceType: "bleGattConstants", recordCount: rawBleGattConstants.length, required: true },
    ],
  };
  writeJsonAtomically(path.join(factsDir, "ast-manifest.json"), astManifest, "facts/ast-manifest.json");
  writeNotificationsAtomically(notificationsPath, notifications);

  console.log(`Classes: ${rawClasses.length}, Structs: ${rawStructs.length}, Enums: ${rawEnums.length}, Protocols: ${rawProtocols.length}, Extensions: ${rawExtensions.length}`);
  console.log(`Functions: ${rawFunctions.length}, Properties: ${rawProperties.length}, Imports: ${rawImports.length}, Calls: ${rawCalls.length}`);
  console.log(`Call resolution: ${resolvedViaImport} via import, ${resolvedViaSameTarget} via same-target, ${unresolvedCalls} unresolved.`);
  console.log(`BLE GATT constants: ${rawBleGattConstants.length}`);
}

main();
