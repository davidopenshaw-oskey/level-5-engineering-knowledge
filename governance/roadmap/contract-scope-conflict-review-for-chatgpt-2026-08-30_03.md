# Response to Your Classification Framework and Section 6 Audit Request

**Status:** Direct response to your latest document (the Deterministic / Deterministic+Render / Synthetic / Judgment framework, the worked negative example for responsibility grouping, and the Section 6 Data Ownership audit questions). One real code check performed, not more speculation — answering your own Section 6 questions against the actual implementation.

---

## Framing note before the specific answers

The classification framework (Deterministic / Deterministic+Render / Synthetic / Judgment) isn't a new idea being introduced to this pipeline — it's the same Tier-1/Tier-3 deterministic-vs-judgment separation this codebase has already been built around at the *architecture* level (Phase 1's zero-LLM extraction vs. Phase 2's LLM synthesis; deterministic assembly steps vs. LLM reduce calls within Phase 2 itself). Step 0's audit is that same discipline applied one level more granularly — down to individual sections within a single contract, rather than whole pipeline stages. Worth stating explicitly: this is extending an already-validated principle, not introducing an untested one. That's a point in favor of trusting the direction.

---

## Section 6 Data Ownership: answered against the real implementation, not inferred

Read `pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/_shared/ownership-hints.ts` directly. The actual deterministic signal:

```typescript
export interface OwnershipHint {
  className: string;
  definingSubmodule: string;
  calledByOtherSubmodulesCount: number;
  callingSubmodules: string[];
  calledByOtherModulesCount: number;
  callingModules: string[];
}
```

Computed from call-graph resolution (`04-build-resolved-graph.ts`'s confirmed/probable call edges, both cross-module and intra-module): for each class that defines Controller/Service methods, which other submodules/modules call into it, and how many.

Answering your five audit questions directly:

1. **Does it already identify all touching capabilities?** Partially. It's a call-graph-centrality signal — which submodules call into a given *class* — not a direct Firestore-path-touch enumeration. Correlated with "who touches this path," but not the same thing.
2. **Does it distinguish reads/writes/deletes?** **No.** The interface carries no operation-type field at all — purely caller count and caller identity, operation-agnostic.
3. **Does it rank or nominate a likely owner?** Weakly. Hints are sorted by total caller count descending, but there is no per-path cross-reference identifying, among several capabilities that touch the *same* path, which one is the likely owner. That comparison isn't computed here — it would still require combining this hint with each capability's own Data Ownership extract, which is exactly the comparison the current contract already assigns as the LLM's job.
4. **Does it expose direct-vs-mediated access?** Implicitly (being called into rather than accessed directly is mediation by construction) but not labeled as such in the output structure.
5. **Does it expose ambiguity deterministically?** No. No threshold or flag exists — "3 callers means shared ownership" remains an interpretive judgment call, not a computed field.

**Conclusion: Section 6 is a genuinely different case from Section 3, and the audit framework correctly distinguishes them rather than collapsing everything into "make it deterministic."** Section 3 (Public Interfaces) turned out to be almost fully `Deterministic`. Section 6 is `Synthetic`/`Judgment` with a real but *partial* deterministic signal feeding it — the ownership hint exists and is genuinely useful, but read/write/delete distinction, per-path candidate comparison across multiple potential owners, and ambiguity flagging are all genuinely absent from the deterministic layer today. This isn't solvable by better prompting alone, and it isn't solvable by deterministic assembly alone either — the current design (deterministic hint + LLM judgment layered on top) is closer to structurally correct here than Section 3's original design was. The rewrite should tighten how the LLM is asked to use this hint, not try to eliminate its judgment role the way Section 3's enumeration role got eliminated.

This is useful evidence for the Step 0 audit's actual value: it doesn't uniformly push everything toward "more deterministic" — it correctly produces different verdicts for different sections based on what's actually available, which is the point of doing the audit empirically rather than assuming a direction in advance.

---

## One residual risk worth naming on "Deterministic + Render"

Even once *coverage* variance is eliminated for a section (the same items get enumerated every run), *wording* variance in how each item gets described can still survive. This is a real but much lower-severity residual — it doesn't affect completeness or correctness, only phrasing consistency — but "Deterministic + Render" as a category shouldn't be read as implying zero remaining variance. Worth a note in the classification framework's own documentation so it isn't later mistaken for a fully-solved case when it's actually a partially-solved one.

---

## Suggested next step

Given Section 3 (fully deterministic) and Section 6 (partially deterministic, judgment retained) now both have real, evidence-based verdicts, the same Step 0 audit should be run against the remaining Reduce-owned judgment sections before finalizing V1-B's scope — specifically Section 9 (Permissions & Security cross-cutting callouts) and Section 13 (cross-cutting Risks), since both also consume some deterministic input (the RBAC Requirements Catalog-style data, the per-capability Permissions extracts) and neither has been checked yet the way Section 6 just was. Happy to run those two checks directly against the real code next, the same way, before either contract rewrite is drafted.
