# Update: V1-A Implemented and Verified; Section 8-vs-2/3 Hypothesis Retired

**Status:** Progress update plus one hypothesis correction, following the agreed sequencing (V1-A first, Firebase-only, tested independently from V1-B).

---

## V1-A is implemented and verified, not just scoped

Since the last exchange, `00-capability-synthesis.md`'s Sections 2 and 3 have actually been rewritten and tested — not just scoped:

- **Section 3** now assembled deterministically. New `buildPublicInterfacesSection()` (in `_shared/capability-synthesis.ts`) builds it from `source_class`/`controller_method`/`service_method` facts; new `replaceNumberedSection()` (in `_shared/document-sections.ts`) splices it into the LLM's response after the call returns, heading-level-tolerant by design (mirrors `splitNumberedSections`'s own tolerance). Contract text rewritten to tell the model not to write this section at all.
- **Section 2** rewritten with the bounded candidate-source traversal list and the worked negative/positive grouping example from the scope doc.
- **Verified against two structurally different capabilities**, addressing the earlier concern that the original proof (`apps/mail`, 2 classes) wasn't representative: `supplierStaff` (10 classes, clean controller/service pairs) and `organization_intercom_communication` (3 classes, much higher behavioral density). Both produced fully correct, fully-cited Section 3 output. One minor, non-breaking anomaly: the LLM nested its own Section 3 header inside Section 2's content on one run — didn't affect correctness given the heading-tolerant splice, but worth watching if it recurs.
- `tsc --noEmit` clean, diff isolated to the 5 intended files.

---

## Hypothesis retired: Section 8's relative stability does not generalize

Per your own "keep as hypothesis, not finding" caution on this exact point, it was re-tested across 9 more modules (existing on-disk data, no new LLM calls). Result:

| module | Sec 4 (open-ended, from capability Sec 3) | Sec 11 (bounded fact-type list, from capability Sec 8) |
|---|---|---|
| building | -56% | -56% (identical) |
| core | +156% | +90% |
| user | +57% | **+175%** |
| settings | -12% | **+100%** |
| admin | -35% | -67% |
| tasks | -25% | -50% |

The bounded section is not more stable — in most cases it's equal or worse. Most likely explanation: Section 11's totals are almost always tiny (1-19 citations across these modules), and small absolute counts produce large, noisy percentage swings regardless of instruction design. The original `apps`-only result that motivated this comparison was very likely coincidental to that module's specific numbers, not a real signal.

**This does not affect Section 3's fix** — that was justified independently (Phase 1 already deterministically knows the answer), not on a "boundedness reduces variance" theory. But "bounded fact-type traversal improves stability" itself should be dropped as an input to V1-B's design, rather than carried forward as validated. Worth keeping in mind if a similar "should we bound Section 9/13's traversal the same way Section 8 is bounded" argument comes up during V1-B — the analogy no longer has empirical support behind it.

---

## Next

Proceeding to V1-B (module-reduce contract: self-contained rewrite, Sections 6/9/13's judgment-boundary tightening, and the two RBAC-catalog/unresolved-call-edges wiring fixes) per the already-agreed scope document. Will report back once that's implemented and tested the same way.
