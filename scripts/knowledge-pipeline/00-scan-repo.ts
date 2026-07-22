/// <reference types="node" />
// **version:** 0.0.3
// **location:** level-5 phases 1, 2

// © [Year] Oskey SAS. All rights reserved

// This script scans the repository for modules and files, generating a JSON output that lists all modules and their associated files.

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

/**
 * Generates a unique run ID based on the current UTC date and time.
 * @param commitSha The git commit short SHA.
 * @returns A string in the format YYYYMMDD_HHMMSS-commitSha.
 */
function getRunId(commitSha: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}${seconds}-${commitSha}`;
}

type RepoConfig = {
  repositories: {
    name: string;
    path: string;
    gitUrl?: string;
    branch?: string;
    commit?: string;
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

/**
 * Synchronizes the repository using Git SSH if gitUrl is configured.
 */
function syncRepo(gitUrl: string, clonePath: string, branch?: string, commit?: string) {
  const parentDir = path.dirname(clonePath);
  ensureDir(parentDir);

  if (!fs.existsSync(clonePath)) {
    console.log(`Cloning repository ${gitUrl} into ${clonePath}...`);
    const branchFlag = branch ? `-b ${branch}` : "";
    execSync(`git clone ${branchFlag} "${gitUrl}" "${clonePath}"`, { stdio: "inherit" });
  } else {
    console.log(`Pulling updates for repository in ${clonePath}...`);
    execSync(`git -C "${clonePath}" pull`, { stdio: "inherit" });
  }

  if (commit) {
    console.log(`Checking out commit ${commit} in ${clonePath}...`);
    execSync(`git -C "${clonePath}" checkout "${commit}"`, { stdio: "inherit" });
  } else if (branch) {
    console.log(`Checking out branch ${branch} in ${clonePath}...`);
    execSync(`git -C "${clonePath}" checkout "${branch}"`, { stdio: "inherit" });
  }
}

/**
 * Gets the current short commit SHA of a repository.
 */
function getCommitSha(repoPath: string): string {
  try {
    const sha = execSync(`git -C "${repoPath}" rev-parse --short HEAD`, { encoding: "utf8" }).trim();
    return sha;
  } catch (error) {
    console.warn(`Warning: Could not get git commit SHA from ${repoPath}. Defaulting to 'unknown'.`);
    return "unknown";
  }
}

function main() {
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, "config/repos.json");
  const config = readJson<RepoConfig>(configPath);

  // Determine the primary commit SHA for the run ID from the first repository
  let primarySha = "unknown";
  if (config.repositories && config.repositories.length > 0) {
    const firstRepo = config.repositories[0];
    let firstRepoPath = firstRepo.path;

    if (firstRepo.gitUrl) {
      const clonePath = path.join(projectRoot, "output/clones", firstRepo.name);
      try {
        syncRepo(firstRepo.gitUrl, clonePath, firstRepo.branch, firstRepo.commit);
        firstRepoPath = clonePath;
      } catch (err: any) {
        console.warn(`Warning: Failed to sync repo ${firstRepo.name} via Git. Falling back to local path ${firstRepo.path}. Error: ${err.message}`);
      }
    }

    primarySha = getCommitSha(firstRepoPath);
  }

  const runId = getRunId(primarySha);
  console.log(`Starting new pipeline run with Run ID: ${runId}`);

  const outputDir = path.join(projectRoot, "output");
  const versionedOutputRoot = path.join(projectRoot, "output", "runs", runId);
  const outputRoot = path.join(versionedOutputRoot, "raw");

  // Write the context for this run so other scripts can find it.
  ensureDir(outputDir);
  fs.writeFileSync(path.join(outputDir, "run-context.json"), JSON.stringify({ runId }, null, 2));

  ensureDir(outputRoot);

  const modulesOutput: any[] = [];
  const filesOutput: any[] = [];

  for (const repo of config.repositories) {
    let repoPath = repo.path;

    if (repo.gitUrl) {
      const clonePath = path.join(projectRoot, "output/clones", repo.name);
      try {
        syncRepo(repo.gitUrl, clonePath, repo.branch, repo.commit);
        repoPath = clonePath;
      } catch (err: any) {
        console.warn(`Warning: Failed to sync repo ${repo.name} via Git. Falling back to local path ${repo.path}. Error: ${err.message}`);
        repoPath = repo.path;
      }
    }

    const modulesRootAbs = path.join(repoPath, repo.modulesRoot);

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
        path: path.relative(repoPath, modulePathAbs),
        submodules,
        fileCount: moduleFiles.length,
      });

      for (const fileAbs of moduleFiles) {
        const relToRepo = path.relative(repoPath, fileAbs);
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