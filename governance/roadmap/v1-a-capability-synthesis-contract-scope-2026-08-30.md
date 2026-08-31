# V1-A Scope: Capability Synthesis Contract (`00-capability-synthesis.md`)

**Status:** Scope document, not the rewritten contract. Defines what changes and why, grounded in real code checks performed during the multi-round review (`contract-refactoring/contract-scope-conflict-review-for-chatgpt-2026-08-30*.md` and the corresponding `-for-claude-*` responses). Scoped to Firebase (`firebase-oskey-dev`) only, per the explicit decision to test on one repo before any cross-repo generalization — the pipeline's contracts are deliberately duplicated per repo while the eventual implementation topology (one consolidated pipeline vs. several) remains undecided by the dev team, and this experiment should not presume an answer to that question.

**Hypothesis under test:** Open-ended evidence traversal in specific sections of `00-capability-synthesis.md` causes inconsistent capability-level coverage between runs on identical facts. Confirmed real (not assumed) for Section 3; still a hypothesis, not yet proven, for Section 2.

**Explicitly NOT in scope for V1-A:** any change to Sections 4, 5, 6, 7, 8, or 9 (audited, already well-bounded — see §3 below); any new Phase 1 fact extraction; any cross-repo generalization or shared contract abstraction; bundling with V1-B (tested independently, per the agreed single-variable-change discipline).

---

## 1. Section 3 (Public Interfaces & Controllers) — move from LLM discovery to deterministic assembly

### What's confirmed, not assumed

Checked directly against a real capability pack (`apps/mail`, Firebase):

```
source_class:      OSKEmailLogController, OSKEmailService
controller_method: OSKEmailLogController.delete / .get / .getAll / .save / .update / ...
service_method:    OSKEmailService.logMailMessage / .send
```

Phase 1 already deterministically distinguishes controller classes from service classes, via `classificationRules` (`serviceSuffixes`, `controllerSuffixes` in `config/repos.json`) applied at method-classification time in `02-build-module-evidence.ts`, and already extracts every class name via `source_class`. The current contract instruction — *"Controllers, exported services, and other public entry points this capability exposes... Named specifically... not described generically"* — asks the LLM to discover something the pipeline already knows.

