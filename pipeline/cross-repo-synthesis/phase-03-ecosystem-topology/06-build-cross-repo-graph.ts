// © Oskey SAS. All rights reserved.

import * as fs from 'fs';
import * as path from 'path';

const baseDir = process.cwd();

const synthesisId = new Date().toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
console.log(`Synthesizing Enterprise Topology Graph (Synthesis ID: ${synthesisId})`);

// 2. Load configured repositories
const reposConfigPath = path.join(baseDir, 'config', 'repos.json');
let reposConfig: any = { repositories: [] };
if (fs.existsSync(reposConfigPath)) {
  reposConfig = JSON.parse(fs.readFileSync(reposConfigPath, 'utf8'));
}

const activeRepos = reposConfig.repositories || [];
console.log(`Found ${activeRepos.length} configured repositories in config/repos.json:`);
activeRepos.forEach((r: any) => {
  const displayPath = r.gitUrl ? `Git: ${r.gitUrl}` : r.path;
  console.log(`  - ${r.name} (${displayPath})`);
});

interface CrossRepoEdge {
  sourceRepo: string;
  sourceSymbol: string;
  targetRepo: string;
  targetSymbol: string;
  connectionType: 'HTTP_API_CALL' | 'FIRESTORE_EVENT_TRIGGER' | 'HARDWARE_SOCKET_PAYLOAD' | 'SHARED_COLLECTION' | 'PUBSUB_TOPIC_BINDING';
  resolutionStatus: 'resolved' | 'unresolved';
  details: string;
}

// Node-IoT <-> Firebase Pub/Sub topic bindings, confirmed 2026-08-29 --
// investigated at length as part of the node-iot-api-oskey-io Stage 4 cross-
// repo join (see governance/roadmap/node-iot-api-oskey-io/01-phase2-contract
// -design.md and this session's own investigation). This is deliberately
// NOT derived from AST facts the way the HTTP_API_CALL join below is: the
// receiving side (Firebase's `processPubSubMessage`, a plain HTTP push
// endpoint) never references the topic name anywhere in its own source --
// the topic -> subscription -> push-endpoint binding lives entirely in GCP
// Pub/Sub subscription config, external to both repos. Confirmed via three
// independent lines of evidence, none of them AST-derivable: (1) the GCP
// subscription naming convention `{topic}-{handlerName}` (the real
// subscription is literally named `accessControlDevice_activities-
// processPubSubMessage`), (2) an explicit code comment in Firebase's
// `pub_sub_receiver.service.ts` reading "This case handles the specific
// payload from node-iot for device activities", and (3) the message shape
// node-iot's own `pubsub_publish_call` call site publishes matching what
// that same handler case destructures. Checked for a Terraform/IaC
// declaration of this binding in either repo (there is none) before
// concluding a manually-maintained table is the only honest option here --
// this is a genuine capability boundary of AST-only extraction, not a gap
// to eventually close with cleverer parsing. Add an entry here ONLY when a
// binding has been independently confirmed this way, not on a naming-
// convention guess alone.
const EXTERNAL_PUBSUB_BINDINGS: Array<{ topicName: string; firebaseHandlerValue: string; confirmedVia: string }> = [
  {
    topicName: 'accessControlDevice_activities',
    firebaseHandlerValue: 'processPubSubMessage',
    confirmedVia:
      'GCP subscription "accessControlDevice_activities-processPubSubMessage" (naming convention) + ' +
      'pub_sub_receiver.service.ts "activities" case code comment ("payload from node-iot for device activities") + ' +
      'matching message shape (data.entity.activity) -- confirmed 2026-08-29, not AST-derivable.',
  },
];

const ecosystemNodes: Array<{ repo: string; nodeType: string; name: string; details: any }> = [];
const crossRepoEdges: CrossRepoEdge[] = [];

// 3. Resolve active runs per repo & load facts
const reposWithRuns: any[] = [];
activeRepos.forEach((r: any) => {
  const ctxPath = path.join(baseDir, 'output', r.name, 'run-context.json');
  if (fs.existsSync(ctxPath)) {
    const ctx = JSON.parse(fs.readFileSync(ctxPath, 'utf8'));
    if (ctx.runId) {
      reposWithRuns.push({ ...r, runId: ctx.runId });
      console.log(`  -> Resolved runId [${ctx.runId}] for ${r.name}`);
    }
  }
});

// Populate ecosystem nodes (modules)
for (const r of reposWithRuns) {
  const modulesPath = path.join(baseDir, 'output', 'runs', r.name, r.runId, 'facts', 'modules.json');
  if (fs.existsSync(modulesPath)) {
    const mods = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
    for (const m of mods) {
      ecosystemNodes.push({ repo: r.name, nodeType: 'module', name: m.module, details: {} });
    }
  }
}

// Build the cross-repo join
const targetCallables = new Map<string, any>();
const targetPubsubReceivers = new Map<string, any>();

