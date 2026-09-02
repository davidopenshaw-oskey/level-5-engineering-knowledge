# Scope Clarification, and a Real Finding on Snapshot Staleness

**Date:** 2026-09-01

## Scope clarification (resolves an open question from `03-finding-facts-are-pointers-not-payloads.md`)

That earlier document left open whether facts-only pointers are an acceptable ceiling or a gap to close by enriching extraction. Clarified directly: **this pipeline's job is to extract, index, and organize repo and inter-repo facts as a source of truth from a snapshot in time**, to generate the atomic PRD (plus whatever other docs/tools this grows into) — not to provide live source-code access itself. The dev and the agent working from that output are expected to have their own checkout and will discover the real source from the pointers this system gives them. That resolves the open question in `03`'s favor of "pointer is the right shape for this system to produce" — enriching extraction (task 1 in `05-tasklist.md`) is still worth doing where it's cheap and specific, but the general expectation that this system hands off to a human/agent with their own repo access is now the stated scope, not an unresolved question.

## A new, real problem this raises: the snapshot goes stale, and pointers drift with it

Every fact this pipeline produces is extracted from one commit, at one point in time. A dev or agent using this system's output will almost certainly be working from a *different* checkout — their own feature branch, cut from whatever the integration branch looks like *today*, not from the commit the facts were extracted from. File and line numbers are not stable across that gap: every merge that touches a file can shift every line number below the change, even when the specific thing a fact pointed to hasn't moved in any meaningful sense.

**This is not hypothetical — it already happened in the exact examples this session just traced.** Checked directly against `firebase-oskey-dev`'s real git history: the snapshot used throughout this investigation is commit `00e1d9fd` (2026-06-22), sitting on `staging` (which hasn't moved since — 0 commits). The actively-developed branch, `develop`, has **13 real merged PRs** since that snapshot, running from 2026-07-06 to 2026-08-26 (five days before today). Two of them land directly in the exact area this session just hand-traced:

- **PR #872**, "fix supplier staff field validation with update staff member and create supplier staff with access" (2026-07-17) — touches supplier staff validation directly, the same area as `04-handtrace-example4-supplier-recurring-pincode.md`.
- **PR #878**, "migrate-callable-triggers-functions-from-v1-to-v2-suppliers-sub-modules" (2026-08-17) — a structural migration of the supplier sub-module's callable functions from v1 to v2, which plausibly invalidates some of the `api_contract`/`onCall` fact shapes this session's traces relied on for that module.

Neither of these was known when `04-handtrace-example4-supplier-recurring-pincode.md` was written. Its citations may already point at code that has since moved, changed shape, or been restructured entirely.

## Strategic response (2026-09-02) — why this doesn't need solving before the POC

The staleness risk is real (demonstrated above), but it doesn't need an engineering fix to proceed with the POC, for a specific, permanent reason: **a human stays in the loop between the atomic PRD's output and any actual code change, by design, not as a temporary safety net.** The dev and agent receiving a recommendation are expected to review it *and* the current codebase themselves before starting — they are never meant to act on a citation blindly. That review step is exactly where a stale line-number pointer gets caught: the dev opens the current file, the line doesn't match, they notice immediately. The plan is to run this way for at least 6 months across hundreds or thousands of real PRs before trusting it any further un-reviewed. This changes the honest risk calculus from "stale pointers could silently mislead a fully automated system" to "stale pointers will be visibly wrong to the human checking them, at worst causing a moment of confusion, not a bad decision" — a real but bounded risk, not a blocker.

**Left open, explicitly, not blocking:** which branch this pipeline treats as its source of truth for extraction — production or staging. Not decided yet; tracked as a task.

## What this means, not yet resolved

- A file:line pointer from a snapshot has a real, measurable shelf life, and this project should know roughly how short that shelf life is for each repo (thirteen merges in ~2 months on `firebase-oskey-dev`'s `develop` alone) rather than assume it stays valid indefinitely.
- This argues for pointers that are more resilient to drift than a bare line number where possible — e.g. a symbol name plus file (something a dev/agent can re-locate by searching their own current checkout, even if the line moved) rather than treating the line number as an authoritative coordinate. Not designed here — a real candidate for how P2 should shape what it hands back.
- This also argues for a real, stated re-extraction cadence (how often Phase 1 re-runs against the current integration branch) as part of whatever P2 becomes, rather than a one-off snapshot treated as permanently current. Not decided here.
