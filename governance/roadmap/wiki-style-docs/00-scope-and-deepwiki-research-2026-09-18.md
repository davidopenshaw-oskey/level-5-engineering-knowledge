# Scope capture — DeepWiki-style browsable HTML docs from existing Postgres data

Not started, not decided in detail — real research captured while fresh, per this project's own documentation discipline. Builds on `governance/roadmap/sanity-health-reporting/00-scope-and-precedent-2026-09-18.md`'s Idea 1 (now corrected to point here) and the real architecture finding that DeepWiki is agentic/graph-driven, not phase-02-style batch synthesis (`governance/adrs/adr-010.md` §7).

## Real output requirement (user, 2026-09-18)

Not markdown files — a real, browsable HTML site, relative paths and links, runnable directly in a browser (implies self-contained/offline-capable, not dependent on a live server or external links).

## Real DeepWiki structure, observed directly (not inferred from marketing copy)

Fetched two real pages from `deepwiki.com/figma/mcp-server-guide` (a repo already referenced elsewhere in this project's own market research).

**Landing/overview page, real content**:
- Repo link, last-indexed date, commit-hash reference.
- Intro description, a named architecture diagram ("Bridging Intent to Execution"), key-features section, a real comparison table, a config snippet, "Next Steps" links into the rest of the wiki.

**Sidebar navigation, real and literal** — hierarchical, multi-level, genuinely repo-specific (not a fixed template): Overview → Architecture → ... → Tools Reference (with per-tool sub-pages) → Best Practices → Reference → Glossary. Real, concrete proof of what "agent-determined structure" produces in practice, not just the abstract claim.

**A real content page, literal formatting**:
- Heading hierarchy (H1 title, H2 sections, H3 subsections).
- Real tables (e.g. a "Variable Type / Use Cases / Example Names" table).
- **Source citations, exact real format**: `[README.md327-344](https://github.com/figma/mcp-server-guide/blob/a742f0a7/README.md?plain=1#L327-L344)` — link text is `file+line-range`, href is a GitHub permalink pinned to a specific commit SHA, with `?plain=1#L<start>-L<end>` line-range highlighting.
- "On this page" secondary nav (in-page anchor links for the current page specifically, separate from the main sidebar).

## Real mapping onto data this project already has — nothing new needs extracting

| DeepWiki element (observed) | This project's existing data |
|---|---|
| Sidebar hierarchy (repo → section → sub-page) | `module`/`submodule` already on every fact row |
| Commit-pinned source citations | `extraction_runs.commit_sha` + `gitUrl` (`config/repos.json`) + `file`/`line` (every fact) |
| "Last indexed" metadata | `extraction_runs.extracted_at` |
| Architecture diagram | Generate deterministically from `cross_repo_edges`/intra-repo edges (Mermaid) — real data, not LLM-drawn |
| Wiki page prose content | The same agentic tool-calling + persona pattern already proven in `atomic-prd-agent.ts`/`capability-fanout-prd-agent.ts` |

**Real design decision this surfaces, not yet made**: DeepWiki's citations link to the real GitHub repo (external, requires internet). Given the user's own "relative paths" requirement, this project's version should instead link to the **local** clone already sitting in `output/clones/<repo>/` (from `00-scan-repo.ts`), or embed the cited source snippet directly in the page — genuinely self-contained, works offline, no dependency on GitHub being reachable. Not decided which of these two; both are real options.

## Updated real suggestions (supersedes the plain-markdown framing from earlier the same day, not contradicts the underlying architecture choice)

1. New persona (wiki-writing, not PRD-answering) — reuses all existing tools/validators.
2. Deterministic page structure from real `module`/`submodule` values, not fully agent-determined from scratch (a "fixed structure, free content" middle ground, consistent with `ADR-009`'s "degrees of freedom" framing).
3. **Real HTML renderer needed, new work**: today's `assembleDocument()` produces Markdown; nothing in this project renders directly to a linked, multi-page HTML site with a sidebar/nav today. This is the one genuinely new piece of infrastructure, not a data gap — the underlying content generation reuses everything that exists.
4. Diagrams generated deterministically from the graph (Mermaid), not LLM-drawn.
5. Citation links — local relative paths into `output/clones/`, or embedded snippets; real design decision above, not resolved here.
6. Batch driver + cross-links from real `cross_repo_edges`, one pilot module first (`android-intercom-oskey-io`'s `app` module remains the strongest small, already-fully-verified candidate as of today).

## What this doc is not

Not a build decision. Not a resolved design for the HTML renderer or the citation-linking approach — both are real, open questions for whenever this gets scoped properly.