// 3a. Load target API contracts (Firebase)
for (const r of reposWithRuns) {
  const apiContractsPath = path.join(baseDir, 'output', 'runs', r.name, r.runId, 'facts', 'ast-api-contracts.json');
  if (fs.existsSync(apiContractsPath)) {
    const contracts = JSON.parse(fs.readFileSync(apiContractsPath, 'utf8'));
    for (const c of contracts) {
      if (c.contractType === 'callable' && c.callableExportName) {
        targetCallables.set(c.callableExportName, { repo: r.name, ...c });
      }
      if (c.pubsubPushReceiver && c.value) {
        targetPubsubReceivers.set(c.value, { repo: r.name, ...c });
      }
    }
  }
}

let resolvedCount = 0;
let unresolvedCount = 0;

// 3b. Load source calls (Angular) and join
for (const r of reposWithRuns) {
  const callsPath = path.join(baseDir, 'output', 'runs', r.name, r.runId, 'facts', 'ast-firebase-callable-calls.json');
  if (fs.existsSync(callsPath)) {
    const calls = JSON.parse(fs.readFileSync(callsPath, 'utf8'));
    for (const call of calls) {
      const originalName = call.functionName;
      if (!originalName) continue;

      const dashIdx = originalName.indexOf('-');
      const strippedName = dashIdx >= 0 ? originalName.substring(dashIdx + 1) : originalName;

      const match = targetCallables.get(strippedName);
      if (match) resolvedCount++; else unresolvedCount++;

      crossRepoEdges.push({
        sourceRepo: r.name,
        sourceSymbol: `${call.path}:${call.line} -> ${originalName}`,
        targetRepo: match ? match.repo : 'unknown',
        targetSymbol: strippedName,
        connectionType: 'HTTP_API_CALL',
        resolutionStatus: match ? 'resolved' : 'unresolved',
        details: `req: ${call.requestTypeText || 'undefined'}, res: ${call.responseTypeText || 'undefined'}, data: ${call.hasDataArgument}`
      });
    }
  }
}
console.log(`Cross-repo callable join: ${resolvedCount} resolved, ${unresolvedCount} unresolved.`);

// 3c. Load source pubsub publish calls (Node-IoT) and join via
// EXTERNAL_PUBSUB_BINDINGS -- this is NOT a fact-derived join like 3b above
// (see that table's own comment for why no AST-based join is possible for
// this connection type).
let pubsubResolvedCount = 0;
let pubsubUnresolvedCount = 0;

for (const r of reposWithRuns) {
  const externalHooksPath = path.join(baseDir, 'output', 'runs', r.name, r.runId, 'facts', 'ast-external-hooks.json');
  if (fs.existsSync(externalHooksPath)) {
    const hooks = JSON.parse(fs.readFileSync(externalHooksPath, 'utf8'));
    for (const hook of hooks) {
      if (hook.type !== 'pubsub_publish_call') continue;

      if (hook.topicResolutionStatus !== 'resolved') {
        pubsubUnresolvedCount++;
        crossRepoEdges.push({
          sourceRepo: r.name,
          sourceSymbol: `${hook.path}:${hook.line} -> ${hook.value}`,
          targetRepo: 'unknown',
          targetSymbol: hook.value,
          connectionType: 'PUBSUB_TOPIC_BINDING',
          resolutionStatus: 'unresolved',
          details: `Topic name not statically resolvable in source (topicResolutionStatus: ${hook.topicResolutionStatus}) -- a pass-through parameter at this call site, not a literal.`,
        });
        continue;
      }

      const binding = EXTERNAL_PUBSUB_BINDINGS.find(b => b.topicName === hook.value);
      if (!binding) {
        pubsubUnresolvedCount++;
        crossRepoEdges.push({
          sourceRepo: r.name,
          sourceSymbol: `${hook.path}:${hook.line} -> ${hook.value}`,
          targetRepo: 'unknown',
          targetSymbol: hook.value,
          connectionType: 'PUBSUB_TOPIC_BINDING',
          resolutionStatus: 'unresolved',
          details: `Topic "${hook.value}" resolved in source, but no external subscription binding is configured for it in EXTERNAL_PUBSUB_BINDINGS -- add one only once independently confirmed (GCP subscription config + code-level evidence), not on a naming guess.`,
        });
        continue;
      }

      const receiver = targetPubsubReceivers.get(binding.firebaseHandlerValue);
      pubsubResolvedCount++;
      crossRepoEdges.push({
        sourceRepo: r.name,
        sourceSymbol: `${hook.path}:${hook.line} -> ${hook.value}`,
        targetRepo: receiver ? receiver.repo : 'unknown',
        targetSymbol: binding.firebaseHandlerValue,
        connectionType: 'PUBSUB_TOPIC_BINDING',
        resolutionStatus: 'resolved',
        details: `Confirmed via external GCP subscription config, NOT AST-derivable -- ${binding.confirmedVia}${receiver ? ` Receiving handler: ${receiver.path}.` : ' WARNING: receiving handler not found in current Firebase facts -- binding may be stale.'}`,
      });
    }
  }
}
console.log(`Cross-repo pubsub-binding join: ${pubsubResolvedCount} resolved (externally confirmed), ${pubsubUnresolvedCount} unresolved.`);

