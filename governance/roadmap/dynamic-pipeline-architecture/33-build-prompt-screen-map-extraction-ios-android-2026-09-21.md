# Build prompt: real "screen map" skeleton for iOS/Android — same exercise as doc 32, different mechanics

Hand-off prompt for a new session, drafted 2026-09-21. Not yet dispatched/run as of writing
this file. Same real goal as
`governance/roadmap/dynamic-pipeline-architecture/32-build-prompt-screen-map-extraction-2026-09-21.md`
(a human-editable JSON "screen map" — real route/screen → component, with a `description`
field intentionally left `null` for the user to hand-fill) — for `ios-oskey-dev` and
`android-intercom-oskey-io` this time. Read this file, not just this prompt, for the full real
motivation (why a screen map plausibly helps the turn-budget/UX-context problem) before
starting — not re-derived here. Real spend: **zero** (Postgres reads + local file writes,
no LLM/embedding calls). Never `git add`/`git commit` unless explicitly asked.

## Why this isn't a mechanical repeat of doc 32 — check before extracting, don't assume

Confirmed directly, checked before writing this prompt: neither `ios-oskey-dev` nor
`android-intercom-oskey-io` has any fact `kind` equivalent to Angular's `angular_route` — no
dedicated navigation/screen-declaration extraction exists for either platform. The real,
available signal is heuristic:

- **iOS**: real `struct_declaration` facts with names ending in `Screen` exist and look
  genuine (`OSKSettingsScreen`, `OSKInviteGuestScreen`,
  `OSKUserOnboardingEnrollMFAEnterConfirmationCodeScreen`) — 142 real facts match `%View%`
  loosely, a real but noisier superset. **Real false positives already spotted, not
  hypothetical**: SwiftUI preview helper structs share the same rough naming
  (`OSKHeader_Previews`, `OSKImageResizer_Previews`, `OSKAsyncCachedFirebaseImage_Previews`) —
  these are not real screens and must be filtered out, not included.
- **Android**: the real, stronger signal is the **file path**, not the class name — real
  screen files live under a `ui/screens/...` path convention
  (`app/src/main/java/io/oskey/intercom/ui/screens/reset/OSKResetFactoryScreen.kt`). Matching
  on symbol name alone (`%Activity%`/`%Fragment%`/`%Screen%`) pulls in real false positives
  from the same folder — `ViewModel`, `State`, and other non-screen classes that happen to sit
  beside a real screen file (confirmed: `OSKBaseBenchmarkViewModel` matched a naive
  name-based query above).

## What to do

1. **Verify the real, reliable pattern for each platform before extracting anything** — don't
   trust the naive heuristics above blindly (they were a quick check, not a validated rule).
   For iOS: check whether `Screen`-suffixed `struct_declaration` facts (minus anything ending
   in `_Previews`) reliably correspond to real, user-facing SwiftUI screens — spot-check a
   real sample against what you can tell from the symbol/file context. For Android: use the
   real `ui/screens/...` path convention as the primary filter (not bare name matching), and
   check whether real screens (not `ViewModel`/`State`/helper classes in the same folder) can
   be reliably distinguished by `kind` (e.g. is there a real `kind` — `source_class`,
   `kotlin_object` — that correlates with "this file's top-level declaration IS the screen,"
   as opposed to a helper class in the same file/folder)? Report the real pattern found,
   including its real, honest limitations — a heuristic that's "mostly right, with N known
   real exceptions" is a fine, usable outcome; don't force false precision.
2. **Extract one JSON file per repo** (suggest
   `governance/roadmap/dynamic-pipeline-architecture/screen-map-ios.json` and
   `screen-map-android-intercom.json`, or ask if unsure), same real shape as doc 32's:
   ```json
   {
     "screenSymbol": "OSKSettingsScreen",
     "kind": "struct_declaration",
     "file": "real/path/from/the/fact",
     "realContext": "whatever real, code-derived context the fact's own description already carries -- verbatim, not invented",
     "screenName": null,
     "description": null
   }
   ```
   `screenName`/`description` stay `null` — **do not fill them in, do not guess a
   plausible-sounding description from the symbol/file name alone.** Same rule as doc 32, for
   the same reason: this is explicitly human-in-the-loop.
3. **Report real counts and real honesty about the heuristic's limits**: how many real
   candidates found per repo, how many likely-false-positives were filtered and on what basis,
   and any real cases genuinely ambiguous enough to flag rather than silently include/exclude
   (matches this project's own "fail loud on real ambiguity, don't silently guess" convention
   — see `build-cross-repo-edges.ts`'s own compound-key join for the precedent).

## Explicitly not done here (separate, later tasks)

- Do not fill in `screenName`/`description` yourself.
- Do not wire either file into `GROUNDING_DOCS` or any other prompt-injection mechanism.
- Do not run any real test comparing behavior with/without the map — a real-spend test for a
  later session, once the human descriptions are filled in (same as doc 32).
- If the real heuristic turns out too unreliable to produce a trustworthy candidate list for
  either platform, say so plainly rather than shipping a noisy file — a real, honest "this
  needs a different real signal, not this one" finding is a valid outcome of step 1.
