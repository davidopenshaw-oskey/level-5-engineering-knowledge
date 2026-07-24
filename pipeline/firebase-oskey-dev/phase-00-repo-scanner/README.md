# Phase 00: Repository Scanner (`/pipeline/phase-00-repo-scanner`)

This phase verifies repository clone purity, verifies git SHAs, and initializes the versioned execution context (`runId`).

---

## Contents

- `00-scan-repo.ts`: Script that scans the target repository clone, verifies git commit SHA, and generates `output/run-context.json`.
