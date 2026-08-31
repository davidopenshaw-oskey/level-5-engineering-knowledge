# V1-A/V1-B Factorial Experiment — Results

**Status:** Analysis complete. Pure read-and-compare over already-generated output at `output/runs/firebase-oskey-dev/20260829_081559-00e1d9fd/llm-comparison/`. No new LLM calls made for this analysis.

**Update 2026-08-30 (task 17o closeout, see `tasks.md` item 17):** both defects flagged below as blocking a fair read of arms B/AB are now fixed in the live codebase — the `organization_entity` Section 3 misassembly (`selectRealSectionMatches()` in `_shared/document-sections.ts`) and the empty-cross-cutting-content failure on `b-run2`/`ab-run1` (detect-and-retry loop in `01c-generate-assembly-first-profile.ts`, `MIN_JUDGMENT_SECTION_CHARS`/`JUDGMENT_SECTIONS_TO_VERIFY`, covering exactly Sections 9 and 13). Both fixes landed after the 63 calls below were made, so the samples here reflect the pre-fix failure mode, not current behavior. Treat the findings below as historical evidence for what was broken, not as a current characterization of B/AB.

**Update 2026-08-30, part 2 (B/AB re-run against the current codebase):** re-ran exactly the 4 previously-broken/questionable `organization` cells (`b-run1`, `b-run2`, `ab-run1`, `ab-run2`) with no code changes since the fixes above — same facts, same commit (`00e1d9fd`), same `CAPABILITY_SOURCE_CONFIG_KEY` inputs as the original experiment. See `## Re-run: B/AB content-omission fix verification` below for full results. Headline: **the content-omission failure did not recur in any of the 4 cells** — Section 9 and Section 13 were fully populated in all four, and no retry even fired (first-attempt output was already healthy), so this can't be attributed with certainty to the detect-and-retry mechanism specifically rather than other codebase changes made since (compact table encoding, footnote citations) that may have reduced prompt/attention pressure. With the failure gone, both B and AB now show **~100% named-finding overlap for Section 9** (run1's named findings are a strict subset of run2's) — matching Arm A's original result almost exactly. Section 13 remains mixed (~100% overlap on the deterministic unresolved-call-edge content across all 4 cells; partial overlap, comparable to Current's and A's original baselines, on the non-deterministic risk narrative) — consistent with the original finding that no arm clearly wins Section 13.

---

## Executive Summary