// 4. Generate Enterprise Topology Artifacts under output/cross-repo-synthesis/${synthesisId}/
const ecosystemOutput = {
  synthesisId,
  generatedAt: new Date().toISOString(),
  repositoriesAnalyzed: reposWithRuns.map((r: any) => r.name),
  stats: {
    totalActiveRepositories: reposWithRuns.length,
    totalEcosystemNodes: ecosystemNodes.length,
    totalCrossRepoEdges: crossRepoEdges.length
  },
  nodes: ecosystemNodes,
  crossRepoEdges
};

const enterpriseTopologyDir = path.join(baseDir, `output/cross-repo-synthesis/${synthesisId}`);
fs.mkdirSync(enterpriseTopologyDir, { recursive: true });

const ecosystemJsonPath = path.join(enterpriseTopologyDir, 'enterprise-topology-graph.json');
fs.writeFileSync(ecosystemJsonPath, JSON.stringify(ecosystemOutput, null, 2), 'utf8');

// Generate Markdown Matrix
const matrixLines: string[] = [
  '<!-- © Oskey SAS. All rights reserved. -->',
  '',
  '# Enterprise Topology & Integration Trace Matrix',
  '',
  '*© Oskey SAS. All rights reserved.*',
  '',
  '---',
  '',
  '## Metadata',
  '',
  '| Property | Value |',
  '| :--- | :--- |',
  `| **Synthesis ID** | \`${synthesisId}\` |`,
  `| **Repositories Analyzed** | ${reposWithRuns.map((r: any) => r.name).join(', ')} |`,
  `| **Ecosystem Nodes** | ${ecosystemNodes.length} |`,
  `| **Cross-Repo Edges** | ${crossRepoEdges.length} |`,
  `| **Generated Date** | ${ecosystemOutput.generatedAt.split('T')[0]} |`,
  `| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |`,
  `| **Status** | Completed & Grounded |`,
  '',
  '---',
  '',
  '## 1. Configured Repositories',
  ''
];

reposWithRuns.forEach((r: any) => {
  const loc = r.gitUrl ? `Git \`${r.gitUrl}\`` : `Path \`${r.path}\``;
  matrixLines.push(`- **${r.name}**: ${loc} (Branch \`${r.branch || 'master'}\`)`);
});

matrixLines.push('');
matrixLines.push('---');
matrixLines.push('');
matrixLines.push('## 2. Cross-Repository Integrations', '');

if (crossRepoEdges.length === 0) {
  matrixLines.push(`Currently **${reposWithRuns.length}** repository (${reposWithRuns.map((r: any) => r.name).join(', ')}) is active in the evidence graph.`);
  matrixLines.push('');
  matrixLines.push('As additional repositories (`node-iot-api-oskey-io`, `angular-app-oskey-io`) complete Phase 1 AST extraction, cross-repository API HTTP calls, Firestore event triggers, and hardware socket payloads will automatically resolve here.');
} else {
  matrixLines.push('| Source Repo | Source Symbol | Connection Type | Status | Target Repo | Target Symbol | Details |');
  matrixLines.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
  crossRepoEdges.forEach(e => {
    const statusIcon = e.resolutionStatus === 'resolved' ? '✅' : '❌';
    matrixLines.push(`| \`${e.sourceRepo}\` | \`${e.sourceSymbol}\` | \`${e.connectionType}\` | ${statusIcon} ${e.resolutionStatus} | \`${e.targetRepo}\` | \`${e.targetSymbol}\` | ${e.details} |`);
  });
}

matrixLines.push('');
matrixLines.push('---');
matrixLines.push('');
matrixLines.push('## 3. Registered Repository Modules', '');
matrixLines.push('| Repository | Module Name |');
matrixLines.push('| :--- | :--- |');

ecosystemNodes.forEach(n => {
  matrixLines.push(`| \`${n.repo}\` | \`${n.name}\` |`);
});

const matrixMdPath = path.join(enterpriseTopologyDir, 'enterprise-integration-matrix.md');
fs.writeFileSync(matrixMdPath, matrixLines.join('\n'), 'utf8');

console.log(`\n✅ Phase 3 Complete: Synthesized Enterprise Topology Graph`);
console.log(`   - JSON Artifact: ${ecosystemJsonPath}`);
console.log(`   - Markdown Matrix: ${matrixMdPath}`);
console.log(`   - Active Repositories: ${reposWithRuns.length}`);
console.log(`   - Cross-Repo Edges: ${crossRepoEdges.length}`);
