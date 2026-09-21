# Build prompt: Phase 2 — explicit in-scope-platforms orchestration

Hand-off prompt for a new session, drafted 2026-09-20, building Phase 2 of
[17-build-plan-pm-directed-scope-and-persona-cleanup-2026-09-20.md](17-build-plan-pm-directed-scope-and-persona-cleanup-2026-09-20.md)
(itself following [16-plan-explicit-pm-directed-scope-2026-09-20.md](16-plan-explicit-pm-directed-scope-2026-09-20.md)).
Phase 1 (the structured "In-scope platforms" format) is done — real-tested via a parse-only
script against the actual `1b` file, real bug found and fixed during that test (a greedy
`\s*` matched newlines and broke the parser; fixed with `[ \t]*`). This prompt is Phase 2
only — the orchestration change that actually reads and acts on that format. Do NOT build
Phase 3 (the `skill.v3.md` generic directive-prioritization rule) as part of this — it's a
separate, later phase; note where this task's output would eventually connect to it, but
don't write it. Never git add/commit unless explicitly asked. Write a completion doc at
`governance/roadmap/dynamic-pipeline-architecture/24-...` (next available number) when done.

## Decision made before this prompt, not open

**Coexist, with a fail-closed distinction — resolved directly in discussion, not left open
for this session to decide:**
- No `**In-scope platforms**:` marker anywhere in the business request → treat it as
  old-style, unstructured (like `1a-ownernonresident.txt`) → use the existing, unchanged
  `routeCapabilities()` automated vector-routing path.
- Marker present, parses to **zero** valid platform entries → **fail closed**
  (`[Fail-Closed]` throw, matching this project's existing convention throughout this file
  and `sync-facts.ts`) — do NOT silently fall back to automated routing. A malformed
  explicit-scope attempt silently reverting to automated routing would defeat the entire
  point of this feature and mask a real authoring mistake.
- Marker present, parses to ≥1 valid entries → use the new explicit-scope path below.

## Real, previously-unaddressed requirement found while scoping this prompt

`CapabilityCandidate` (`capability-fanout-prd-agent.ts:57-61`) and `search()`'s
`moduleFilter` (`db/search.ts`) identify a capability by **module name alone, with no repo
filter at all**. This is a real problem for "one capability per real `(repo, module)`
pair," which is the whole point of Phase 2 (see doc 16 §4, doc 17 Phase 2 step 3): the same
module name recurs across different repos (confirmed multiple times this session — e.g.
`features` exists in both `firebase-oskey-dev` and `angular-app-oskey-io`). Without a repo
filter, scoping a capability to "the `building` module of `firebase-oskey-dev`
specifically" is not actually possible today — `search_facts` would silently search
`building` across every repo that has it. This needs a real, additive fix to `search()`
before Phase 2's capability-spawning logic can be correct, not an oversight to route around.

## Step 1 — additive `repoFilter` on `search()` (`mcp-server/db/search.ts`)

Mirror the existing `opts.crossModuleMargin` pattern (docs 09-11) exactly — additive,
optional, zero effect on any caller that doesn't pass it:

```ts
export async function search(
  query: string,
  limit?: number,
  moduleFilter?: string,
  opts?: { crossModuleMargin?: number; repoFilter?: string }
): Promise<SearchResponse>
```

When `repoFilter` is set (only meaningful alongside `moduleFilter` — a repo filter with no
module filter is a real, valid future case but not needed here), add `AND repo = $N` to the
existing SQL (both the `moduleFilter`-present and `moduleFilter`-absent branches currently
in `search()` — check both, since `repoFilter` should be usable independently of whether
`crossModuleMargin` is also set). Existing callers (`routeCapabilities()`'s own unfiltered
call, `atomic-prd-agent.ts`'s tools) pass nothing new — behavior unchanged for them.
Thread this through `makeCapabilityTools()`'s `searchFacts` tool (currently scoped by
`moduleFilter` alone) so a capability's search is genuinely scoped to one real
`(repo, module)` pair, not just a module name.

Run `npx tsc --noEmit` after this step — confirm zero new errors before continuing.

## Step 2 — the "In-scope platforms" parser

Reuse the real, tested logic validated in the earlier parse-only test (not this repo's own
file — it was a throwaway script, already deleted per cleanup discipline; reproduce the
validated regex, don't re-derive from scratch and risk reintroducing the same bug that test
caught):

```ts
interface PlatformEntry {
  name: string;
  repos: string[];
  directive: string;
}

function parseInScopePlatforms(markdown: string): PlatformEntry[] {
  const sectionMatch = markdown.match(/\*\*In-scope platforms\*\*:\s*\n([\s\S]*?)(?=\n\*\*[^*]+\*\*:|\n*$)/);
  if (!sectionMatch) return [];
  const sectionText = sectionMatch[1];
  const entries: PlatformEntry[] = [];
  const entryRe = /^- (.+?)[ \t]*\n((?:^[ \t]+<!--.*-->[ \t]*\n?)*)/gm;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(sectionText)) !== null) {
    const name = m[1].trim();
    const metaBlock = m[2];
    const repoMatch = metaBlock.match(/<!--\s*repo:\s*(.+?)\s*-->/);
    const directiveMatch = metaBlock.match(/<!--\s*directive:\s*(.+?)\s*-->/);
    entries.push({
      name,
      repos: repoMatch ? repoMatch[1].split(",").map(r => r.trim()).filter(Boolean) : [],
      directive: directiveMatch ? directiveMatch[1].trim() : "",
    });
  }
  return entries;
}
```