Section 3 (Public Interfaces) is confirmed deterministic across 18 of 19 sampled capability packs, but one pack (`organization_entity`, cap-run2) shows a genuine pipeline defect where the deterministic content was misassembled into Section 2 instead, leaving Section 3 empty — this is a code bug, not LLM variance, and should be fixed before trusting Section 3's "100% deterministic" claim unconditionally. Arm A (new capability contract) shows a real, substantial reduction in Section 9 named-finding variance versus Current for the `organization` module (roughly 4/4 vs ~1/3 named-finding recurrence), but this improvement does not clearly extend to Section 13, and Section 6's ownership conclusions were already highly stable under the old contract (a null result for the reduce-contract's Section 6 fix). The most significant and unexpected finding is a **content-omission failure specific to arms B and AB on the `organization` module**: in 2 of 4 sampled reduce runs (`b-run2`, `ab-run1`), Sections 9 and 13's cross-cutting synthesis paragraphs are completely empty (header present, zero content) even though the per-capability evidence sections around them are fully populated — a failure mode never observed in Current or A, and never observed on the smaller `tasks`/`apps` modules under the same new reduce contract. This suggests the new reduce contract's added deterministic tables (RBAC catalog, unresolved call edges) may cause synthesis failures specifically at high capability-count (module-size-dependent), which is a more serious and more actionable finding than incremental variance reduction.

---

## Task 1: Capability-Stage Self-Consistency (cap-run1 vs cap-run2)

### 1a. Section 3 (Public Interfaces) — deterministic-assembly sanity check

Checked all 19 packs (not just the required 6): `tasks/_module_root`, all 4 `apps` packs, all 14 `organization` packs.

**Result: 18 of 19 packs identical (content-equal, modulo a cosmetic `##` vs `###` heading-level difference that appears in about half the packs but carries no content difference).**

**The one exception, flagged prominently as instructed: `organization/capability-syntheses/organization_entity.md`.**

In cap-run1, Section 3 contains the expected deterministic class/method list:
```
### 3. Public Interfaces (Controllers & Entry Points)
- **OSKEntityController** (Controller) ``source_class|organization|...|OSKEntityController``
  - `delete` ``controller_method|...|OSKEntityController|delete|#1``
  ...
- **OSKEntityService** (Service) ``source_class|...|OSKEntityService``
  - `assignSubEntityToParent` ...
```

In cap-run2, the real Section 3 is **empty**, containing only the placeholder:
```
### 3. Public Interfaces (Controllers & Entry Points)
*(This section is generated deterministically by the calling script from source facts. No manual synthesis is written here.)*
```

Investigating further revealed **why**: in cap-run2, the LLM's own Section 2 content included a sub-heading the LLM wrote itself, numbered `#### 3. Entity Dashboard Statistics Aggregation`. The deterministic assembly script — which locates "Section 3" to inject the class/method list — appears to have matched on this coincidental `3.`-numbered sub-heading inside Section 2 rather than the real `### 3. Public Interfaces` heading, and injected the entire deterministic controller/service list there instead:

```
#### 3. Entity Dashboard Statistics Aggregation

- **OSKEntityController** (Controller) ``source_class|organization|...``
  - `delete` ...
  [... full deterministic Section 3 content, misplaced ...]
```

This is a **pipeline/code bug in the section-boundary matching logic**, not LLM content variance — the assembly step is supposed to be 100% deterministic, and in this one case it silently placed its output in the wrong location while leaving the real target section empty. Recommend fixing the section-matching to anchor on heading level and position (e.g., only match the top-level document sections, not any digit-prefixed sub-heading) before treating Section 3 as unconditionally solved. This is exactly the same class of bug this analysis's own extraction script hit and had to be fixed for (see below) — a coincidental digit match on the wrong heading level.

### 1b. Section 2 (Primary Responsibilities) — semantic containment

Compared the same 6 packs (`tasks/_module_root`, `apps/mail`, `apps/qr_code`, `organization/organization_intercom_ communication`, `organization/organization_building`, `organization/organization_user_access`) plus `organization_entity` (given the Section 3 anomaly there).

| Pack | Responsibilities (run1 → run2) | Containment |
|---|---|---|
| `tasks/_module_root` | 2 → 4 | High — same facts, different grouping |
| `apps/mail` | 3 → 3 | High, with one concrete gap |
| `apps/qr_code` | 2 → 2 | Near-total |
| `organization_intercom_ communication` | 5 → 5 | **Partial — two named responsibilities diverge** |
| `organization_building` | 4 → 3 | **Partial — one responsibility dropped** |
| `organization_user_access` | 1 → 1 | Near-total |

**`tasks/_module_root` (2 vs 4 — regrouping, not fact loss):** run1 groups "Task Execution Handling & Routing" as one responsibility covering all three `taskType` branches (`refreshPincodeTask`, `activateIntercomCommunicationTask`, `deactivateIntercomCommunicationTask`); run2 splits this into three separate responsibilities ("Task Execution Dispatching," "Pincode Refresh Worker Orchestration," "Intercom Communication State Worker Orchestration"). Every named fact (the HTTP endpoint, the three routed task types, the two downstream services) appears in both runs — this is pure grouping-granularity variance, not evidence-engagement loss.

**`apps/mail` (concrete gap found):** run1 explicitly names the Mailtrap secret retrieval: *"It retrieves SMTP credentials (specifically the Mailtrap API key) securely using the `OSKSecretService`"* with citation `call_expression|...|OSKSecretService.getSecret|send|OSKApiName.MailtrapPassApiKey|#1`. Run2's equivalent responsibility ("Nnodemailer SMTP Integration" — note the run2 typo) says only *"Configures and manages an SMTP transport client using the `nodemailer` library to send emails via port 587"* — **the `OSKSecretService`/Mailtrap-key evidence is entirely absent from run2**. Everything else (recipient validation, domain whitelisting, the 7 named templates, Firestore log persistence/schema) matches across runs. Roughly 8/9 distinct facts recur; the secret-retrieval mechanism is the one real miss.

**`organization_intercom_ communication` (the most complex organization pack) — the clearest Section 2 divergence found:** run1 names 5 responsibilities: Create/Schedule, AI Translation/Reformulation, Resident Notification Fan-out, Transactional State Management/Archiving, and **"Deleting Communications"** (deletion from hot storage or archive, with evidence lines 1666-1751). Run2 also names 5 responsibilities, largely overlapping on the first four, but **entirely omits "Deleting Communications"** and instead names **"Multi-Level Communication Querying"** (query interfaces scoped by `v1.org.communications.list`/`.view` permissions, entity/property hierarchy resolution, lines 690-925) — a responsibility **entirely absent from run1**. Both are real, evidenced, distinct capabilities of this class; each run's bounded-traversal missed one of them. This is a concrete counter-example to full Section 2 stability even under the new bounded-traversal contract — consistent with the scope doc's own framing of Section 2 as "still a hypothesis, not yet proven."

**`organization_building` (a dropped responsibility, confirmed not a fact-availability issue):** run1 names 4 responsibilities including "Retrieve Specific Organization Building Details" (the `getOrganizationBuildingById` callable, enforcing `v1.org.buildings.view` on a single-building fetch, distinct from the `getAll` responsibility). Run2 names only 3, with no equivalent responsibility for the single-building-by-ID endpoint. Checked Section 4 (API Contracts) directly in both runs — `getOrganizationBuildingById` **is present in both runs' Section 4 fact list** — so this isn't a missing-fact problem, it's a case where run2's synthesis simply didn't surface an available fact as a distinct Section 2 responsibility.

**`apps/qr_code` and `organization_user_access`:** near word-for-word equivalent content and identical citations across runs — good confirmation cases showing the mechanism works well for small, low-complexity capabilities.

---

## Task 2: Reduce-Stage Self-Consistency, Per Arm × Module (12 cells)

### tasks module (1 pack; small, low complexity)

- **6 (Ownership conclusion):** Consistent conclusion in all 4 arms, both runs: *"the `tasks` module does not own any Firestore data; it is a stateless orchestrator delegating to `admin` and `organization`."* Wording varies substantially but the substantive judgment never contradicts itself.
- **9 (Cross-cutting risk callouts):** Consistent in all 4 arms, both runs: zero RBAC checks, `handleTask` returns `403 Forbidden` on failed authorization, exact validation mechanism unknown/relies on infra-level trust. No contradictions found.
- **13 (Cross-cutting risks):** The core finding ("authorization validation mechanism is an unverified black box") recurs in **all 8** files. Secondary findings vary (circular-dependency risk in Current/AB; DLQ/retry-strategy concern in A; an "orphaned scheduled task" finding unique to `b-run1` only, not repeated in `b-run2`). **Directly observable V1-B wiring effect:** `b-run2`, `ab-run1`, and `ab-run2` explicitly state *"There are no unresolved call edges originating in this module. [Confirmed]"* — a deterministic fact from the newly-wired `unresolvedCallEdges` input — while Current and A (old reduce contract) never mention unresolved call edges at all. `b-run1` doesn't render this explicit statement despite having the same underlying data, showing the wiring's *presence in prose* is itself inconsistent even when the answer is trivial (empty list).

### apps module (4 packs; medium)

- **6 (Ownership conclusion):** **All 8 files (4 arms × 2 runs) agree** on every core assignment: `/EmailLogs` → `mail`, `/SMSLogs` → `sms`, `/users/{id}/notificationTokens` → `user` (not `apps`, despite `notification` writing to it), `qr_code` → stateless. Zero contradictions anywhere. This is a case where variance is already near-zero even under Current — a null result for any arm's improvement claim on this module/section pair, since there's no variance left to reduce.
- **9 (Cross-cutting risk callouts):** Very high consistency across all 4 arms. The same three core findings recur in nearly every file: zero RBAC enforcement across `apps`' capabilities, `/EmailLogs`/`/SMSLogs` fall back to Firestore's default-deny rule (undefined in `firestore.rules.txt`), and `notification`'s token-deletion-on-delivery-failure has no RBAC backing. No empty-content failures observed in any of the 8 files.
- **13 (Cross-cutting risks):** High consistency. `/SMSLogs` missing from `firestore-schema.md` recurs in Current and B (both runs each). `OSKEmailLogController`'s `queryAllSmsDocs` naming artifact recurs in both A runs and both AB runs (a finding specific to those two arms' capability input, since it depends on Section 2/8 evidence). No empty-content failures.

