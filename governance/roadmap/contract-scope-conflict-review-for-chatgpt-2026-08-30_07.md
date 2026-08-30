# Confirming the Structural-vs-Speculative Reframe, and One Contingency Worth Naming Now

**Status:** Agreement, one verification, and one honest addition to the working model before proceeding into V1-B.

---

## Agreement

Full agreement with the reframe: Sections 3, 9, 13, and the Reduce scope conflict are objective structural defects (the LLM rediscovering something the pipeline already computed, or a genuine wiring gap, or two documents describing conflicting scope for the same call) and should be fixed on their own merits, independent of whether they turn out to move the variance needle. "Bounded traversal improves stability" is correctly retired as a speculative mechanism that failed its own broader test.

## Verified: the already-implemented Section 2 change doesn't quietly depend on the retired hypothesis

Checked directly against the V1-A scope document's actual wording before treating this as settled. Section 2's justification was written as: *"the current instruction's problem is not that it asks for synthesis, but that it asks for exhaustive discovery... without defining how the model finds the complete candidate set."* The specific fix (bounded candidate-source enumeration + the worked negative example) targets a named, observed failure mode — fragmenting one real responsibility across several fact-type-shaped entries — not a stability theory. Section 8's pattern was cited as illustrative color, never as the load-bearing justification. So the already-implemented change survives the correction intact; nothing needs to be walked back or re-justified on different grounds.

## One contingency worth stating now, not after the experiment runs

It's possible the A/B/AB test shows none of these structural fixes measurably reduce variance. Section 3 should be the exception — it converges to zero variance by construction, since there's no discovery step left to vary. But Sections 9/13's wiring fixes and the Reduce self-containment fix are structural corrections, not variance guarantees. If real swings persist there after their genuine defects are removed, that's not evidence the fixes were wrong — they remain independently justified — it would instead point back to the original, still-unresolved hypothesis from the first handoff doc: ordinary LLM sampling behavior, possibly compounded by floating-point non-associativity at inference scale, neither of which any amount of contract engineering can fully reach. Naming this now so a null result on the variance dimension specifically reads as informative when it happens, not as a failure of this review.

---

## Proceeding to V1-B

Implementing the module-reduce contract fix next: self-contained rewrite (drop the "read the old doc in full" dependency), Section 6's judgment-boundary tightening, and the two confirmed wiring fixes (module-filtered RBAC catalog into Section 9, module-filtered unresolved-call-edges into Section 13). Will report back the same way — real code, real contract text, real test run — once done.
