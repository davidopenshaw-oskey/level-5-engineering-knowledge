# Prompt 1 — Real research: how do others document a multi-repo landscape, not just a single repo?

**Standing rule: never run `git add`/`git commit`, under any circumstance. Writing to files is fine; committing is not your call — only the user commits.**

## Mode: research only. Fetch and read real primary sources directly — don't guess, don't summarize from memory, don't rely on search-result snippets alone when a real page can be fetched and read.

## Context — read first

`governance/roadmap/wiki-style-docs/00-scope-and-deepwiki-research-2026-09-18.md` — the real scope capture and DeepWiki research so far. That research only covered a **single-repo** wiki (`deepwiki.com/figma/mcp-server-guide`). This project's own real situation is a **landscape**: 9 real repos (PGO/Angular, Firebase/Cloud, Node-IoT, Kotlin intercom + Kotlin end-user app, 5 Swift/iOS repos) with real cross-repo integration flows already modeled as data (`cross_repo_edges`) — a single-repo wiki format doesn't have an obvious answer for "how do you show a Property-Manager-to-resident-phone flow that crosses 3 repos." This prompt is specifically about finding real precedent for *that* problem — a multi-repo/landscape overview — not re-covering single-repo wiki structure, which is already researched.

## Real, concrete leads to check — fetch and read directly, don't just search-snippet these

1. **Does DeepWiki itself have any real multi-repo/organization-level view?** Check Devin's own docs (`docs.devin.ai/work-with-devin/deepwiki`) and search for whether DeepWiki supports an org-wide index, a workspace view, or cross-repo linking between separately-indexed wikis — or whether it's strictly one wiki per repo with no landscape concept at all. A real, honest "it doesn't do this" is a valid, useful finding — don't force a positive answer.
2. **Backstage (Spotify's open-source developer portal)** — `backstage.io`, specifically its **Software Catalog** (System/Component/API entity model, explicitly designed to represent a landscape of many services/repos and their relationships) and **TechDocs** (auto-published, per-component docs living inside a bigger catalog). This is real, primary-source, purpose-built for exactly this project's actual shape (many repos, real relationships between them) — read the real docs directly, don't just cite that it exists.
3. **The C4 model** (`c4model.com`) and **Structurizr** — a real, named methodology specifically for architecture documentation at different zoom levels, starting from a **System Context** diagram (the whole landscape, multiple systems/repos interacting) before zooming into any single one. Check whether there's a real, documented format for the System Context level specifically (not the whole model) that could map onto a "landscape overview" page.
4. **A real large multi-repo open-source ecosystem's own aggregate documentation** — e.g. Kubernetes (many repos under `kubernetes-sigs`/`kubernetes`, one aggregate `kubernetes.io` docs site) or a comparable example you find credible. Real question: how does their docs site's information architecture actually handle "this flow touches repo A, then B, then C" — fetch a real page that demonstrates this, don't just describe the docs site in general terms.
5. **How DeepWiki itself handles a real monorepo or multi-service single repo**, as a partial proxy for the landscape question even though it's not literally cross-repo — find and fetch a real DeepWiki-indexed repo that has multiple internal services/packages with real relationships between them, and see how (or whether) it visualizes those relationships differently from a simple single-purpose repo's wiki.

## What to produce

A real, primary-source findings doc — same rigor as this project's existing `market-research/` docs (fetch and read directly, cite real URLs, distinguish "confirmed by direct fetch" from "inferred from a secondary source," honest negatives where nothing real was found). Don't propose a design for this project's own landscape page yet — that's a separate, later step once real precedent is actually in hand. Just report what's really out there.

## Output

Write to `governance/roadmap/wiki-style-docs/01-multirepo-landscape-research-<date>.md`. Include a real Sources section (every URL actually fetched, not just search-result titles).