### organization module (14 packs; large — the most informative and where real divergence appears)

- **6 (Ownership conclusion):** All 8 files agree on the core owner assignments for the ~7 dominant paths (`_module_root`→`/organizations/{id}`, `organization_user`→`/organizations/{id}/users`, `organization_residents`→`/organizations/{id}/residents`, `organization_property`→`/properties`, `organization_entity`→`/entities`, `organization_onboarding_inhabitant`→`/onboardingInhabitants`). **No contradiction was found anywhere** — the underlying `OwnershipHint` call-graph-centrality data appears strong enough that the LLM reports it consistently regardless of contract wording. However, *completeness* varies substantially within every arm, including B and AB: `b-run1` names only 4 paths while `b-run2` names 7 plus an ASCII ownership diagram; `organization_prompt_templates` ownership is named only by both A runs, never by Current/B/AB; `ab-run2` introduces an entirely novel "administrative identity vs. physical access" distinction (comparing `organization_residents` to the `building` module) not present in any other run. **This matches the plan document's own noted baseline variance** ("one came back thin, the next came back full") — not a new regression, but also not evidence the reduce-contract fix improved completeness.
- **9 (Cross-cutting risk callouts) — the clearest cross-arm signal in the whole analysis:**
  - **Current run1 → run2:** of run1's 3 distinct named risk findings (AI Prompt Template vulnerability, `v1.org.buildings.create` over-privilege mismatch, composite-roles-checked-as-raw-permissions), only **1 of 3** (the prompt-template finding) recurs in run2; run2 introduces 4 different new findings instead (missing RBAC on `organization_building` writes, missing RBAC on `organization_user_access`, an `organization_entity.getAllEntities` permission-check gap, and `organization_residents`' user-matching bypass). **~33% overlap.**
  - **Arm A run1 → run2:** of run1's 4 distinct named findings (buildings.create over-privilege, prompt-templates zero RBAC, user_access zero RBAC, `deleteOrganizationUser` checking `v1.org.user.edit` instead of `.delete`), **all 4 recur** in run2 (the deletion-mismatch finding is even elaborated with an added contrast against `organization_user_invitation`'s correct behavior). **~100% overlap** — a real, substantial improvement over Current for this section on this module.
  - **Arm B run1** produces a full, rich, RBAC-catalog-driven tally (35 permission strings with exact check-site counts, directly citing the newly-wired `rbacRequirements` data) plus 3 named risks (buildings.create mismatch, prompt-templates zero RBAC, composite-roles misuse). **Arm B run2's cross-cutting subsection is completely empty** — only the header `#### Cross-Cutting Security & RBAC Risks` followed immediately by `**Per-capability evidence:**`, with zero synthesis content, even though the surrounding per-capability material is fully populated. **0% comparable overlap possible — one run has nothing to compare against.**
  - **Arm AB run1's cross-cutting subsection is likewise completely empty** (`#### Cross-Cutting Security Risks and Asymmetries` immediately followed by `**Per-capability evidence:**`). **Arm AB run2** produces full, substantive content (4 named risks: buildings.create privilege escalation, prompt-templates cross-tenant risk, edit/delete permission conflation, SMS-OTP-disabled signal).
