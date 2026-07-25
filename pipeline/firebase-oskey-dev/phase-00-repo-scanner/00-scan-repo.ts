/// <reference types="node" />
// **version:** 2.5.0
// **location:** level-5 phase 0

// © Oskey SAS. All rights reserved

// This script scans the repository for modules and files, generating JSON outputs for modules and files.

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const REPO_NAME = "firebase-oskey-dev";

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

  if (fs.existsSync(clonePath)) {
    console.log(`Wiping existing clone directory to guarantee 100% branch purity: ${clonePath}...`);
    fs.rmSync(clonePath, { recursive: true, force: true });
  }

  console.log(`Cloning repository ${gitUrl} into ${clonePath}...`);
  execSync(`git clone "${gitUrl}" "${clonePath}"`, { stdio: "inherit" });

  if (commit) {
    console.log(`Checking out commit ${commit} in ${clonePath}...`);
    execSync(`git -C "${clonePath}" checkout "${commit}"`, { stdio: "inherit" });
  } else if (branch) {
    console.log(`Checking out branch ${branch} in ${clonePath}...`);
    try {
      execSync(`git -C "${clonePath}" checkout "${branch}"`, { stdio: "inherit" });
    } catch {
      console.log(`Creating local branch to track origin/${branch}...`);
      execSync(`git -C "${clonePath}" checkout -b "${branch}" "origin/${branch}"`, { stdio: "inherit" });
    }

    console.log(`Pulling updates for branch ${branch}...`);
    execSync(`git -C "${clonePath}" pull origin "${branch}"`, { stdio: "inherit" });
  }
}

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
  const extractedAt = new Date().toISOString();
  const configPath = path.join(projectRoot, "config/repos.json");
  const config = readJson<RepoConfig>(configPath);

  const targetRepo = config.repositories.find(r => r.name === REPO_NAME) || config.repositories[0];

  const clonePath = path.join(projectRoot, "output", "clones", targetRepo.name);
  let repoPath = clonePath;

  if (targetRepo.gitUrl) {
    try {
      syncRepo(targetRepo.gitUrl, clonePath, targetRepo.branch, targetRepo.commit);
      repoPath = clonePath;
    } catch (err: any) {
      if (targetRepo.path) {
        const localPath = path.isAbsolute(targetRepo.path) ? targetRepo.path : path.join(projectRoot, targetRepo.path);
        console.warn(`Warning: Failed to sync repo ${targetRepo.name} via Git. Falling back to local path ${localPath}. Error: ${err.message}`);
        repoPath = localPath;
      } else {
        throw new Error(`Failed to sync repo [${targetRepo.name}] via Git and no valid fallback path configured: ${err.message}`);
      }
    }
  } else if (targetRepo.path) {
    repoPath = path.isAbsolute(targetRepo.path) ? targetRepo.path : path.join(projectRoot, targetRepo.path);
  } else if (!fs.existsSync(clonePath)) {
    throw new Error(`Repository [${targetRepo.name}] has neither gitUrl nor path, and clone directory ${clonePath} does not exist.`);
  }

  const primarySha = getCommitSha(repoPath);

  const runId = getRunId(primarySha);
  console.log(`Starting pipeline run for repo [${REPO_NAME}] with Run ID: ${runId}`);

  const outputDir = path.join(projectRoot, "output");
  const repoOutputDir = path.join(outputDir, "runs", REPO_NAME, runId);
  const rawOutputDir = path.join(repoOutputDir, "facts");

  ensureDir(outputDir);
  ensureDir(rawOutputDir);

  // Write run-context.json
  fs.writeFileSync(
    path.join(outputDir, "run-context.json"),
    JSON.stringify({ runId, repoName: REPO_NAME, extractedAt }, null, 2)
  );

  // Write or update latest-repo-manifest.json
  const latestManifestPath = path.join(outputDir, "latest-repo-manifest.json");
  let latestManifestData: any = { updatedAt: extractedAt, repositories: {} };
  if (fs.existsSync(latestManifestPath)) {
    try {
      latestManifestData = JSON.parse(fs.readFileSync(latestManifestPath, "utf8"));
    } catch {
      // Use fresh object if malformed
    }
  }
  latestManifestData.updatedAt = extractedAt;
  if (!latestManifestData.repositories) {
    latestManifestData.repositories = {};
  }
  latestManifestData.repositories[REPO_NAME] = {
    latestRunId: runId,
    repoName: REPO_NAME,
    runPath: `output/runs/${REPO_NAME}/${runId}`,
    commitSha: primarySha,
    extractedAt,
  };

  fs.writeFileSync(latestManifestPath, JSON.stringify(latestManifestData, null, 2));

  const modulesOutput: any[] = [];
  const filesOutput: any[] = [];

  const modulesRootAbs = path.join(repoPath, targetRepo.modulesRoot);

  if (!fs.existsSync(modulesRootAbs)) {
    console.error(`Modules root not found: ${modulesRootAbs}`);
    process.exitCode = 1;
    return;
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
      repo: targetRepo.name,
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
        repo: targetRepo.name,
        module: moduleName,
        submodule: submodule ?? null,
        path: relToRepo,
        kindHint: inferKind(relToRepo),
        sizeBytes: fs.statSync(fileAbs).size,
      });
    }
  }

  fs.writeFileSync(
    path.join(rawOutputDir, "modules.json"),
    JSON.stringify(modulesOutput, null, 2)
  );

  fs.writeFileSync(
    path.join(rawOutputDir, "files.json"),
    JSON.stringify(filesOutput, null, 2)
  );

  console.log(`Repo: ${REPO_NAME}`);
  console.log(`Modules found: ${modulesOutput.length}`);
  console.log(`Files found: ${filesOutput.length}`);
  console.log(`Raw facts written to: ${rawOutputDir}`);
}

main();