Real, already-confirmed behavior to preserve: correctly excludes the "Explicitly out of
scope" section and any other `**Section**:` block from being parsed as platforms (tested);
correctly handles multi-repo comma-separated lists (tested); correctly returns the literal
`"?"` for an unfilled directive rather than crashing or silently dropping it (tested,
matches real content already in `1b`).

An entry with an empty `repos` array (malformed `<!-- repo: -->` or missing tag entirely)
should count toward "zero valid platform entries" for the fail-closed check above if it's
the *only* entry parsed — but if some entries are well-formed and one specific entry is
malformed, that's a narrower, real design question this session should flag rather than
silently drop the one bad entry: does one malformed platform entry fail the whole request,
or just get skipped with a loud warning? Not decided in the discussion that produced this
prompt — make a real, defensible choice and state which one, don't leave it ambiguous.

## Step 3 — orchestration in `main()`

After reading `businessRequest`, check for the marker (`businessRequest.includes("**In-scope
platforms**:")` or equivalent) before deciding which path runs:

- **Marker absent**: call `routeCapabilities()` exactly as today, unchanged.
- **Marker present, `parseInScopePlatforms()` returns entries**: for each entry, resolve its
  `repos` list to real `(repo, module)` pairs — batch this as one query across all entries'
  repos combined (`SELECT DISTINCT repo, module FROM facts WHERE repo = ANY($1::text[])`),
  not one query per entry, to keep this step free and simple. Group the results back by
  which platform entry named that repo. Spawn one capability per real `(repo, module)` pair
  — not one per platform bullet (doc 16 §4's explicit reasoning: doc 11's evidence that
  narrowly-scoped capabilities finish more reliably than broadly-scoped ones). If a
  platform's `repos` list names a repo with **zero** real modules in `facts` (e.g. a typo,
  or a repo never synced), that's a real, reportable condition — decide and state whether
  this fails closed for that one platform or the whole run, same discipline as the malformed-
  entry case in Step 2.
- **Marker present, zero entries parsed**: `[Fail-Closed]` throw.

## Step 4 — thread the directive into `renderCapabilityContract()`

Each spawned capability needs the *platform's* directive text (not a per-resolved-module
directive — the PM wrote one directive per platform bullet; if that platform resolves to
several real `(repo, module)` pairs, every capability spawned from it gets the *same*
directive text). Extend `renderCapabilityContract()`'s signature to accept an optional
directive string and inject it as a per-run fact, same category of content it already
injects (module scope, template headings) — not new behavioral judgment. An empty or `"?"`
directive should render as no additional instruction (or an explicit "no specific starting
query given" fact) rather than literally injecting the string `"?"` into the model's system
prompt as if it were real guidance.

**Not this task's job**: teaching `skill.v3.md` to specially prioritize this directive as a
first search (that's Phase 3, a separate build). This task only needs the fact to genuinely
reach the model's context — Phase 3 is what makes the model treat it specially once it's
there. State this explicitly in the completion doc so it's clear the mechanism is only half
built until Phase 3 lands.

## Step 5 — offline, free dry-run test before any real spend

Before any real LLM call, write a small, temporary script that exercises the whole new path
end-to-end except the actual `ai.generate()` calls: parse `1b`'s real file, resolve its
platforms to real `(repo, module)` pairs via a real (free) Postgres query, and print exactly
which capabilities *would* be spawned and with what directive text each would receive.
Confirm this matches real expectations (5 platforms in `1b`, each resolving to exactly one
real module given their current single-repo `<!-- repo: -->` values) before spending
anything. Delete this script after recording its output in the completion doc, per this
project's diagnostic-script-cleanup rule.

## Step 6 — real spend, flag explicitly before running

Only after Step 5's dry run confirms the mechanism resolves and spawns correctly: **flag
explicitly and wait for approval** before running a real, full capability-fanout test
against `1b` using the new explicit-scope path. Real cost — this project's own recent
comparable runs ranged $0.51-$1.20 for 5 capabilities; report the real number, don't
estimate from memory (the last two real estimates given in this project were both wrong,
corrected after the fact — state a number only after checking real per-run costs from
`governance/roadmap/dynamic-pipeline-architecture/11-...md`'s own table, and still expect to
correct it afterward if it differs).

## Standing rules

- Never `git add`/`git commit` unless explicitly asked.
- Flag every real-spend step separately and explicitly, never bundled into a bigger step's
  description.
- This is Phase 2 only — Phase 3 (skill.v3.md rule), Phase 4 (advisory routing safety net),
  Phase 5 (human checkpoint UX) are separate, later builds per doc 17. Don't start them.