- **13 (Cross-cutting risks):**
  - **Current run1 → run2:** ~5 of 6 named findings recur (buildings.create, composite-roles, prompt-template asymmetry, the 3 unresolved call edges, SMS-OTP-TODO); "Dashboard Statistics Scaling" (chunks-of-10) is dropped in run2, which adds 3 new findings instead (write-permission gap, missing `organizationsPending` Firestore-schema entry, Google-Translate-fallback-status). **~83% overlap.**
  - **Arm A run1 → run2:** ~4 of 6 named findings recur (buildings.create, prompt-templates, deletion mismatch, unresolved call edges); "Absence of RBAC in `organization_user_access`" and "Direct Property Updates via Entity Controller" from run1 are absent from run2, which adds an SMS-OTP finding instead. **~67% overlap** — *not* a clear improvement over Current for this section, unlike the strong improvement seen in Section 9.
  - **Arm B run1 and Arm AB run2 (the two non-empty new-reduce-contract samples)** both cite the **exact same unresolved-call-edge facts with identical file:line citations** — `processChannel` at lines 1372/1373 in `organization_intercom_communication.service.ts`, `generateAlphanumericCode`/`generateNumericCode` at lines 358/357 in `organization_onboarding_inhabitant.service.ts` — a genuinely strong, exact-match consistency result for the deterministically-wired portion of this section, when the synthesis actually runs.
  - **Arm B run2 and Arm AB run1 are again completely empty** for the cross-cutting risks paragraph (confirmed by checking the raw section boundaries directly, not just the extraction script) — the same two runs that were empty for Section 9. This is not an isolated single-section glitch; it's the same run failing to produce cross-cutting synthesis content across *both* Sections 9 and 13, while Section 6 in those same two runs remained fully populated (40 lines of real ownership content in `b-run2`, 15 lines in `ab-run1`).

