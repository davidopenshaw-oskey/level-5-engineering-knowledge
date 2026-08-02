# tasks & todos

1. remove hard coded paths, even from the repo, in the ast extraction
2. remove all of the hardcoded references, make it 100% dynamic
3. ensure all paths are relative for agentic running
4. governance/reference-docs (schemas, indexes, firestore rules, rbac roles) are currently manual snapshots — make these dynamically re-derived from the target repo when read in on P1
5. p2 synthesis artefact storage still needs a real answer from devops/engineering. `/output` stays gitignored (repo clones + raw facts belong there). Finished synthesis documents now write to `knowledge-corpus/<repo>/<runId>/...` (git-tracked, provisional) — but this is provisional, not the final decision, especially if this pipeline ends up running on Google's Gemini Enterprise agentic platform in CI/CD (output might belong in a cloud storage bucket instead).
6. LLM auth (Gemini via Vertex AI, Claude via Anthropic API key) is set up per-person, manually, on one machine — not yet reproducible by a teammate or in CI/CD. Needs: `gcloud` SSO + an explicit IAM grant per person for now; a service account or Workload Identity Federation for CI/CD later, once the item-5 platform question is settled.
7. P1 scripts (`00-scan-repo.ts` through `05-partition-capability-packs.ts`) are not easy for a new developer to jump into — needs a top-level README for `phase-01-ast-extraction/` explaining the script chain, plus a short "what this does and why" summary per script.
8. `knowledge-corpus/<repo>/<runId>/...` is deliberately LLM-agnostic (no provider/model in the path — see `00-generate-module-profile.ts`'s design notes), so running a second LLM_CONFIG_KEY against the same module/run overwrites the first provider's output. Need a design decision for side-by-side LLM comparison runs (candidate: a separate `output/` side-channel per llmConfigKey, promoted manually into the corpus once a winner is picked) — deferred, not decided.
9. `maxTokens: 65536` for `claude-default` (config/llm-providers.json) was set empirically 2026-08-01 by re-testing after a real truncation bug — confirmed sufficient for `tasks` and all of `building`'s calls, but not verified as a true ceiling for every possible call shape. If a future run throws `LLM_OUTPUT_TRUNCATED`, raise it further and re-verify by tail-checking output files, don't just suppress the error.
10. Add prompt/context caching (e.g. Anthropic's `cache_control`) for the grounding + contract docs in `llm-adapter.ts` — every one of the 32 Anthropic calls made 2026-08-01 resent the same ~150-200K tokens of grounding/contract-doc content uncached, which is very likely the dominant cost driver behind the $10+ burned testing this pipeline, independent of the truncation-bug waste.
11. Before implementing item 10: investigate whether Gemini (Vertex AI) and OpenAI also support context/prompt caching for the same supporting docs, and on what terms (API shape, minimum cacheable size, cache lifetime, cost model) — don't assume Anthropic's mechanism generalizes across all three providers in `llm-adapter.ts`.
12. We should think about the following files soon. They need to be dynamic. Looking at them, they might come out of the repo once its cloned. Maybe the schema comes from a script, the rbacs need to discuss
    - "governance/reference-docs/firestore-schema.md",
    - "governance/reference-docs/firestore.rules.txt",
    - "governance/reference-docs/firestore.indexes.json",
    - "governance/reference-docs/rbac-roles.json"
13. When hitting limitations wit hthe rbac.json, a point to discuss is that maybe we should focus on the composite roles rather than the granular roles within the llms. each composite contains the add, edit, delete, list, view anyway.