Measured impact: this section (assembled verbatim into the final Module Engineering Profile's Section 4) showed a -44% citation-count swing between two identical-facts runs on the `apps` module — the largest swing of any section checked in that comparison.

### The change

Move candidate enumeration for controller/service classes to deterministic assembly, sourced from `source_class` + `controller_method`/`service_method` facts already present in each capability's evidence pack. The LLM's remaining role, if retained at all, is limited to rendering a human-readable one-line description per already-enumerated item — it does not decide *whether* an item belongs in the list.

### "Other public entry points" boundary — checked, resolved

The original `apps/mail` evidence was too small (2 classes) to be a reliable basis for this decision on its own. Re-checked against `supplierStaff` (605 facts, the largest single capability pack in the corpus, 10 classes) and two other large capabilities (`building_unit_nonAppUser`, `organization_intercom_communication`), specifically looking for any fact type near "public interface" territory beyond `source_class`/`controller_method`/`service_method`. Found two, in every complex capability checked:

- `exported_symbol` — barrel-file (`index.ts`) re-exports. Confirmed these re-point at the *same* classes already captured via `source_class` (e.g. `./services/supplier_staff.service` re-exporting `OSKSupplierStaffService`) — redundant, not a new category.
- `function_declaration` — in `supplierStaff`, this is `getCallableFunctionTriggers`, the Cloud Functions registration wiring itself (the function returning the `https.onCall(...)` bindings), not a business-facing public interface. Matches the same pattern already found in the RBAC investigation (`getRoleCallableFunction`/`getRoleFirestoreTriggers` in the role module's own `index.ts`).

Neither represents a real gap. **Use `supplierStaff`, not `apps/mail`, as the reference/verification capability for the actual rewrite (task 17e in `governance/roadmap/firebase-oskey-dev/tasks.md`)** — same conclusion, now backed by the pipeline's most complex real case rather than its simplest one.

### Expected validation result

If this change is correct, Section 3's run-to-run variance should approach zero — it becomes a deterministic assembly step, the same as Sections 4 and 5 already are per the reduce contract's own section-to-document mapping. A nonzero result after this change would indicate either an incomplete migration (some interfaces still LLM-discovered) or a genuine remaining rendering-variance issue (see metrics, §4).

---

## 2. Section 2 (Primary Responsibilities) — bounded traversal, not deterministic assembly

### Why this section is different from Section 3

There is no demonstrated one-to-one mapping from a single fact to a single responsibility. A responsibility is a synthesized concept: one class may implement several responsibilities, and a single coherent responsibility may be evidenced across several different fact types at once (an API contract, a Firestore write, an external hook, and a permission check can all describe one real capability, e.g. "send and audit outbound messages"). This section legitimately remains an LLM synthesis task — the current instruction's problem is not that it asks for synthesis, but that it asks for exhaustive discovery ("every distinct responsibility/feature") without defining how the model finds the complete candidate set.

### The change

1. **Bounded candidate-source traversal.** Require the model to inspect every applicable evidence-source group before grouping into responsibilities: public interfaces, API contracts, Firestore triggers, service/class methods, persistence operations, permission-controlled operations, external hooks, outbound coupling. These are candidate *sources* to check, not a required *output taxonomy* — the instruction must say this explicitly, since the natural failure mode is producing one responsibility per fact-type category rather than genuinely grouping.
2. **A concrete worked negative example**, not just a prose warning (prose alone — "don't mirror the fact taxonomy" — is exactly the kind of instruction this whole review has found unreliable on its own). Use a neutral, synthetic example, not a real Oskey capability, to avoid corpus-specific anchoring:

   ```
   Evidence discovered:
   - API contract: sendMessage(...)
   - Firestore write: /messageLogs/{id}
   - external hook: mail provider
   - permission check: send_message

   Incorrect synthesis (one responsibility per fact type):
   - Message API responsibility
   - Message logging responsibility
   - External mail responsibility
   - Message permission responsibility

   Correct synthesis (grouped by coherent engineering behavior):
   - Send and audit outbound messages
     Evidence: API contract + message-log persistence + external mail
     boundary + permission enforcement
   ```

3. **No fixed responsibility count.** The objective is systematic traversal of the candidate evidence surface, not a target number of responsibilities.
4. **Retain unchanged:** confidence tagging, inline citation requirements, "never invent," preservation of exact engineering terminology (method names, Firestore paths, permission strings).

---

## 3. Sections audited and left unchanged

| Section | Current instruction basis | Verdict |
|---|---|---|
| 5. Data Ownership | Bounded by Firestore-path facts, confidence/scope metadata already tagged | No change |
| 6. Outbound Coupling | Bounded by `imports_dependency` facts specifically | No change |
| 7. Permissions & Security | Bounded by permission-string facts + RBAC cross-check | No change |
| 8. External Hooks | Already enumerates a closed, specific fact-type list (`external_hook`, `pubsub_topic`/`pubsub_publish_call`, `http_or_client_path`, `environment_variable`, `storage_path`) | No change |
| 1. Capability Summary | Open-ended but low-stakes (1-2 sentences); include in semantic-stability measurement, no contract fix | No change for V1 |
| 9. Open Questions | Inherently open-ended by design — concerns evidence gaps, which can't be enumerated from a closed list the way presence-based sections can | No change |

One open, unresolved question from the review thread: whether Section 8's relative stability (+11% swing vs. -24%/-44% for Sections 2/3, measured on `apps`) is actually caused by its bounded fact-type list, or is simply an artifact of having fewer candidate facts to select from in the first place. Not yet isolated — see §4's metrics recommendation before treating Section 8 as a proven template for anything beyond what's already been separately confirmed for Section 3.

---

## 4. Metrics — citation count is not sufficient on its own

Citation count was useful for *discovering* the variance problem but can mislead about *coverage*: two runs can have identical total citations while reporting completely different items (e.g. Run A cites `FooController` and `BarService` three times each; Run B cites only `FooController` six times — identical totals, `BarService` entirely missing from Run B). Use it as a secondary diagnostic only, alongside:

**For Section 3 (now deterministic):**
- Exact inventory equality across runs — expected to be 100% once the change lands, since there's no more probabilistic discovery step.
- If Phase 1 also affords a way to independently verify the deterministic candidate set is itself complete, track recall/precision against it — lower priority, only if cheap.

**For Section 2 (remains synthetic):**
- Named-responsibility semantic overlap between runs (does the same real capability get named, even under different wording?).
- Evidence-engagement overlap: for every responsibility in Run A, does its cited underlying evidence (fact IDs/files) appear anywhere in Run B's responsibilities, regardless of wording or grouping? This tests whether the evidence was engaged with, independent of how it got labeled — a better fit than named-entity matching for a section that's genuinely synthesized rather than enumerated.
- Number of reported responsibilities per run, as a coarse secondary signal only.

**Before running the isolation check on Section 8 vs. 2/3:** repeat the same section-level citation/candidate-fact-count breakdown across several more modules from the existing measurement set (already on disk, no new LLM calls needed) to check whether the stability gap holds once candidate-fact-count is normalized for.

---

## 5. What this scope does NOT require

- No changes to `_shared/capability-synthesis.ts`'s prompt assembly structure — the fix is entirely within the contract text and, for Section 3, the deterministic-assembly logic that already exists for Sections 4/5 (this becomes the same pattern, one more section).
- No new Phase 1 extraction work.
- No changes to `01-module-synthesis-reduce.md` or the reduce call — that's V1-B, tested independently.
- No cross-repo work — Angular and Node-IoT already have their own equivalent deterministic fact types for at least Public Interfaces (confirmed: `angular_component`/`angular_injectable`/`source_class` for Angular, `route_handler_method`/`controller_method`/`source_class` for Node-IoT), but porting this fix to their own contracts is a separate, later decision made after this experiment produces a result on Firebase.
