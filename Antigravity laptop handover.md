# Project Handover & Semantic State Restore Document

**Project:** Oskey Engineering Knowledge Corpus POC  
**Active Session ID:** 48f2a5a9-fdd0-46b0-873c-ed7fffb1d483  
**Date:** July 23, 2026  
---

## 1\. Executive Context & System Charter

The Oskey Engineering Knowledge Corpus POC is designed to solve a fundamental problem in modern software engineering: **retaining and regenerating 100% accurate, deep technical truth directly from active source code repositories.**  
Eventually, this POC will evolve into a series of automated agentic tasks in **Gemini Enterprise**, triggered automatically when developer PRs are merged or deployments reach staging. The system uses specialized AST extraction tools to compile raw code facts into a standardized JSON graph, and subsequently processes this graph with advanced LLM agents using structured, architectural "Task Contracts" (e.g., rules, personas, work orders) to build high-fidelity documentation.  
---

## 2\. Completed Milestones & Accomplishments

### Phase 1: High-Fidelity Module Profiles & API References (100% Complete)

We successfully processed and generated documentation for **12 Cloud Module folders** under the active run ID 20260719-151741:

* **Modules:** access\_control\_device, admin, apps, building (reference), call, core, organization, settings, supplier, tasks, unit\_management, and user.  
* **Outputs Generated:**  
  1. **Module Engineering Profiles:** (Stored in output/runs/20260719-151741/engineering-profiles/). Follows the 14-section baseline of building-engineering-profile.md containing architectural position, Firestore schema ownership, permissions, and trigger summaries.  
  2. **API References:** (Stored in output/runs/20260719-151741/api-reference/). Contains detailed, pretty-printed JSON request/response schemas dynamically parsed from AST contract facts. Includes robust zero-API fallbacks for non-callable modules.

### Phase 2: Dynamic Git/GitHub Loading via SSH (100% Complete)

We refactored the pipeline from scanning a static local directory to dynamically loading and versioning remote repositories over SSH:

* **config/repos.json**: Upgraded to support gitUrl, branch, and commit configurations.  
* **00-scan-repo.ts (Dynamic Synchronizer)**:  
  * Wipes any existing clone folder on startup to ensure **100% branch purity** and prevent local cross-branch contamination or caching issues.  
  * Clones the repository fresh, resolves tracking for remote branches (e.g., staging, master), and pulls latest updates using the system's terminal SSH agent.  
  * Interrogates the checkout with git rev-parse \--short HEAD to dynamically extract the head commit SHA.  
  * Stamps the run ID with the format: YYYYMMDD\_HHMMSS-\[commit-sha\] (providing absolute auditability and version governance).

---

## 3\. Key Architectural Decisions & Rationale

* **Purity over Performance**: We decided to perform a full wipe and fresh clone on every pipeline run instead of incremental git pull updates. Because this corpus represents the absolute technical truth of the system, we cannot risk dirty states, local Git lockups, or stale untracked files polluting the synthesis.  
* **Decoupled Extraction / Centralized Synthesis**: Rather than building a monolithic AST parser, we chose a **Hub-and-Spoke model**. The core corpus repository acts as the Hub (holding global schemas, task contracts, and orchestrators). Each target repository acts as a Spoke, running its framework-specific native extractor (e.g., ts-morph for TS, SourceKitten for iOS, KSP for Kotlin) and exporting a uniform **Universal Evidence Graph (UEG)** back to the Hub for cross-repo linking.  
* **Decoupled API Reference**: We decoupled the API endpoint contracts from the main Engineering Profile into dedicated companion files under api-reference/ to keep document lengths concise, human-scannable, and highly targeted.

---

## 4\. Current Directory Structure & Topology

Your workspace on your machine is structured as follows:

* **Workspace root:** /Users/dopenshaw/documentation/level-5\_engineering\_knowledge  
* **Config file:** config/repos.json (defines git@github.com:oskey-io/firebase-oskey-dev.git on master).  
* **Primary pipeline scripts:** Located in scripts/knowledge-pipeline/ (00-scan-repo.ts, 01-extract-ast-evidence.ts, 02-build-module-evidence.ts, 03-build-benchmark.ts).  
* **AI Task Contracts:** Located in ai-runtime/contracts/module-engineering-profile/ (the active contract is phase-01-work-order-01.md).  
* **Cloned Sandboxes:** Downloaded temporarily to output/clones/cloud/ during execution.  
* **Generated Artifacts:** Stored in versioned directories under output/runs/.

---

## 5\. Roadmap & Next Steps

1. **Orchestrator Automation (Interactive \+ Headless)**:  
   * Implement an .agents/skills/knowledge-pipeline/SKILL.md workspace skill to let Antigravity run end-to-end extraction and profile generation interactively.  
   * Implement a headless script in scripts/ai-runtime/run-agent-contract.ts using @google/genai to call Gemini API directly in a terminal / CI context, making the entire Phase 1 execution fully unattended.  
2. **Phase 3: Dynamic Firestore Collection Resolution**:  
   * Upgrade 02-build-module-evidence.ts to dynamically extract collection rules and match paths directly from ai-runtime/contracts/docs/firestore.rules.txt or firestore-schema.md rather than using the hardcoded array, accommodating automated dev merges.  
3. **Phase 4: Cross-Repository Synthesis (Connecting the Spokes)**:  
   * Ingest the evidence graphs of ios-app (Swift) and node-iot (C++ / TS) to resolve cross-repository boundaries and construct end-to-end behavioral paths for device hardware.

---

## 6\. Bootstrap Prompt for Future Agents

*Copy and paste this block into any new LLM chat window (Claude, ChatGPT, or a fresh Gemini session) to instantly restore 100% of this session's context:*  
text  
You are an expert Enterprise Agentic Architect specializing in Corpus Knowledge Engineering.  
We are building the Oskey Engineering Knowledge Corpus POC.  
Our goal is to parse multi-repository, multi-language codebases (TypeScript, Swift, Kotlin, C/C++) using localized AST tools, output standard Universal Evidence Graphs (UEGs), and synthesize them into high-fidelity Engineering Profiles, API References, and cross-repo behavioral maps using AI Task Contracts.  
Please read our current workspace located at:  
"/Users/dopenshaw/documentation/level-5\_engineering\_knowledge"  
And specifically read the following core files to establish absolute context parity:  
1\. "/Users/dopenshaw/documentation/level-5\_engineering\_knowledge/config/repos.json" (Active Spoke repos configuration)  
2\. "ai-runtime/contracts/module-engineering-profile/phase-01-work-order-01.md" (Active AI Task Contract)  
3\. "scripts/knowledge-pipeline/00-scan-repo.ts" (Active Phase 2 Dynamic SSH Git Synchronizer)  
4\. The handover and architectural blueprint artifacts generated in your active brain directory.  
We have successfully automated Phase 1 (profiles and API references generated for 12 modules under run 20260719-151741) and completed Phase 2 (dynamic Git SSH cloning with 100% purity and runId commit-SHA versioning).  
Confirm your understanding of the architecture, the active codebase, and our completed milestones. Let's begin.  