**Notably, this "empty cross-cutting synthesis" failure was never observed on `tasks` or `apps` under the same B/AB reduce contract** — only on `organization`, the 14-capability module. This strongly suggests the failure is tied to module size/capability count interacting with the newly-added deterministic inputs (the RBAC requirements catalog and unresolved-call-edges list), which are necessarily much larger for a 14-capability module than for a 1- or 4-capability one — plausibly consuming enough of the prompt/attention budget that the model sometimes emits the section header and then jumps straight to restating per-capability evidence, skipping the actual synthesis paragraph entirely.

---

## Task 3: Cross-Arm Comparison (organization and apps)

### Section 6 (Ownership conclusion)

**Null result for both arms.** On `apps`, ownership conclusions were already 8/8 consistent under Current — no variance for B or AB to reduce. On `organization`, the *conclusions* were already consistent across all 4 arms on the ~7 dominant paths (never a contradiction observed in Current, A, B, or AB) — the underlying `OwnershipHint` signal appears to be doing the real stabilizing work regardless of contract wording, exactly as the V1-B scope doc anticipated it would be a strong-but-partial signal. What *does* vary — coverage completeness, whether peripheral paths like `promptTemplates` or `userInvitations` get mentioned at all — shows no evidence of being tighter under B/AB than under Current (`b-run1` was actually the thinnest sample of all 8, containing only 4 named paths). **No arm shows a clear, attributable variance reduction for Section 6.**

### Section 9 (Cross-cutting risk callouts)

**Real, substantial finding for arm A on `organization`; inconclusive-to-negative for B/AB on the same module; no differentiation on `apps`.**
- Arm A's named-finding overlap (~100%, 4/4) is a marked, concrete improvement over Current's ~33% (1/3) on `organization` — the clearest single piece of evidence in this whole analysis that a contract change reduced variance. Since V1-A never touched Section 7 (the capability-level Permissions section feeding this), the mechanism is unclear — plausibly that a more stable Section 2/3 upstream leaves less noise for the reduce call to react to, but this wasn't directly tested and should not be overstated as proven.
- Arm B, intended to fix this exact section by wiring in the RBAC catalog, instead shows a **50% complete-content-failure rate** on `organization` (`b-run2` empty). Where it *did* produce content (`b-run1`), it was rich and citation-precise. Arm AB shows the identical pattern (`ab-run1` empty, `ab-run2` rich). This is not simply "no improvement" — it's a new failure mode not present in Current or A, and it should be treated as a priority bug to fix (likely a prompt-length/budget issue introduced by the new deterministic tables at high capability count) before any claim that B/AB improved Section 9 stability can be made.
- On `apps` (4 packs, smaller RBAC catalog), no such failure occurred in any of the 4 arms, and consistency was already high everywhere — no differentiation between arms is visible at this module size.

