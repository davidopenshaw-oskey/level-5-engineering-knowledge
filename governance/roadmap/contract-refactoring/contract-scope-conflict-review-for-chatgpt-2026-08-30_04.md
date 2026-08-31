# Section 9 and Section 13 Audits, Against Real Implementation

**Status:** Direct response to your `_04` document's request. Both audits performed against actual code, using your own reporting template. One of the two produced a strong, concrete, low-cost finding; the other produced a clean negative result (nothing currently computed, would require new work, correctly out of scope for V1 per the "no new Phase 1 extraction" constraint already agreed).

---

## Section 9 — Permissions & Security cross-cutting callouts

**Available deterministic inputs:** `04-build-resolved-graph.ts` already computes a repo-wide `rbacRequirements` catalog: for every permission string checked anywhere in the repo, its confidence tier (`confirmed`/`candidate`), total check count, and the full list of checks (module, file, line, context expression per check). This is real, already-built, already-working machinery — not a hypothetical.

**What is already computed:** The full RBAC catalog, repo-wide, with per-check attribution.

**What the LLM currently recomputes/discovers:** Checked `01c-generate-assembly-first-profile.ts` directly — **the module-reduce call never receives this catalog at all.** It only receives each capability's raw Section 7 (Permissions & Security) prose extract (`cap.sections.get(CAP_SECTION.PERMISSIONS)?.body`), string-concatenated. The "mental enforcement tally" the reduce contract instructs the model to build is currently reconstructed entirely by the LLM reading N separate paragraphs of prose — zero deterministic pre-aggregation reaches this call.

**What could be mechanically prepared from existing data:** The same `rbacRequirements` catalog, filtered to just this module's own capabilities, exactly the way it's already filtered/rendered for the repo-report stage (confirmed: `02-generate-repo-report.ts` already consumes this exact same catalog for its own RBAC Requirements Catalog section). This is not new deterministic computation — it's an already-built, already-proven aggregation that simply isn't wired down one level to the module-reduce call.

**What genuinely requires synthesis:** Interpreting whether an asymmetry (capability A enforces a permission for a sensitive operation, capability B performs a comparably sensitive operation with no permission attached) is architecturally significant enough to name as a cross-cutting risk.

**What genuinely requires judgment:** Whether two operations are "comparably sensitive" — this is not deterministically derivable from the current fact model and correctly remains LLM judgment.

**Recommended V1-B responsibility boundary:** Wire the module-filtered RBAC catalog into `01c`'s prompt alongside (not instead of) the per-capability prose extracts. This directly matches the target shape you hypothesized — deterministic security matrix → LLM evaluates architectural significance — and is likely one of the cheapest, highest-confidence changes in this whole review: no new extraction, no new algorithm, just plumbing an existing, already-validated deterministic artifact one level further down the pipeline than it currently reaches.

---

## Section 13 — cross-cutting Risks & Open Questions

**Available deterministic inputs, checked one by one against your candidate list:**
- Conflicting ownership indicators → partially available (Section 6's ownership hints, already audited — a real but partial signal).
- Unresolved call edges → **exists deterministically** (`unresolvedCallEdges` in `04-build-resolved-graph.ts`, repo-wide, with per-edge detail) but confirmed **not passed into `01c`'s prompt at all** — no reference to it anywhere in `01c-generate-assembly-first-profile.ts` or the reduce contract.
- Permission asymmetry → covered by the Section 9 finding above, once wired through.
- Destructive operations without corresponding permission evidence → **not currently aggregated anywhere.** No `permission_error`/"permission-denied without RBAC string" aggregation exists in `04-build-resolved-graph.ts` — zero hits. This would require genuinely new deterministic work (a new aggregation pass, not just re-wiring an existing one), which is correctly out of scope for V1 per the "no new Phase 1 extraction" constraint already agreed between us.
- Shared persistence paths, contradictory capability conclusions, external-boundary counts, missing deterministic mappings → none of these have a ready-built aggregation today beyond what Section 6's audit already found (partial, ownership-hint-based).

**What is already computed:** Only the unresolved-call-edges list and the (partial) ownership hints — both already audited, both currently unreachable or only-partially-reachable from `01c`.

**What the LLM currently recomputes/discovers:** Essentially everything else on your candidate list — there is no deterministic candidate-risk-signal layer feeding Section 13 today beyond what Sections 6 and 9 already separately supply.

**What could be mechanically prepared from existing data:** Only `unresolvedCallEdges`, filtered to the current module — genuinely new value at near-zero cost, since the data already exists repo-wide and just needs the same module-filtering treatment as the Section 9 fix.

**What genuinely requires synthesis:** Recognizing when a cross-capability pattern (not visible from any single capability's own Open Questions) constitutes a real, module-level risk.

**What genuinely requires judgment:** Whether a given asymmetry or gap is significant enough to report, versus noise — this is not reducible further with today's fact model without new extraction work.

**Recommended V1-B responsibility boundary:** Section 13 stays predominantly `Synthetic`/`Judgment`, as you predicted — but add the module-filtered `unresolvedCallEdges` list as one more deterministic input alongside the ownership hints and Section 9's RBAC catalog, since it's free (already computed, just needs the same wiring fix) and directly matches one of your own candidate signal types. Do not attempt to build the destructive-operations-without-permission-evidence signal or any of the other unaggregated candidates for V1 — correctly out of scope, would require new Phase 1/aggregation work, not a contract rewrite.

---

## Updated Section 9/13 row for the audit table

| Area | Current classification | Confidence |
|---|---|---|
| Reduce Section 9 — deterministic RBAC input | **Available but not wired** — real fix, near-zero cost | Confirmed |
| Reduce Section 9 — architectural significance judgment | Judgment | Confirmed |
| Reduce Section 13 — unresolved-call-edge signal | **Available but not wired** — same fix pattern as Section 9 | Confirmed |
| Reduce Section 13 — remaining candidate signals | Not currently computed; would require new extraction/aggregation work | Confirmed, correctly out of scope for V1 |
| Reduce Section 13 — cross-cutting risk judgment | Synthetic/Judgment | Confirmed |

---

## One pattern worth naming across all three audits so far (Sections 6, 9, 13)

Two of the three sections' improvements turn out to be **wiring gaps, not missing deterministic capability** — the RBAC catalog and the unresolved-call-edges list both already exist, repo-wide, built for other consumers (the repo-report stage), and simply never got threaded down to the module-reduce call. This is a meaningfully different (and cheaper) category of fix than Section 3's "replace LLM discovery with new deterministic assembly" or Section 6's "tighten the judgment framing around an existing partial signal." Worth stating explicitly in whatever V1-B scope document comes out of this: at least two of its changes are literally "pass an existing variable one call further down," not new design work.

Ready to proceed with drafting V1-A and V1-B scopes with this evidence, or continue the audit to Sections 1 and the API Reference structure first if you'd rather have full coverage before scoping either rewrite.
