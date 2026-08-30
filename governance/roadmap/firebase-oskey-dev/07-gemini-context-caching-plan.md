# Gemini Context Caching — Scope

**Status:** Scoped, not implemented. Firebase-only for now, same convention as V1-A/V1-B — port to Angular/Node-IoT later by principle, not by copying code, once this is proven on real runs.

## Why

Real measurement (not estimate) against this pipeline's own actual prompts and this session's real GCP billing: **~68% of tracked input tokens (weighted across 305 real capability calls and 80 real reduce calls) are an identical, repeated stable prefix** — the capability/reduce contract plus all 6 architectural grounding docs (RBAC roles, Firestore schema/rules/indexes, architecture doc, personas doc). Verified directly:

| Call type | Real example | Stable prefix | Stable % |
|---|---|---|---|
| Capability synthesis | `organization_prompt_templates`, 98 facts | 164,142 chars | 72.2% |
| Reduce, largest module | `organization`, 14 capabilities | ~166,231 chars | ~49% |

Gemini 3.5 Flash's real published pricing: $1.50/M standard input tokens vs **$0.15/M cached-content input tokens** (90% discount on a cache hit), plus $1.00/M tokens/hour cache storage (negligible at this scale — the same ~44K-token stable prefix gets reused across dozens to hundreds of calls within a run). Applied to the real billing screenshot reviewed this session (€45.14 for 34.28M input tokens): caching the stable portion would have cut the input bill by roughly 61%, and the combined input+output bill by roughly 37%.

Separately (already logged, not part of this task): ~66% of billed *output* tokens are untracked by this pipeline's own notification log, because the retry wrapper in `llm-adapter.ts` only logs usage for the attempt that finally succeeds. That's a distinct problem (visibility, not cost-reduction) — see the discussion this session; not folded into this plan.

## What exists already vs. what's missing

- `capability-synthesis.ts`'s `buildCapabilityPrompt()` already splits every capability-call prompt into `stableSections` (contracts + grounding docs + module list) and `variableSections` (evidence pack + schemas + output format), joined with `CACHE_BREAKPOINT_MARKER`. This split is real and correct — it's just never consumed as an actual caching boundary for Gemini today.
- `llm-adapter.ts`'s `callAnthropic` consumes the same marker for real, placing an Anthropic `cache_control: { type: "ephemeral" }` breakpoint. `callGemini` just does `prompt.split(CACHE_BREAKPOINT_MARKER).join("")` — strips it as a no-op, confirmed by its own code comment ("Vertex AI's own caching mechanics are unresearched... this is a safe no-op fix, not a caching implementation for Gemini").
- `01c-generate-assembly-first-profile.ts`'s reduce-call prompt (`reduceSections.join(...)`) has **no marker at all** — the stable/variable split for reduce calls doesn't exist yet and needs to be added first.

## Real API surface (verified against the installed `@google/genai` package, not assumed)

`ai.caches.create({ model, config: { contents, systemInstruction, displayName, ttl } })` → returns a `CachedContent` with a server-generated `.name` resource identifier. A later `generateContent` call passes `cachedContent: <that name>` in its `config` instead of resending the cached text — confirmed field on the same config type `callGemini` already builds (`GenerateContentConfig.cachedContent?: string`). `ai.caches.get`/`list`/`delete` also exist for lookup and cleanup.

## The real design problem: cache lifecycle across process boundaries

This pipeline deliberately runs each capability call as its own OS process (`01d` is one-pack-per-invocation; `01a` loops packs within one process per module; `01c` is one-call-per-invocation). A cache must be **created once and reused by name** across many separate process invocations sharing the same stable content — not recreated per call (that would add a network round-trip and defeat the point) and not shared blindly (a stale cache serving outdated contract/grounding-doc text would be a real correctness bug, not just a cost issue).

Proposed mechanism:
1. **Cache key = a content hash of the exact stable-prefix text** (not just "capability contract" as a label) — so a single-character contract or grounding-doc edit produces a different key and never silently reuses a stale cache.
2. **A small on-disk cache registry per run**: `output/runs/<repo>/<runId>/gemini-cache-registry.json`, mapping `{contentHash: {cacheName, expireTime}}`.
3. **`callGemini`'s caching path**: given a prompt containing `CACHE_BREAKPOINT_MARKER`, split it; hash the stable part; look up the registry — if a live (non-expired) entry exists, pass `cachedContent` and send only the variable part as `contents`; if not, call `ai.caches.create()` with the stable part as `contents`, write the new entry to the registry, then proceed with the call.
4. **TTL sized to the expected batch duration**, not the default — a 12-module full-repo run doing hundreds of sequential capability calls needs a TTL comfortably longer than the batch's real wall-clock time (confirmed empirically: today's 63-call experiment took long enough that a short default TTL would have expired mid-run and silently fallen back to full-price calls, which is safe but defeats the purpose — needs a real measured number, not a guess).
5. **Concurrency note, not solved now**: every call in this pipeline today runs sequentially (even within `01a`'s per-module loop), so a simple "check registry, create-if-missing" has no race condition yet. If calls are ever parallelized in the future, this needs a real lock or an atomic create-if-not-exists pattern — flagged, not built, since it isn't needed by anything that exists today.

## Required code changes

1. `01c-generate-assembly-first-profile.ts`: split `reduceSections` into stable (Supporting Contracts + Architectural Grounding Documents + module list) and variable (everything module-specific: graphs, RBAC catalog, unresolved edges, per-capability extracts, generation metadata) with `CACHE_BREAKPOINT_MARKER`, mirroring `buildCapabilityPrompt()`'s existing split. Same treatment likely needed for `01a`/`01d` — already done via `capability-synthesis.ts`, just needs verifying nothing since-added (RBAC catalog additions, etc.) broke the boundary.
2. New shared module (e.g. `_shared/gemini-cache.ts`): content-hash the stable prefix, read/write the run-scoped registry file, wrap `ai.caches.get`/`create`.
3. `callGemini` in `llm-adapter.ts`: replace the current strip-and-ignore behavior with real cache lookup/creation/reuse, only when the marker is present (falls back to today's exact behavior — full prompt, no caching — if it isn't, so nothing breaks for any caller that hasn't been updated to split its prompt).
4. Verify empirically (real, cheap test call) rather than assume: Vertex AI's minimum cacheable content size for `gemini-3.5-flash` (our stable prefix is ~44K tokens, comfortably above any plausible minimum, but should be confirmed rather than assumed) and real cache-creation latency (affects whether the first call in a batch should eat that cost inline or whether a cache should be pre-warmed as an explicit step before fan-out).

## Verification plan before trusting this on a real paid run

Same discipline as everything else this session: `tsc --noEmit` clean, then a real small-scale test — a handful of real calls sharing one cache, checked against `usageMetadata.cachedContentTokenCount` (already instrumented and logged today, currently always empty/undefined for Gemini) to *prove* the cache hit happened and measure the real token/cost delta directly from Google's own reported numbers, not just from this plan's projected estimate. Only after that succeeds does it make sense to run a larger real batch under it.

## Explicitly out of scope for this task

- Output-token retry-visibility gap (separate, already logged).
- Anthropic/OpenAI caching changes — `callAnthropic` already has real caching; `callOpenAI` isn't measured here.
- Porting to Angular/Node-IoT's own pipeline copies.
- Any change to what gets cached (still just contracts + grounding docs) — no attempt to cache per-module content across runs, which would reintroduce exactly the staleness risk the content-hash keying above is designed to avoid.
