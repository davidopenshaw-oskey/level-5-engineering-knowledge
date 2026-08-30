# Simulated Prod-Merge Test — 2026-08-29

**Status:** Complete. All 3 repos processed successfully; all 3 cross-repo triggers produced stable, identical results.
**Scope:** Simulated the sequence: Firebase merges to Prod → its full pipeline runs → cross-repo refresh fires. Then Angular. Then Node-IoT. Each repo's "full run" = fresh Phase 1 (re-clone + AST extraction, zero-LLM) → full Phase 2 (`03-run-full-phase2.ts`: `01a` per module, `01c` per module, `02` repo report — all real LLM calls, `LLM_CONFIG_KEY=gemini-default`) → `06-build-cross-repo-graph.ts`.
**Total real LLM spend:** Firebase ~74 calls (12 modules, 61 capability packs), Angular 35 calls (3 modules, 31 packs), Node-IoT 8 calls (1 module, 6 packs) — **117 real calls**, plus several retried capabilities during recovery (see Anomalies).

---

## 1. Overall Timeline

| Step | Start (UTC) | End (UTC) | Wall-clock duration |
|---|---|---|---|
| **Firebase** — Phase 1 | 08:15:53 | 08:16:03 | 10s |
| **Firebase** — Phase 2 (first attempt, failed) | 08:16:03 | 08:46:37 | 30m34s → **FAILED** |
| **Firebase** — Phase 2 (resumes 1-5, see §3) | 09:03:09 | 13:39:01 | ~4h36m (mostly dead time from 5 stalled/failed calls) |
| **Firebase** — Cross-repo trigger #1 | 13:39:01 | 13:39:02 | 1s |
| **Angular** — Phase 1 | 13:39:02 | 13:39:08 | 6s |
| **Angular** — Phase 2 | 13:39:08 | 13:57:44 | 18m36s — **clean, zero failures** |
| **Angular** — Cross-repo trigger #2 | 13:57:44 | 13:57:44 | <1s |
| **Node-IoT** — Phase 1 | 13:57:44 | 13:57:49 | 5s |
| **Node-IoT** — Phase 2 | 13:57:49 | 14:01:36 | 3m47s — **clean, zero failures** |
| **Node-IoT** — Cross-repo trigger #3 | 14:01:36 | 14:01:37 | 1s |

**Total simulation wall-clock time:** 08:15:53 → 14:01:37 = **5h45m44s**, of which roughly **4h45m was dead time from the Firebase failures** (see §3). With the fix applied partway through, Angular and Node-IoT together (~22m of real LLM work) ran with zero incidents.

---

## 2. LLM Call Statistics (duration + token usage, from each run's `run-notifications.json`)

| Repo | Calls recorded | Duration min/avg/max | Total input tokens | Total output tokens |
|---|---|---|---|---|
| Firebase | 55* | 15.4s / 36.3s / 93.6s | 4,541,136 | 173,942 |
| Angular | 35 | 11.9s / 31.8s / 60.4s | 2,049,870 | 129,300 |
| Node-IoT | 8 | 9.0s / 28.3s / 39.0s | 244,050 | 20,665 |

*Firebase's notification log dedupes by a stable ID per capability — a capability called more than once across resumes only keeps its last successful attempt's timing, so 55 is the count of distinct capabilities with a final successful timing recorded, not the count of every attempt made (74 successful writes were confirmed on disk; the gap is retried capabilities whose earlier failed/duplicate timing entries were overwritten, not lost work).

Slowest individual calls were all `01c` reduce calls or capabilities with unusually large evidence packs — e.g. Firebase's `organization_user_access` (93.6s, but only 45,653 input tokens — an outlier worth another look) and `admin_maintenance` (66.9s, 185,325 input tokens, the single largest prompt of the run). Angular's slowest calls were consistently the deepest-nested `portals_organization_entities_entity_properties_*` capabilities, matching their large fact counts.

---

## 3. Anomalies on Repo Runs

### 3.1 Recurring transient LLM call failures (Firebase only) — the major finding

**Five identical failures** occurred during Firebase's Phase 2, all with the same error: `[LLM_CALL_FAILED] Gemini (Enterprise Agent Platform) request failed: fetch failed`.

