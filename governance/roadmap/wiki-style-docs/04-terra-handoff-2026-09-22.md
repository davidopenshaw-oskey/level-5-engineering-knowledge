# Terra handoff: building-module inventory

## User intent

Investigate whether the current Postgres facts/embeddings/edges can support a wiki for Firebase's `building` module. First deliver only a small database inventory. The user is on ChatGPT Plus and prioritises conserving usage. No investigation has been run yet.

## Execute

Read and follow `prompts/prompt-2-building-postgres-evidence-audit.md` relative to this directory. It has been narrowed and is self-contained. It takes precedence over the broader sequence in `03-building-postgres-pilot-scope-2026-09-22.md` for this first pass. Do not load other roadmap files by default.

Suggested user-selected model: GPT-5.6 Terra, low reasoning for the inventory. Do not switch models or launch subagents. No paid project API calls or database mutations are in scope.

## Continuity

The local database was successfully restored and verified in the previous conversation. Connection and evidence limits are in the prompt. Earlier historical review concluded that the engineering-report purpose survives, while the old per-repo Phase 2 synthesis mechanism was superseded. Wiki retrieval feasibility remains unverified.

The previous thread's user-reported meter was 69% remaining for five hours and 94% for seven days; this is an old baseline, not the new session's current allowance. User should check again before and after the inventory. Starting a new chat does not reset account allowance.

Two planning files were created in the previous session and may still be uncommitted. Preserve unrelated changes. Write the requested SQL and findings, then stop at the inventory checkpoint.
