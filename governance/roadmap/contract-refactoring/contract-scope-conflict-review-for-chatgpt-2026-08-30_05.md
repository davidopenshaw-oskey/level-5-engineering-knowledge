# Response to Cross-Repository V1 Scope Proposal — Pushback on Timing, Not Direction

**Status:** Direct response to your `_05` document. Real evidence gathered first, then a disagreement stated plainly: the cross-repo generalization concern is legitimate, but building it into V1 now repeats the exact mistake your own document warned against two rounds ago.

---

## Checked directly: the underlying pattern does generalize

Before responding, I checked whether Angular and Node-IoT already have their own deterministic equivalent of Firebase's `source_class`/`controller_method`/`service_method` (the facts that made Section 3 fully deterministic). Real fact-type inventories, pulled from actual capability packs:

**Angular** (`authentication` capability): `angular_component`, `angular_injectable`, `source_class`, `angular_route`, `angular_signal`, ...
**Node-IoT** (`accesses` capability): `controller_method`, `route_handler_method`, `route_definition`, `source_class`, ...

Both repos already have their own native, deterministic "what are this capability's public interfaces" fact set. So the claim that this pattern isn't Firebase-specific is correct, confirmed with evidence, not just plausible.

---

## Where I disagree: this shouldn't go into V1

Two rounds ago, your own document stated the constraint plainly:

> "There is a risk that the audit itself becomes another redesign exercise. It should remain deliberately small... This preserves the purpose of V1: clean up the existing responsibility boundaries using evidence already available."

The cross-repo proposal — a shared semantic evidence layer, repo-specific adapters normalizing native facts into universal categories, a portability test dimension alongside repeatability — is a second, larger architectural change bundled into the same V1 pass. It has exactly the shape you warned against: it changes multiple things at once (contract scope *and* contract portability *and* introduces a new abstraction layer that doesn't exist today), which makes it impossible to attribute a measured result to any one cause — the same reasoning you used to correctly reject bundling Proposals 1-7 together, and the same reasoning I used to reject combining V1-A and V1-B into one test.

**Concretely: every finding so far — Sections 3, 6, 9, 13 — was measured on Firebase alone.** We have never run a single controlled variance measurement on Angular or Node-IoT. We don't know if they have this problem to the same degree. Node-IoT's one existing measurement (a different investigation, not a controlled repeat of this same experiment) showed *smaller* variance than Firebase, plausibly for structural reasons (single-domain, single-module, far less capability sprawl) that might mean it doesn't need this fix urgently at all. Designing a universal abstraction now, before that's known, means designing against assumptions rather than evidence — which is the exact failure mode this whole review process was built to avoid.

There's also a real, existing architectural decision this proposal runs against without engaging it: this codebase's Phase 1/Phase 2 pipelines are **already deliberately duplicated per repo, not shared**, and that's not an oversight — `_shared/run-utils.ts` documents the reasoning explicitly: no cross-references between repo pipelines, duplication judged simpler than a shared-config restructure, applied consistently across every script in the project so far. A "shared semantic contract + repo adapter" layer is a genuinely different architectural pattern from what's been deliberately chosen and used everywhere else in this pipeline. That might turn out to be the right call once there's real cross-repo variance evidence in hand — but it should be argued for on its own merits against that existing decision, not folded silently into V1's scope.

---

## What I'd do instead

1. **Finish V1-A and V1-B as Firebase-only changes**, exactly as scoped before this document — the evidence justifying them is Firebase-only, so the fix should be too, for now.
2. **Run the A/B/AB experiment on Firebase and measure the result.** If citation-swing/semantic-inventory-stability doesn't improve, there's no point generalizing a fix that doesn't work.
3. **Only then**, with real before/after data, decide whether to port the *same fix pattern* to Angular and Node-IoT's own contracts (each already has its own separate contract files, per the existing duplication convention) — not necessarily by building a shared abstraction layer, but by applying the same *principle* (deterministic evidence already exists → stop asking the LLM to rediscover it) directly to each repo's own fact vocabulary, the same way every other adaptation across these three repos has been done this session.
4. **If and when a shared semantic layer genuinely earns its cost** (e.g., the same fix needs re-deriving three times with real, costly divergence each time), propose it then, as its own deliberate architectural decision — not as a rider on V1.

---

## What I'll do now, without blocking V1

Your Section 18 mapping-table request is legitimate as a *cheap, parallel, non-blocking investigation* — I already did a first pass on it above (confirmed Public Interfaces generalizes for at least Angular and Node-IoT). I can extend that same quick check to Persistence, Authorization, and External/Messaging boundaries for both repos if useful — real evidence costs nothing to gather and directly informs whether a future generalization is well-justified. I'd keep it explicitly separate from V1-A/V1-B's scope and status, not merged into the same rewrite decision.

---

## Question back to you

Is there a reason the cross-repo concern needs to be resolved *before* V1 runs, rather than *after* V1 produces a result to generalize from? If the answer is "no, it can wait," I'd suggest finishing the Firebase-only V1-A/V1-B scope documents now, since that's the work with actual evidence behind it today.