### Section 13 (Cross-cutting risks)

**Mixed/inconclusive for arm A; same empty-content failure as Section 9 for B/AB on `organization`.**
- Arm A's overlap on `organization` (~67%) is not clearly better than Current's (~83%) for this section — unlike Section 9, arm A does not show a convincing improvement here. This is a legitimate null/mixed result and should be reported as such rather than rounded up.
- The deterministic `unresolvedCallEdges` wiring, when it renders at all, works exactly as intended: `b-run1` and `ab-run2` cite the identical file:line facts for the same three call edges. But the same 50% empty-content failure seen in Section 9 recurs here in the identical two runs (`b-run2`, `ab-run1`) — this is the dominant signal for Section 13 on `organization`, overshadowing any question of whether named-risk overlap improved.
- On `apps`, consistency was high across all 4 arms with no empty-content failures, and no arm stands out as clearly more self-consistent than another at this module size.

### Bottom line per section

| Section | Arm(s) showing real variance reduction | Honest caveat |
|---|---|---|
| 6 (Ownership) | None | Already near-zero variance under Current on both modules sampled; nothing to attribute |
| 9 (Risk callouts) | **A**, on `organization` only | B/AB show a new 50% content-omission failure on `organization` that must be fixed before their effect can be judged at all; no arm differentiates on `apps` |
| 13 (Cross-cutting risks) | None clearly | A's overlap is not better than Current's here; B/AB show the same empty-content failure as Section 9 in the identical two runs |

This is a genuinely mixed result, consistent with this project's established norm of reporting null/negative findings plainly. The single most actionable outcome of this experiment is not "which arm wins" but the discovery of the organization-module-specific empty-cross-cutting-content failure in arms B and AB, and the organization_entity Section-3 misassembly bug in cap-run2 — both are concrete pipeline defects, independent of the underlying capability/reduce contract hypotheses, that should be fixed and then re-measured before drawing further conclusions about variance reduction.

---

## Re-run: B/AB content-omission fix verification (2026-08-30)

**Method:** 4 real LLM calls, no new code changes — `01c-generate-assembly-first-profile.ts` against the same `organization` module, same run (`20260829_081559-00e1d9fd`, commit `00e1d9fd`), same `COMPARISON_MODE`/`CAPABILITY_SOURCE_CONFIG_KEY` inputs as the original experiment (`gemini-default-v1ab-old-canonical` for B, `gemini-default-v1ab-cap-run1` for AB), writing to the same `gemini-default-v1ab-{b,ab}-run{1,2}` comparison namespaces (overwriting the original pre-fix samples). Purpose: determine whether the empty-cross-cutting-content failure (`b-run2`, `ab-run1` previously completely empty for Sections 9 and 13) recurs now that `selectRealSectionMatches()` and the `01c` detect-and-retry loop are both live.

**Result: no empty content in any of the 4 cells.** Section 9 body length: `b-run1` 22,080 chars, `b-run2` 22,594 chars, `ab-run1` 23,321 chars, `ab-run2` 23,598 chars (all previously either populated already or — for `b-run2`/`ab-run1` — essentially zero). Section 13 likewise fully populated in all four (10,957–12,342 chars). `run-notifications.json` shows zero `CONNECTIVE_CONTENT_DEGENERATE_*` entries for any of the 4 calls — the retry mechanism never fired, meaning first-attempt output was already healthy. **Caveat:** since the retry never triggered, this re-run cannot confirm the retry loop itself is what fixes the failure when it does occur — only that the failure did not recur under the current codebase. Other changes landed since the original 63 calls (compact fact-table encoding, footnote-style citation rendering) may have reduced prompt size/restructured attention enough to avoid triggering the failure mode at all. Citation validation: `CITATION_VALIDATION_PASSED` for both the profile and API reference in all 4 cells, 0 file-not-found.

