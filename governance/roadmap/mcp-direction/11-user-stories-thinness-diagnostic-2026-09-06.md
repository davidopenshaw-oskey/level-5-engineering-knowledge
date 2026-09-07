# User Stories Thinness — Real Diagnostic, 2026-09-06

**Superseded 2026-09-06 — see `10-sectioncontent-implementation-tasklist.md` Step 12 (and Step 13 for the follow-on turn-budget findings), the more complete, current record: it includes this diagnostic's conclusion plus the actual persona fix, the two real test-run results, and further root-causing.** Kept, not deleted, specifically for the MD5/`durationMs` clone-detection method below — a real, reusable technique for spotting re-rendered/cached demo output masquerading as independent runs, useful on its own regardless of where the conclusion now lives.

**Status: a verified diagnostic finding relayed cross-session, captured here before it could be lost to a context/session boundary — not a decision, no fix built.** Raised by the user reviewing `output/agent-runs/prds/test/2026-09-06-015-...md`: its `User Stories` section is thin (2 short, mechanical, single-actor stories) compared to the same run's richer `Technical Proposal`/`Constraints` (6 specific, evidence-cited findings). Peer session (`level-5-engineering-knowledge-d2`) proposed two hypotheses and a cheap test; this session ran the test directly.

## Real correction to the premise, found by checking files directly rather than assuming

The peer's stated premise — that runs `013`/`014` had noticeably richer `Technical Proposal` content than `015` (citing intercom exclusion, cascading-deletion handling, admin-service auth checks) — **does not hold**. Diffed all three files directly:

- `013`, `014`, and `015` have **byte-identical** `Technical Proposal` and `User Stories` sections (matching MD5 hashes).
- All three share the exact same `durationMs: 220044` in their `.meta.json`, with `generatedAt` timestamps minutes apart.
- These are **not three independent generations** — they are the same one real Q1a-v2 generation, re-rendered three times under different demo names (`labelfix`/`pricingdate`/`reorder-demo`), almost certainly to test rendering fixes cheaply without re-paying for a new LLM call.
- The richer content the peer described (intercom exclusion, etc.) actually lives in run `003` (`add-ownernonresident-inhabitanttype-v2`) — which **also** shares the identical `durationMs: 220044`, confirming it is the *same* cached generation as `013`/`014`/`015`, just formatted slightly differently (no blank line between story bullets).

**Conclusion: there were four copies of one real generation on disk, not four independent data points.** The peer's proposed "compare 013/014 vs 015" test could not have told them anything about run-to-run variance, since the compared files are clones.

## The two genuinely independent real data points that do exist

The original Step 6 test runs, `001` (Q1a) and `002` (Q1b), are real, separate generations:

- **`001` (Q1a)** — 2 User Stories, both Property-Manager-perspective, mechanical phrasing ("add", "view the label").
- **`002` (Q1b)** — 3 User Stories, including a **second actor**: *"As a System Administrator, I want directly assign a building unit to an ownerNonResident account, so that resolve administrative discrepancies or bypass onboarding when necessary."* This second actor appears exactly where the real tool-call evidence supported an admin-bypass path in Q1b's business flow — Q1a's evidence never surfaced an equivalent second actor.

Small n (2 real generations), but a real, useful signal: the model **is** capable of surfacing additional actors when the gathered evidence supports it — it isn't hard-capped at "always exactly 2, always only Property Manager."

## A real third hypothesis, not named by either the user or the peer before this

The peer framed this as two competing hypotheses: (1) a persona-guidance gap (the persona gives explicit "be thorough" instructions for evidence-gathering but none for user-story/actor coverage), or (2) a context/data gap (the model never sees `governance/reference-docs/*.md`'s real business-intent/persona-authority docs, so stories stay generic rather than being grounded in real named actors and authority relationships).

**Both are plausible and not mutually exclusive, but there's a real third possibility neither one names: Q1a's thinness might not be a gap at all.** This project already has a directly analogous, hard-won lesson on record — `governance/roadmap/facts-serving-strategy/15-workflow-clustering-and-angular-ux-facts.md` Part A2 found that a UI legitimately offering fewer options than its backing type allows is *correct*, not a defect, when the UI is genuinely actor-scoped (owner/tenant-only, never resident, in the PGO). "Add a new inhabitant type" may simply be a genuinely single-actor-facing change given what the real evidence shows — the same way narrower was correct there. Q1b's richer, second-actor story emerging exactly when real evidence supported it is itself evidence for this reading: the model is evidence-following (a real strength for a fabrication-averse persona), not evidence-poor.

## Real, non-conclusive recommendation, not yet actioned

- Hypothesis 2 (reference-docs context) is probably real, but likely improves story *precision/texture* (real named actor types and authority relationships instead of generic "Property Manager") more than story *count* — and it's the only real way to know whether more actors genuinely exist to surface for a given question, rather than guessing from evidence-shape alone.
- Hypothesis 1 (an explicit "consider every affected actor" persona instruction, mirroring the persona's existing evidence-thoroughness guidance) is the cheaper, lower-risk thing to try regardless of which hypothesis dominates.
- **Whichever is tried, test it against a genuinely new real generation, not `013`/`014`/`015`/`003`** (all clones of one run) — and watch specifically for the fix producing invented-but-plausible actors rather than real, evidence-grounded ones, which would be a worse outcome than staying thin.

Not designed further here — a real, verified diagnostic to resume from, not a task in flight.
