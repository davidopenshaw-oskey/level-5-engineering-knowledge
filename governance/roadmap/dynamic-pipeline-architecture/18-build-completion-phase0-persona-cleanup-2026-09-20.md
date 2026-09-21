# Build completion: Phase 0 — skill.v3/template.v2 staleness cleanup + `stories` rename

Built 2026-09-20, against the Phase 0 spec in
[17-build-plan-pm-directed-scope-and-persona-cleanup-2026-09-20.md](17-build-plan-pm-directed-scope-and-persona-cleanup-2026-09-20.md).
Scope deliberately stayed narrow to Phase 0's four sub-tasks — Phases 1-5 of doc 17
untouched, no shared-reference-file architecture designed or built. No real spend (text/
schema edits only, no LLM/embedding calls). No commits made, per standing rule.

## 1. Rekeyed "Section-specific guidance" from heading-name to (kind, freedom)

`mcp-server/skills/prd/skill.v3.md`'s "Section-specific guidance" section keyed its
per-section behavior guidance to heading text ("Technical Proposal", "Constraints") that no
longer matched `template.v2.md`'s real current headings ("Codebase Findings & Starting
Points", "Probable Constraints"). The actual fix was not to resync the names — heading text
is chosen freely by whoever writes a template and carries no meaning for the model; only a
section's `kind` and `freedom` annotations do. Replaced the whole section with guidance keyed
to `kind`+`freedom` combinations instead: `list, checkable=true` at low/medium freedom (EARS
wording), `cited-list` at high/bounded freedom (optional grouping), and `stories`/`cited-list`
at low freedom (fixed shape, no guidance needed). This makes the section correct regardless of
what any future template calls its headings.

## 2. Removed `v1` self-references; fixed stale `skill.md` cross-references

Both files carried a literal `v1` comparison the model has never seen and gains nothing from:
- `skill.v3.md`'s old line 72 — folded away as part of the rewrite in item 1 above (the
  replacement text states the current freedom level directly, no v1 comparison).
- `template.v2.md` line 21 — `<!-- freedom: low/medium (fixed, cited, unchanged from v1) -->`
  → `<!-- freedom: low/medium (fixed, cited) -->`.

Also fixed `template.v2.md` lines 9/13/17's stale `"see skill.md"` → `"see skill.v3.md"`,
found adjacent to the v1 cleanup during the same pass.

## 3. Renamed `user-stories` kind to `stories`

Real, functional justification: `"user-stories"` is PRD-specific naming that doesn't fit
future non-PRD use-cases (impact-analysis, wiki-docs) per
[[project_dynamic_pipeline_architecture_initiative]]'s broader direction, and the literal
string never appears in rendered output — confirmed it lives only in the Zod schema, a
switch-case discriminator, and template `<!-- kind: --> `comments that are stripped before
rendering. No backwards-compatibility alias needed.

**Live files changed (confirmed by grep before and after; `npx tsc --noEmit` clean on all
touched `.ts` — see §5):**
- `mcp-server/agent-poc/section-content.ts` — `z.literal("user-stories")` → `"stories"`
  (schema), `case "user-stories":` → `case "stories":` (renderer switch), and the adjacent
  comment on line 71 referencing the kind name.
- `mcp-server/agent-poc/capability-fanout-prd-agent.ts` — `mergeOneHeading()`'s
  `case "user-stories":` → `case "stories":`, the `Extract<SectionContent, { kind:
  "user-stories" }>` type extraction → `"stories"`, and the `{ kind: "user-stories", items }`
  return object → `{ kind: "stories", items }` (all three sites in the same function).
- `mcp-server/skills/prd/template.v2.md` — `<!-- kind: user-stories -->` → `<!-- kind: stories
  -->`.
- `mcp-server/skills/prd/skill.v3.md` — the "Output format" example JSON
  (`{ "kind": "user-stories", ... }` → `{ "kind": "stories", ... }`), the `goal`/`reason`
  prose reference, and the rewritten guidance in §1 above (which already used `stories`).

**"Needs a live-status check" files — checked directly, not assumed:**

- **`mcp-server/skills/prd/template.md` — LIVE, renamed.** Confirmed via grep that
  `atomic-prd-agent.ts`'s exported `DEFAULT_TEMPLATE_PATH` constant
  (`mcp-server/agent-poc/atomic-prd-agent.ts:49`) still points at this exact file, and that
  `capability-fanout-prd-agent.ts` imports and falls back to that same constant
  (`TEMPLATE_FILE = process.env.TEMPLATE_FILE ?? DEFAULT_TEMPLATE_PATH`,
  `capability-fanout-prd-agent.ts:645`) whenever `TEMPLATE_FILE` isn't set in the environment.
  Confirmed `template.ts`'s parser (`KIND_RE` regex, `template.ts:29`) reads the `<!-- kind:
  ... -->` comment literally and casts it straight to `SectionContent["kind"]` with no
  translation layer — so leaving `template.md`'s `<!-- kind: user-stories -->` unrenamed
  would have broken at runtime against the renamed schema literal the moment this file was
  used as a fallback. Renamed line 8 to `<!-- kind: stories -->` to match.
- **`mcp-server/skills/prd/skill.md`, `skill.v2.md` — DEAD, left untouched.** Grepped the
  whole `mcp-server/` tree for `skill.md` and `skill.v2.md` as literal filename references in
  `.ts`/`.json`/`.sh` files: zero hits outside the files themselves. Confirmed
  `atomic-prd-agent.ts`'s `DEFAULT_PERSONA_PATH` deliberately points at a different,
  already-nonexistent path
  (`governance/roadmap/mcp-direction/atomic-prd-agent-persona.md`, by design — see that
  file's own line 40-41 comment: meant to fail loudly, not silently fall back). Neither
  `skill.md` nor `skill.v2.md` is a default or fallback for `PERSONA_FILE` anywhere. Since
  they're not live, left their `user-stories` references as-is — renaming dead files isn't
  part of this task's real scope, and doing so would be effort spent on files nothing reads.

## 4. Full re-read after edits

Re-read `skill.v3.md` and `template.v2.md` in full after all edits (not just the lines
identified during prep). No further stale artifacts found — no remaining `v1` references, no
remaining stale heading names, no remaining `user-stories` strings, no remaining `skill.md`
(non-versioned) cross-references. Both files are now internally consistent.

## 5. Typecheck

Ran `npx tsc --noEmit` from `mcp-server/` after all edits. Zero errors in any file touched by
this task (`section-content.ts`, `capability-fanout-prd-agent.ts`, `template.ts`,
`atomic-prd-agent.ts` — the latter two unmodified but re-checked for knock-on breakage).

Seven pre-existing errors remain, all in `pipeline/facts-postgres-index/` files this task
never touched (`_shared/render-evidence.ts`, `_shared/technical-proposal.ts`,
`decommissioned_generate-atomic-prd.ts` — the last already `decommissioned_`-prefixed), all
the same `Property 'factId' does not exist` shape, unrelated to the `stories` rename or the
persona/template edits. Pre-existing baseline noise, not introduced by this build.

## Not touched (confirmed out of scope, per doc 17)

Nothing under `governance/roadmap/` or `governance/adrs/` was edited. No `decommissioned_`-
prefixed file was edited. No Phase 1-5 work from doc 17 (structured in-scope-platforms
schema, `routeCapabilities()`/`main()` changes, the new generic directive-prioritization
rule, advisory routing safety net, human checkpoint) was started or designed — including no
shared-reference-file architecture for future personas, which was explicitly out of scope for
this build per the discussion that produced doc 17.