### Section 9 (Cross-cutting risk callouts) — named-finding overlap, now measurable for B and AB

- **Arm B (`b-run1` → `b-run2`):** `b-run1` names 2 findings — buildings.create over-privilege (resident invitation/onboarding), and organization_prompt_templates' complete absence of RBAC. **Both recur in `b-run2`** (the second folded into a broader "Unattributed Security-Relevant Signals" bullet, same substance) — **100% overlap on `b-run1`'s content**. `b-run2` additionally introduces 2 new findings not in `b-run1` (a composite-role-vs-raw-permission mismatch, and an unattributed `organization_inhabitant` permission-denied signal).
- **Arm AB (`ab-run1` → `ab-run2`):** `ab-run1` names 2 findings — the identical buildings.create over-privilege finding, and the identical prompt-templates RBAC-absence finding. **Both recur in `ab-run2`**, worded differently but substantively identical — **100% overlap**, matching Arm A's original ~100%/4-of-4 result almost exactly. `ab-run2` additionally introduces a deletion-permission-mismatch finding (`v1.org.user.edit` used to gate deletion) not present in `ab-run1`.

With the content-omission failure resolved, **B and AB both now show Section 9 self-consistency comparable to Arm A's already-validated win** — the earlier "B/AB show a new failure that must be fixed before their effect can be judged" caveat no longer applies; their effect can now be judged, and it looks favorable.

### Section 13 (Cross-cutting risks) — mixed, as before

The deterministic unresolved-call-edge citations (`processChannel` at `organization_intercom_communication.service.ts:1372-1373`; `generateAlphanumericCode`/`generateNumericCode` at `organization_onboarding_inhabitant.service.ts:357-358`) recur **word-for-word, with identical line numbers, in all 4 cells** — the deterministic wiring continues to work exactly as designed regardless of contract arm. Beyond that deterministic core, overlap on the non-deterministic risk narrative is partial in both arms: `b-run1`'s content is a strict subset of `b-run2`'s (b-run2 adds one more, cross-referencing Section 9); `ab-run1` names 3 non-deterministic findings, of which roughly 2 recur in `ab-run2` in different words (~67%) while one (an inconsistent-deletion-authorization finding) does not recur and `ab-run2` introduces a prompt-templates finding not named in `ab-run1`. This is the same order of magnitude as Current's original ~83% and Arm A's original ~67% — **no arm, including B/AB now that they're unbroken, shows a clear win for Section 13.**

### Updated bottom line

| Section | Arm(s) showing real variance reduction | Status after re-run |
|---|---|---|
| 6 (Ownership) | None | Unchanged — not re-tested, no reason to expect a different result |
| 9 (Risk callouts) | **A, B, and AB**, on `organization` | Updated: B/AB's previous disqualifying failure is confirmed fixed; both now show ~100% overlap, on par with A |
| 13 (Cross-cutting risks) | None clearly | Unchanged — deterministic content is rock-solid everywhere, non-deterministic narrative remains inconsistent across every arm including B/AB |

**Revised porting decision (supersedes the "V1-A only" call in `tasks.md` item 17o):** V1-B is no longer blocked by an unresolved content-omission bug — its Section 9 self-consistency is now demonstrated, not just theorized, on the one module that actually exercises its new deterministic inputs at scale. Combined with V1-B's independent structural justification (17h/17j/17k — reduce stage reasons from pre-built catalogs instead of re-deriving them), this is enough to also greenlight **V1-B** for porting to Angular/Node-IoT, not V1-A alone. Caveat: this re-run covered only `organization` (the one module that ever exhibited the failure) and only 4 calls, not a full re-run of the 24-cell reduce-stage experiment — it confirms the disqualifying bug is gone and shows a positive Section 9 signal, but it is not as strong an evidence base as the original factorial design. If a stronger guarantee is wanted before porting, the next step would be a full re-run of the reduce-stage half of the experiment (24 calls) rather than accepting this smaller confirmation.
