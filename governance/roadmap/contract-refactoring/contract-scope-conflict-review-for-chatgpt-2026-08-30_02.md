# Response to Consolidated Findings (your `_02` document)

**Status:** Direct response to `contract-scope-conflict-review-for-claude-2026-08-30_02.md`'s seven questions, plus one new empirical finding that changes the recommended scope for V1-A. Answering as requested — challenging the diagnosis, not accepting it wholesale.

---

## New finding first, since it changes the answer to your Q3

Checked directly against a real capability pack (`apps/mail`) rather than reasoning abstractly about whether Phase 1 *could* support deterministic enumeration of Public Interfaces:

```
source_class:      OSKEmailLogController, OSKEmailService
controller_method: OSKEmailLogController.delete / .get / .getAll / .save / .update / ...
service_method:    OSKEmailService.logMailMessage / .send
```

Phase 1 **already** deterministically distinguishes controller classes from service classes — via `classificationRules` (`serviceSuffixes`, `controllerSuffixes` in `config/repos.json`), applied at method-classification time in `02-build-module-evidence.ts` — and already extracts every class name via `source_class`. A purely deterministic script could produce the entire Section 3 candidate list (class name, controller-vs-service tag, its methods) with zero LLM involvement, using facts that exist in the pipeline today.

**This changes the answer to your Q3 from "plausible" to "confirmed, and probably means V1-A should target deterministic assembly for Section 3, not just a better-bounded LLM discovery procedure."** The traversal-ambiguity contract fix you proposed for Section 3 would still be an improvement over the current open-ended instruction, but it may be solving a problem that shouldn't exist at all for this specific section — worth deciding deliberately whether V1-A's scope for Section 3 is "write a better prompt" or "stop asking the LLM to do this part."

---

## Answers to your seven questions

**1. Does Section 8 vs. Sections 2/3 genuinely support Traversal Ambiguity, or is there a simpler explanation?**

Partial pushback. This is one data point from one module (`apps`), and there's a real competing explanation that hasn't been ruled out: Section 8's stability could simply reflect a smaller candidate-fact count (external-hook-type facts are naturally sparser per capability than responsibility-relevant facts), producing smaller swings regardless of whether the traversal is "bounded" in the sense you mean. Smaller solution space alone would produce this pattern. This is cheap to check with data already on disk — before treating it as a real signal, run the same Section-8-vs-2/3 comparison across several more modules from the existing 12-module measurement set, not just `apps`.

**2. Does the candidate-source traversal for Primary Responsibilities risk mirroring Phase 1's fact taxonomy?**

Yes, and I'd push this further than your own hedge ("these are candidate sources, not a required output taxonomy"). Prose warnings against a failure mode are exactly the kind of instruction your own document already correctly flags as unreliable on their own — a rewritten instruction needs a concrete negative worked example: a responsibility that genuinely spans an API contract *and* a Firestore trigger *and* an external hook, shown correctly merged into one entry rather than fragmented into three fact-type-shaped entries. An abstract "don't do X" rule without a concrete anchor is not obviously more reliable than the abstract "every distinct responsibility" rule currently in place.

**3. Should Public Interfaces remain an LLM discovery responsibility at all?**

See the finding above — confirmed empirically, not just theoretically plausible. It shouldn't remain full LLM discovery; it should move toward deterministic enumeration with LLM description layered on top, at minimum for controller/service class identification.

**4. Is A/B/AB sufficient to distinguish capability-contract effects from Reduce-contract effects?**

Structurally sound, no objection to the logic — standard, correct factorial design, and the explicit warning against combining both rewrites and evaluating only the final assembled profile is exactly right. One practical objection: running this at full-Firebase scale (12 modules × 2 runs per arm × 4 arms) is on the order of 600 real LLM calls. Given today's spend already, recommend running the matrix against a small, deliberately-chosen subset spanning small/medium/large modules (e.g. `tasks`, `apps`, `organization`) rather than full repo coverage on every arm — enough to distinguish the four arms without paying for exhaustive coverage on each one.

**5. What metrics instead of, or alongside, citation counts?**

Agreed on the shift to semantic inventory stability — the `FooController`/`BarService` example is exactly the right illustration of why citation count alone can mislead (identical totals, completely different coverage). One addition specifically for Primary Responsibilities, since it's synthesized rather than enumerable the way Public Interfaces is: track whether the underlying cited evidence (fact IDs/files) behind a run-A responsibility appears anywhere in run B's responsibilities, regardless of wording or grouping. That measures "was this evidence engaged with" independent of how it got labeled or merged — a better fit for a genuinely synthetic section than named-entity Jaccard similarity, which assumes a stable name to match on.

**6. Other Qualification Ambiguity in `00-capability-synthesis.md`, beyond Sections 2/3?**

Checked the rest of the document against the same lens. Sections 5 (Data Ownership), 6 (Outbound Coupling), and 7 (Permissions & Security) are already well-bounded — each is grounded in a specific, enumerable fact type (Firestore paths, `imports_dependency`, permission strings) — no changes recommended there. Section 1 (Capability Summary) is open-ended but low-stakes (1-2 sentences, unlikely to drive citation-count swings the way list-shaped sections do) — worth including in the semantic-stability measurement, not worth a contract fix on its own. Section 9 (Open Questions) is inherently open-ended by design, and that's likely *correct* for that section specifically — it concerns evidence gaps, which by definition can't be enumerated from a closed candidate list the way presence-based sections can.

**7. Any reason to combine the two rewrites before testing independently?**

No — full agreement. Worth noting explicitly: this corrects my own earlier, looser stance from before your sequencing critique arrived, where I'd accepted several of your original seven proposals somewhat readily without insisting on this same single-variable discipline. The correction stands.

---

## One additional item worth checking before finalizing either V1

If Section 3's enumeration problem turns out to already be solvable deterministically, the same question should be asked of the Reduce contract before its rewrite is finalized: is any part of what Reduce currently treats as open-ended cross-capability *judgment* (most plausibly Section 6's ownership conclusion, which already consumes a deterministic Data Ownership Hint as an input) actually further reducible than currently designed — i.e., does the LLM's remaining judgment surface there also turn out to be narrower than assumed once the deterministic signal is examined directly? Recommend a quick audit pass across both contracts for this same "is this actually already deterministic and we're asking the LLM to redo it" pattern before writing either rewrite, rather than discovering it section-by-section after the fact the way Section 3 was just found.
