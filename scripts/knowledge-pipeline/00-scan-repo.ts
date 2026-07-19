/// <reference types="node" />
// **version:** 0.0.2
// **location:** level-5 phases 1, 2

// © [Year] Oskey SAS. All rights reserved

// This script scans the repository for modules and files, generating a JSON output that lists all modules and their associated files.

import * as fs from "fs";
import * as path from "path";

/**
 * Generates a unique run ID based on the current UTC date and time.
 * @returns A string in the format YYYYMMDD-HHMMSS.
 */
function getRunId(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

type RepoConfig = {
  repositories: {
    name: string;
    path: string;
    modulesRoot: string;
  }[];
};

const EXCLUDED_DIRS = new Set([
  "node_modules",
  "dist",
  "lib",
  "build",
  "coverage",
  ".git",
]);

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function isTsSource(filePath: string): boolean {
  return (
    filePath.endsWith(".ts") &&
    !filePath.endsWith(".spec.ts") &&
    !filePath.endsWith(".test.ts") &&
    !filePath.endsWith(".d.ts")
  );
}

function inferKind(filePath: string): string {
  if (filePath.includes("/services/") || filePath.includes("_service") || filePath.includes(".service.")) return "service";
  if (filePath.includes("/controllers/") || filePath.includes(".controller.")) return "controller";
  if (filePath.includes("/models/") || filePath.includes(".model.")) return "model";
  if (filePath.includes("/utils/") || filePath.includes(".utils.") || filePath.includes(".util.")) return "utils";
  if (filePath.includes("/data/") || filePath.includes(".data.")) return "data";
  if (filePath.includes("/functions/")) return "function";
  return "unknown";
}

function walkFiles(dirPath: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dirPath)) return results;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        results.push(...walkFiles(fullPath));
      }
    } else if (entry.isFile() && isTsSource(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function main() {
  const runId = getRunId();
  console.log(`Starting new pipeline run with Run ID: ${runId}`);

  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, "config/repos.json");
  const outputDir = path.join(projectRoot, "output");
  const versionedOutputRoot = path.join(projectRoot, "output", "runs", runId);
  const outputRoot = path.join(versionedOutputRoot, "raw");

  // Write the context for this run so other scripts can find it.
  ensureDir(outputDir);
  fs.writeFileSync(path.join(outputDir, "run-context.json"), JSON.stringify({ runId }, null, 2));

  ensureDir(outputRoot);

  const config = readJson<RepoConfig>(configPath);

  const modulesOutput: any[] = [];
  const filesOutput: any[] = [];

  for (const repo of config.repositories) {
    const modulesRootAbs = path.join(repo.path, repo.modulesRoot);

    if (!fs.existsSync(modulesRootAbs)) {
      console.error(`Modules root not found: ${modulesRootAbs}`);
      process.exitCode = 1;
      continue;
    }

    const moduleDirs = fs
      .readdirSync(modulesRootAbs, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const moduleName of moduleDirs) {
      const modulePathAbs = path.join(modulesRootAbs, moduleName);
      const moduleFiles = walkFiles(modulePathAbs);

      const submodulesRoot = path.join(modulePathAbs, "modules");
      const submodules = fs.existsSync(submodulesRoot)
        ? fs
            .readdirSync(submodulesRoot, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)
            .sort()
        : [];

      modulesOutput.push({
        repo: repo.name,
        module: moduleName,
        path: path.relative(repo.path, modulePathAbs),
        submodules,
        fileCount: moduleFiles.length,
      });

      for (const fileAbs of moduleFiles) {
        const relToRepo = path.relative(repo.path, fileAbs);
        const submodule = submodules.find((s) =>
          relToRepo.includes(`/modules/${s}/`)
        );

        filesOutput.push({
          repo: repo.name,
          module: moduleName,
          submodule: submodule ?? null,
          path: relToRepo,
          kindHint: inferKind(relToRepo),
          sizeBytes: fs.statSync(fileAbs).size,
        });
      }
    }
  }

  fs.writeFileSync(
    path.join(outputRoot, "modules.json"),
    JSON.stringify(modulesOutput, null, 2)
  );

  fs.writeFileSync(
    path.join(outputRoot, "files.json"),
    JSON.stringify(filesOutput, null, 2)
  );

  console.log(`Modules found: ${modulesOutput.length}`);
  console.log(`Files found: ${filesOutput.length}`);
  console.log(`Output written to: ${outputRoot}`);
}

main();