| # | Stage / call site | Started | Failed | Duration to failure |
|---|---|---|---|---|
| 1 | `01a`, module `core` (pack `access`) | 08:16:03 | 08:46:37 | ~30m (whole-module batch) |
| 2 | `01a`, module `core` (pack `access`, retry) | 09:03:09 | 09:19:26 | ~16m17s |
| 3 | `01a`, module `user` (pack `user_settings`) | 09:56:33 | 10:19:42 | ~23m (whole-module batch) |
| 4 | `01c`, module `access_control_device` | 10:52:25 | 11:08:57 | ~16m32s |
| 5 | `01c`, module `admin` | 11:58:52 | 12:16:22 | ~17m30s |

**Investigation, in order:**
- **First hypothesis (oversized single pack)** — ruled out. Failure #2 recurred on the exact same pack (`core/access`, 743 facts / 1.3MB, the largest pack in `core`), but failure #3 hit a completely different module/pack (`user/user_settings`), and failure #4/#5 hit `01c` reduce calls, not `01a` capability calls at all. Not content- or size-specific.
- **Second hypothesis (concurrent load from the Node-IoT peer session sharing the same Vertex AI project)** — checked directly with that session and ruled out. Its real calls ran 07:44:47Z–07:53:07Z, all successful, ending 23+ minutes before this session's first failure at 08:46:37Z. No overlap.
- **Third hypothesis, and the one acted on**: no explicit request timeout was configured on the Gemini calls (`_shared/llm-adapter.ts`'s `callGemini`), and the `@google/genai` SDK's own default retry behavior (`p-retry`, 5 attempts, exponential backoff, **429 Too Many Requests included in its default retryable-status list**) could itself be triggering internally on rate-limit responses — but each of those internal attempts had no fail-fast ceiling, so a rate-limited request could hang far longer than the SDK's nominal backoff schedule implies. The consistent ~16-17 minute failure window (too regular to be pure network flakiness) is best explained by this combination, not by either cause alone.
- **User's follow-up question raised the rate-limiting angle explicitly** — confirmed genuinely plausible (not ruled out) after inspecting the SDK source directly: `DEFAULT_RETRY_HTTP_STATUS_CODES` does include 429, and Google's own doc comment on the SDK's `seed` parameter separately confirms Gemini responses are "not a guaranteed absolute deterministic behavior" even with fixed sampling settings — consistent with a system genuinely under some queuing/throttling pressure during heavy sustained real-call volume, not a purely local bug.

**Fix applied** (`pipeline/{firebase-oskey-dev,angular-app-oskey-io,node-iot-api-oskey-io}/phase-02-inter-module-synthesis/_shared/llm-adapter.ts`, identical in all three): added an explicit `httpOptions.timeout: 180_000` (3 min) to the `generateContent` call, wrapped in an outer loop of up to 3 attempts. `tsc --noEmit` clean; `git diff` confirmed only the three `llm-adapter.ts` files changed. **Effective immediately after applying**: `admin`, `apps`, `building`, `call` (the next four `01c` calls) all succeeded in 30-45 seconds each with zero retries logged, and Angular's and Node-IoT's entire Phase 2 runs (43 more real calls combined) completed with **zero further incidents**.

**Known limitation of the fix, not yet exercised**: the outer 3-attempt retry loop added has no delay between attempts. If the root cause really is sustained rate-limiting/quota pressure rather than a one-off blip, firing 3 attempts back-to-back immediately after the SDK's own internal backoff is exhausted could add load at exactly the wrong moment. This hasn't been tested under a genuine sustained-quota-exhaustion scenario — worth watching on the next large real run.

**Recovery cost**: the resume process this run needed averaged ~15-20 minutes of manual "check log → identify failed unit → retry it → resume the loop" cycle per incident, done by hand five times before the fix landed. No data was lost or corrupted at any point — `01a`/`01c` only write output after a successful call, so every resume was clean.

### 3.2 Follow-up idea raised, not yet built (per your steer — after this test)
Two config-level resilience additions were proposed and deliberately deferred to a dedicated design discussion rather than built mid-run:
- **Wait prior to retry** (backoff delay between the outer loop's attempts) — directly addresses the risk noted above.
- **Wait prior to next LLM call** (a deliberate pacing gap between every successive call, not just after failures) — preventative rather than reactive; keeps sustained call volume under whatever the real rate ceiling is, rather than only reacting after tripping it.

Framing agreed with the user: this pipeline is closer to a scheduled batch job than an interactive tool — no reason to optimize for speed over reliability at this stage (POC), and both settings should be real, named values in `config/llm-providers.json` (alongside `maxTokens`/`temperature`), not hardcoded constants.

### 3.3 LLM output variance (not a pipeline bug, but a real characteristic worth tracking)
Separately, a same-day diff of Firebase's fresh corpus (`20260829_081559-00e1d9fd`) against the prior stable run (`20260827_163338-1aa319b1`) — same 12 modules, same facts, same contracts — found:
- Citation density swung -42.9% to +36.4% across modules (consistent with an earlier, independent finding of -29%/+86% swings on a different pair of runs — confirms this is a real, recurring effect of the pipeline, not a one-off).
- Zero fabricated citations in either run, across all 12 modules — the swings are in *density and selection*, not accuracy.
- One module (`apps`) showed genuinely different substantive findings between runs, not just rewording: 2 of 4 cross-cutting risks were new in the later run with no equivalent in the earlier one, and one risk from the earlier run was entirely absent from the later one. Both sets were independently well-grounded against real evidence.
- No evidence of a structural "thin partition" bug — the smallest-citation modules were consistently the smallest in both runs.

**Practical implication**: a single run's Risks/Open Questions section should not be treated as exhaustive — a second run on identical facts can surface real findings the first one missed, or vice versa. This doesn't affect factual accuracy (nothing fabricated either time), only completeness/emphasis per run.

---

## 4. Anomalies After the Cross-Repo Runs

**None — all 3 triggers produced identical, stable output**, despite each one firing right after a different repo's Phase 1 had just been freshly refreshed:

| Trigger | Firebase runId used | Angular runId used | Node-IoT runId used | Resolved | Unresolved | Total edges |
|---|---|---|---|---|---|---|
| #1 (after Firebase) | `20260829_081559` (fresh) | `20260828_150039` (stale) | `20260828_165412` (stale) | 98 + 1 | 4 + 15 | 118 |
| #2 (after Angular) | `20260829_081559` | `20260829_133905` (fresh) | `20260828_165412` (stale) | 98 + 1 | 4 + 15 | 118 |
| #3 (after Node-IoT) | `20260829_081559` | `20260829_133905` | `20260829_135747` (fresh) | 98 + 1 | 4 + 15 | 118 |

Every number is identical across all 3 triggers. This is expected and reassuring, not a sign the pipeline ignored the fresh data — the underlying source code was effectively unchanged across these same-day re-runs (same `staging` branch, no real merges happened in between), so a stable join is the correct outcome, and it confirms the deterministic cross-repo join logic itself introduces no run-to-run noise the way the LLM-based sections do.

**Known, accepted gap, not a new anomaly**: the `PUBSUB_TOPIC_BINDING` join (Node-IoT↔Firebase) resolves exactly 1 of 16 real publish-call sites — the one manually confirmed pairing (`accessControlDevice_activities` ↔ `processPubSubMessage`). The other 15 (14 from Firebase's own internal publish calls, 1 from Node-IoT) are honestly reported as unresolved because no external GCP-subscription-config binding has been independently confirmed for them — this is a known capability boundary of AST-only extraction (the binding lives in GCP config, not source), not a bug to chase further without new evidence.

---

## 5. What Changed in the Codebase This Run

- `pipeline/{firebase-oskey-dev,angular-app-oskey-io,node-iot-api-oskey-io}/phase-02-inter-module-synthesis/_shared/llm-adapter.ts` — added the retry-with-timeout wrapper described in §3.1. Identical in all three.
- All 3 repos' `knowledge-corpus/` now have a fresh, complete Phase 2 output set (module profiles, API references, repo reports) from today's runs, alongside the prior runs (nothing was deleted).
- `output/cross-repo-synthesis/` has 3 new synthesis snapshots (`20260829_133902`, `20260829_135744`, `20260829_140137`), each identical in content per §4.

## 6. Recommended Follow-Ups

Split deliberately into two phases — the first is hardening/extending the current pipeline; the second is a genuinely different kind of work (the pipeline watching *itself*) that belongs later, once the synthesis pipeline itself is mature and stable.

### 6.1 This phase — pipeline hardening and grounding-data quality

1. Design and build the two rate-limiting resilience config options from §3.2 (backoff-before-retry, pacing-before-next-call) as real `config/llm-providers.json` settings, framed as a batch job prioritizing solidity over speed, not an interactive tool.
2. Watch whether the 3-attempt-no-delay retry added today causes tighter failure clustering on a future large run before assuming it's sufficient on its own.
3. LLM output variance (§3.3): a full-scale `temperature: 0` run (`gemini-default-temp0`, `COMPARISON_MODE=true`, same facts as today's baseline) was started same-day as this report to test whether it measurably reduces the citation-density/finding-selection swing — see the live task for results. Google's own SDK docs already caveat that even a fixed `seed` is "not a guaranteed absolute deterministic behavior," so full elimination isn't expected, only reduction.
4. Few-shot calibration examples: add as a separate, included contract file (e.g. `contracts/00a-capability-synthesis-examples.md`), referenced from `config/repos.json`'s existing `capabilitySynthesisContractPaths` array — that array already supports multiple files, so this needs no new loading mechanism. Start with one repo-scoped, provider-agnostic file; only fork per-provider if a real (not assumed) provider-specific calibration gap is observed.
5. **Step 0 — dynamically refresh grounding docs at pipeline start**, replacing the hand-maintained copies in `governance/reference-docs/` (one of which, `firestore.rules.txt`, was confirmed today to have already drifted from the real source — two extra header lines and a copyright-line typo not present in the actual file). Three tiers by mechanism:
   - **Free file copy from the fresh clone** — `firestore.rules`, `firestore.indexes.json` (confirmed today: the indexes file is currently byte-identical to the real clone; the rules file already isn't).
   - **Live query against running infrastructure, not the git clone** — `rbac-roles.json` (the real source of truth is the live Firestore document at `settings/roles`, not the `composite_role.data.ts` seed file used to originally populate it — that seed file is stale-by-design once production data diverges), `firestore-schema.md` (recursive live sampling of real collections/subcollections/fields — a home-made script reportedly already exists for this and produced the current governance copy; worth locating/reviving rather than rebuilding), and the Pub/Sub topic/subscription inventory (a live GCP Pub/Sub Admin API call, same ADC identity already used for Gemini/Vertex).
   - **Pure hand-authored, no live source at all** — `Oskey Architecture.md`, `Oskey Personas and Authority models.md`. Stay manually maintained; nothing to sync from.
6. `web-admin`'s Phase 2 and Node-IoT's own repo-wide RBAC/subsystem framing (already deliberately simplified per its single-domain structure) are the remaining gaps before all 3 repos are at full parity with Firebase's original maturity level.

### 6.2 Later phase — operational maturity (the pipeline watching itself)

Explicitly scoped as a *different* phase, not a near-term task — this is about the system proactively monitoring its own outputs and the repos it watches, which presupposes the synthesis pipeline itself (6.1) is already stable:

- Agents/code that proactively check target repos and pipeline results *after* runs complete, without a human needing to trigger or review them manually.
- Automated notifications sent on run completion (success, failure, or notable anomaly), rather than requiring someone to tail a log.
- Drift detection and warnings as a standing capability, not a one-off manual check — concrete examples already surfaced today that this phase would need to catch automatically: `firestore.rules.txt`'s existing drift from the real source, a seed-data-vs-live-Firestore-document RBAC mismatch (composite_role.data.ts vs. the real `settings/roles` document), or a Pub/Sub topic referenced in code that no longer corresponds to any live subscription (the pattern already found in Firebase's commented-out `onPublish` block).

---

## 7. Post-Report Follow-Up (2026-08-29, later same day)

### 7.1 Temperature-0 variance experiment — concluded, negative result

Two full Firebase Phase 2 runs (`gemini-default-temp0`, `gemini-default-temp0-run2` — both `temperature: 0.0`, `COMPARISON_MODE=true` against the same facts) were diffed directly against each other, the correct test for "does temp 0 improve self-consistency" (comparing either one against the temp-0.2 baseline instead would only show that two different sampling strategies produce different output, which was never in question).

**Result: temperature 0 did not reduce variance.** Citation-count deltas between the two temp-0 runs ranged from -22.7% to **+418.2%** (`supplier`: 11 → 57 citations) and +73.9% (`unit_management`) — larger swings than either temp-0.2-vs-temp-0.2 comparison found earlier (-42.9%/+36.4% and -29%/+86%). Sanity-checked the `supplier` extreme directly: both documents are substantial (453 vs. 532 lines), neither truncated or empty — this is real content variance, not a broken-output artifact. Consistent with the SDK's own documented caveat that a fixed sampling setting doesn't guarantee determinism, but a stronger negative result than "some residual variance" was expected to be.

**Practical implication**: parameter tuning is not the lever that fixes citation-selection variance. This makes the few-shot calibration idea (§6.1 item 4) and the workflow-documentation direction (§7.3) relatively more important, since both address *what the model chooses to notice*, not the sampling mechanism around it. `seed` remains untested — not expected to change this conclusion given temperature 0 alone didn't, but not yet ruled out directly.

### 7.2 New bug found and fixed: `01d-regenerate-single-capability.ts` had no `COMPARISON_MODE` support

While recovering from a transient timeout failure mid-way through the temp0-run2 test, a manual single-capability retry (`01d`, intended for the comparison-mode path) silently wrote into the **canonical `gemini-default` baseline's** capability-synthesis folder instead — `01d` had no `COMPARISON_MODE` handling at all, unlike `01a`/`01c`/`02`. This corrupted 8 capability-synthesis files in the canonical Firebase baseline (`organization_onboarding_inhabitant` plus 7 more from a batch retry loop) with temp0-run2 content before it was caught.

**Contained, not consequential**: the already-*assembled* `organization-engineering-profile.md` was generated earlier in the day, before the corruption occurred, so the finished corpus artifact was never affected — only the intermediate per-capability files, which only matter if `01c` is re-run for that module again.

**Fixed**: all 8 corrupted files copied to their correct comparison-mode path (preserving the temp0-run2 data), then regenerated fresh under the true `gemini-default` config to restore the canonical baseline — verified via provenance (`llmConfigKey` now correctly reads `gemini-default` on all 8). `01d-regenerate-single-capability.ts` fixed identically in all 3 repos to add the same `COMPARISON_MODE` branching `01a` already has — `tsc --noEmit` clean, diff confirmed isolated to the 3 `01d` files. This closes a real gap: any future single-capability regen under a non-canonical config would otherwise always corrupt the canonical baseline it's meant to be compared against.

### 7.3 Strategic redirection: is the next layer "landscape reduce" or workflow documentation?

A significant discussion, prompted by the user stepping back to check this work against the project's actual charters (`governance/charters/00-knowledge-governance-charter.md`, `02-phase2-architecture-synthesis-charter.md`) rather than assuming the next logical *mechanism* was the next logical *deliverable*.

**Key charter lines**: "The objective is not to produce documentation... Documents are one representation of that knowledge." And: the Architecture Knowledge Layer is meant to support "multiple specialist AI agents **rather than a single document generation workflow**" — with retrieval systems and an explicit, named **"Connected Workflow Graph"** deliverable, neither of which exist today.

**Conclusion so far**: the "landscape-level reduce" (repo → ecosystem, the natural extension of the existing module→repo reduce pattern, and the item originally flagged as the confirmed next gap earlier in this doc) is a real but narrower-value addition — mostly an executive-overview document — not what the charter is actually pointing at as foundational. Workflow documentation was tested directly against a real example (adding a new RBAC role) and concretely validated: Angular's role-assignment page (`portals_organization_entities_entity_properties_users`) was already correctly and fully described in today's corpus, but nothing connects it to Firebase's `createCompositeRoles` flow as one process — a human or agent has to already know to look in both places. That's precisely the gap a Connected Workflow Graph closes, and — unlike the landscape reduce — it doesn't need new Phase 1 extraction, only a new synthesis pass over facts that already exist.

Two other real, non-obvious findings surfaced live during that same investigation, worth carrying forward as concrete examples of what workflow-level synthesis should catch automatically:
- `createCompositeRoles`'s original permission gate (`accessControlDevice.publicKey.maintain`) is commented out — any authenticated user can currently call it.
- Firebase's own dedicated cross-repo contract type for Node-IoT (`api/node-iot-api/models/access_control_device_config.model.ts`) is an unfilled stub (`{ dummy: string }`), while Node-IoT independently maintains its own ~15-field version of the same concept with no code-level link between them — schema alignment for this document relies entirely on manual coordination.

**Not yet decided**: whether to build a first workflow-graph proof (e.g. an "RBAC Role Lifecycle" doc, assembled from already-existing capability descriptions) before committing to the general mechanism, or design the mechanism directly. Landscape reduce and broadening the cross-repo join are both on hold pending this decision, since their value depends partly on which direction wins.
