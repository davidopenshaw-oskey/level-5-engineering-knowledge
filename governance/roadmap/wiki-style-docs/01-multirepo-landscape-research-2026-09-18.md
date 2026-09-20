# Findings — Real Precedent for Multi-Repo/Landscape Documentation (Not Single-Repo Wikis)

Follow-up to `00-scope-and-deepwiki-research-2026-09-18.md`, which covered DeepWiki's single-repo wiki structure directly (`deepwiki.com/figma/mcp-server-guide`). That research has no obvious answer for this project's real shape: 9 repos with real cross-repo flows already modeled in `cross_repo_edges` (e.g. a Property-Manager action crossing into a resident's phone across 3 separate repos). This doc researches the 5 real leads in `prompts/prompt-1-multirepo-landscape-research.md` directly — fetching and reading primary sources, not relying on search snippets alone where a real page could be fetched. No design recommendation for this project's own landscape page is made here — that is a later, separate step.

---

## 1. Does DeepWiki itself have any org-wide/landscape concept?

**Honest negative, confirmed by direct fetch: no. DeepWiki is strictly one wiki per repo, with no cross-repo linking or landscape concept.**

Direct fetch of `docs.devin.ai/work-with-devin/deepwiki` found no mention of org-wide indexing, workspace-level aggregation, or cross-repo linking anywhere in the page. The documentation frames DeepWiki entirely per-repository: *"Devin now automatically indexes your repos and produces wikis with architecture diagrams, links to sources, and summaries of your codebase"* — plural "repos" refers to indexing many repos independently, each producing its own separate wiki, not a shared landscape view across them. Configuration is per-repo (`.devin/wiki.json`), reinforcing that each wiki is self-contained.

Direct fetch of `cognition.com/blog/deepwiki` (Cognition's own product blog post) is consistent: *"Add any public repo for free at deepwiki.com... users replace 'github.com' with 'deepwiki.com' in a URL to view documentation for that specific repo."* No enterprise/team feature description spans multiple repos in one view.

**One real nuance worth flagging honestly**: a secondary source (search-snippet only, not directly fetched — a third-party guide, `codersera.com/blog/deepwiki-complete-guide-2026`) claims *"The Teams and Enterprise tiers offer additional features such as organization-wide repository indexing, shared wiki access for development teams..."* — but a follow-up search of Devin's own docs indicates *"organization"* in this context is a billing/access-control concept (sign in under an org in `app.devin.ai`, an org owns a paid subscription that lets its members index and access repos), **not** a cross-repo linking or landscape-view feature. Each repo indexed under an org still gets its own independent wiki; nothing found (in either the direct-fetch docs or the search results) describes an org-level aggregate view spanning multiple repo wikis. Treat the "organization-wide indexing" phrase as about *access*, not *aggregation* — this reading is inferred from secondary sources, not confirmed by a direct fetch of an org-level DeepWiki feature page (no such page was found to exist).

**Net**: this is a real, useful negative. DeepWiki has genuinely not solved the landscape problem — there is no precedent to borrow from it beyond the single-repo wiki structure already documented in `00-...md`.

---

## 2. Backstage — Software Catalog (System/Component/API model) and TechDocs

**Confirmed by direct fetch: Backstage's Software Catalog is real, purpose-built precedent for modeling a landscape of many repos/services and their relationships — but its actual cross-component *visualization* is a fairly thin graph, and TechDocs itself (the docs-hosting piece) stays strictly scoped to one component per doc site.**

### Catalog entity model (direct fetch, `backstage.io/docs/features/software-catalog/system-model/`)

The model is a real hierarchy, not a flat list:
- **Component** — "individual pieces of software" (a mobile feature, web site, backend service, or data pipeline); can provide/consume APIs and depend on Resources.
- **API** — the boundary between components; explicitly framed as *"an important (maybe the most important) abstraction that allows large software ecosystems to scale"*; can be public, restricted, or private.
- **Resource** — infrastructure a component needs at runtime (databases, pub/sub topics, buckets, CDNs).
- **System** — *"a collection of resources and components that exposes one or several public APIs"* — the encapsulation boundary that lets internals change without breaking external consumers.
- **Domain** — groups related Systems that *"share terminology, domain models, metrics, KPIs, business purpose, or documentation."*

This is a real, named, four/five-level entity model built specifically to represent "many repos and how they relate" — directly on-point for this project's problem shape (9 repos, cross-repo flows), more so than anything else researched.

### TechDocs (partial direct fetch + search; one URL 404'd)

`backstage.io/docs/features/techdocs/introduction` returned HTTP 404 on direct fetch (wrong/moved path). `backstage.io/docs/features/techdocs/techdocs-overview` was also attempted but returned no retrievable body content on this fetch. The scoping claim below is therefore **inferred from a secondary source** (search-result synthesis of `backstage.io/docs/features/techdocs/` and related pages), not a full direct-fetch confirmation:

- TechDocs is *"Spotify's homegrown docs-like-code solution built directly into Backstage"* — engineers write Markdown that lives with their code; Backstage builds it into a doc site.
- Docs are discovered *"from the Service's page in Backstage Catalog"* — i.e., one docs site is attached to one catalog entity via a `backstage.io/techdocs-ref` annotation and a `/docs` folder in that entity's own repo.
- No mechanism was found (in any fetched or searched page) for a single TechDocs page to be authored as spanning multiple catalog entities/components natively. TechDocs' scope is per-entity; anything cross-entity has to be built as a separate catalog feature layered on top (see below), not as a TechDocs capability itself.

### The real cross-component visualization: Catalog Graph plugin (direct fetch, `github.com/backstage/backstage/blob/master/plugins/catalog-graph/README.md`, plus `backstage.io/docs/features/software-catalog/creating-the-catalog-graph/`)

This is the actual "landscape view" mechanism in Backstage, and it is a separate plugin, not TechDocs:
- *"The catalog graph visualizes the relations between entities, like ownership, grouping or API relationships"* — built from *"descriptors as nodes and relations as edges."*
- Three real pieces: `EntityCatalogGraphCard` (shows entities directly related to the *current* entity, on that entity's own page), `CatalogGraphPage` (a standalone, catalog-wide graph viewer users can navigate and filter by relation type), and `EntityRelationsGraph` (a raw React component for custom graphs).
- **A real, honest limitation, stated in Backstage's own docs**: *"[the catalog] may not be the ideal solution for tracking dynamic relationships between components and services in real-time"* — real-time views require *"attaching appropriate tooling to the nodes in the graph through annotations and developing custom front-end plugins."* The catalog graph is a static/declared-relations graph (ownership, API-provides/consumes, part-of), not a flow/sequence visualization — it shows *that* components relate, not the *order/direction* of a business flow crossing them (e.g. it wouldn't natively render "PM action → repo A → repo B → resident's phone" as a directional flow; it would show A and B as related nodes without sequence semantics).
- A real open GitHub issue was surfaced by search (`backstage/backstage#4394`, *"feat: Generate map of an entire system"*) indicating this "map the whole system" capability was, at least at some point, a requested-but-not-fully-solved feature within Backstage itself — consistent with the "may not be ideal" caveat in the docs. This issue's existence/title is from a search result, not independently opened and read in full; flagged as a secondary-source data point, not a confirmed deep-dive.

**Net**: Backstage is real, purpose-built precedent for the *entity model* (System/Component/API/Domain) that maps cleanly onto "many repos and their relationships," and it does ship a real, working cross-entity graph visualization (Catalog Graph). But even Backstage's own docs concede that graph is a relations/ownership map, not a rich flow-across-services documentation format — and TechDocs (the actual prose-docs piece) does not natively span components at all.

---

## 3. C4 model (c4model.com) and Structurizr

**Confirmed by direct fetch: there is a real, named, documented top-level diagram for exactly this — the System Landscape diagram — distinct from System Context, plus a real DSL syntax for it in Structurizr.**

### System Context vs. System Landscape (direct fetch, `c4model.com/diagrams/system-context` and `c4model.com/diagrams/system-landscape`)

System Context is *not* the landscape-level diagram, despite being the "top" of the four C4 levels (context/container/component/code) — it's still scoped to **one** software system and the actors/external systems directly touching it: *"The focus should be on people... and software systems rather than technologies, protocols and other low-level details"* — but centered on one system.

**System Landscape is the real, separate, correctly-named level for this project's actual problem.** Direct quote: *"The system context, container, component, and code diagrams are designed to provide a static view of a **single software system** but, in the real-world, software systems never live in isolation."* And: *"From a practical perspective, a system landscape diagram is really just a system context diagram without a specific focus on a particular software system"* — it shows the *whole portfolio* of systems and how they interconnect, with C4's own docs framing it as *"a map of the software systems within the chosen scope, with a set of system context, container, component, and code diagrams for each software system of interest"* and recommending it explicitly *"particularly for larger organisations — it's a bridge into the enterprise architecture world."*

This is a real, named, general answer to "what's the top-level landscape view called and what does it show" — directly on point.

### Structurizr's real, documented format for it (direct fetch, `docs.structurizr.com/dsl/language`, plus search-confirmed syntax)

Structurizr (the C4 model's own reference tooling, same authors) has a real DSL keyword for exactly this level:
```
systemLandscape [key] [description] {
    ...
}
```
vs. `systemContext <software system identifier> [key] [description] { ... }`, which requires naming one specific system as the scope. The landscape variant takes no system identifier — it renders *"all people and software systems in the architecture at a high level."* A real example syntax (from search-confirmed DSL usage, not itself independently re-verified against a live rendered diagram): `systemLandscape "landscape" { include * autolayout lr }`, i.e. `include *` pulls in every system/person in the model rather than filtering to one system's neighbors.

Attempting to fetch `docs.structurizr.com/ui/diagrams/system-landscape-view` directly for a rendered real-world example returned only a stub page (a heading and a link back to c4model.com's own definition) — no additional Structurizr-specific example content was retrievable from that page directly.

**Net**: this is the strongest, most directly-named methodological precedent found across all 5 leads — a real, well-documented, tooling-backed concept ("System Landscape diagram," with a real DSL keyword `systemLandscape`) whose entire purpose is exactly this project's stated problem: the top zoom level showing multiple systems/repos before drilling into any one of them.

---

## 4. A real large multi-repo OSS ecosystem's aggregate docs (Kubernetes)

**Confirmed by direct fetch, with a real, honest mixed finding: Kubernetes' docs site does document cross-component flows, but the "landscape" framing is closer to a components/roles overview page than a flow-first information architecture — the actual flow detail lives one level down, on narrower topic pages.**

Direct fetch of `kubernetes.io/docs/concepts/overview/components/` found the top-level "components" overview page is deliberately thin on relationships: it lists each control-plane/node component (`kube-apiserver`, `etcd`, `kube-scheduler`, `kube-controller-manager`, `kubelet`, `kube-proxy`, container runtime) with a one-line role description each, embeds one diagram (`/images/docs/components-of-kubernetes.svg`, image content itself not inspectable via text fetch), and explicitly defers deeper detail: *"For more detailed information about each component and various ways to configure your cluster architecture, see the Cluster Architecture page."* No request-flow ("kubectl → kube-apiserver → kubelet") is spelled out on this page.

Direct fetch of `kubernetes.io/docs/concepts/architecture/` (the page it defers to) is similar in shape: real components are grouped into two boundaries (control plane vs. node), with one architecture diagram (`kubernetes-cluster-architecture.svg`), but again the page itself doesn't narrate a step-by-step cross-component request flow — it instead links onward to child pages: `Nodes`, `Communication between Nodes and the Control Plane`, `Controllers`.

**The real flow documentation exists one level further down.** Direct fetch of `kubernetes.io/docs/concepts/architecture/control-plane-node-communication/` found genuine, explicit cross-boundary flow documentation:
- Node/Pod → API server: *"All API usage from nodes (or the pods they run) terminates at the API server,"* over HTTPS, authenticated by client certs or service-account tokens, "secured by default."
- API server → kubelet (the reverse direction): *"The connections from the API server to the kubelet are used for: Fetching logs for pods. Attaching (usually through `kubectl`) to running pods. Providing the kubelet's port-forwarding functionality"* — with an explicit, honest security caveat that this direction is "unsafe" over untrusted networks by default unless `--kubelet-certificate-authority` or SSH tunneling is used.
- API server → node/pod/service (a third direction): documented as defaulting to plain HTTP, "not currently safe" over untrusted networks, with two named mitigations (deprecated SSH tunnels, or the Konnectivity service).

**Net, honest read**: Kubernetes' real information architecture handles "flow touches component A then B then C" not with one dedicated landscape/flow diagram at the top, but with a **layered structure** — a coarse components list at the top, an architecture-grouping page one level down, and the actual named, directional, protocol-level flow documentation living on narrowly-scoped topic pages even further down (here, specifically a "communication" page named for the boundary it covers). This is a real, useful precedent shape (topic pages named after the *boundary/flow*, not just after a single component) but it is not a single unified "landscape" artifact the way C4's System Landscape diagram or Backstage's Catalog Graph are — it's closer to "many focused prose pages, each documenting one real cross-component relationship," which given this project's actual `cross_repo_edges` data (discrete, named edges between specific repos) may be a structurally closer match than a single sprawling diagram.

---

## 5. How DeepWiki itself handles a real monorepo/multi-service repo (partial proxy)

**Confirmed by direct fetch: DeepWiki does visibly adapt its structure and diagrams for a monorepo with multiple internal packages — it produces dedicated "architecture"/"workspace" pages and dependency-graph diagrams — but this is still one wiki for one repo; it is not evidence of a cross-*repository* capability, only of the agentic wiki-generation adapting its content to what it finds inside a single repo's real structure.**

Direct fetch of `deepwiki.com/better-auth/better-auth/1.2-monorepo-and-workspace-architecture` confirmed a real, dedicated page (not a generic template) specifically for monorepo/workspace structure, referencing at least two real diagrams: one mapping *"common technical terms to their specific locations in the codebase,"* and a real *"Workspace Dependency Graph"* described as showing *"the relationship between the main distribution package, core logic, and plugins"* (e.g. `better-auth`, `@better-auth/core`, and plugins like Stripe/SSO/Expo) — using `workspace:*` protocol references and Turborepo task orchestration as the real underlying package-relationship data.

Direct fetch of `deepwiki.com/n8n-io/n8n` confirmed a real, more elaborate example: a 10-section sidebar organized explicitly around **interdependent subsystems** (core architecture → workflow execution → API/resource management → node ecosystem → AI capabilities → UI → deployment → testing/CI/contribution) rather than a flat feature list. The overview page includes a real *"package roles table"* mapping 15+ packages to purposes (e.g. `n8n-workflow` = "core workflow abstractions," `n8n-core` = "execution engine," the CLI = "main application server"), an *"architectural layers diagram"* mapping business concepts to code entities, and a real *"dependency graph"* described as showing *"layered structure and flow"* where foundation packages have minimal dependencies and the CLI depends on core/database/utilities. It also documents three distinct runtime modes (main/worker/webhook) with different responsibilities — a real example of the wiki adapting to genuinely different execution-time relationships within one repo, not just static code structure.

Search results (not independently re-fetched for each) surfaced several more real DeepWiki-indexed monorepos with similarly-named dedicated pages — `event-catalog/eventcatalog` ("Monorepo Structure"), `withastro/astro` ("Monorepo Architecture"), `bufbuild/protobuf-es` ("Monorepo Organization"), `pydantic/pydantic-ai` ("Package Structure and Organization") — consistent with the two directly-fetched examples above, but these titles/descriptions themselves are search-snippet-sourced, not directly fetched and read in full.

**Net**: DeepWiki's agentic approach genuinely does produce different, relationship-aware content (dependency graphs, package-role tables, per-mode responsibility breakdowns) when it finds a monorepo, rather than forcing every repo into an identical single-purpose template — real evidence the underlying architecture (agentic, not fixed-template) is capable of representing internal relationships when they exist. But this remains bounded by **one indexing job seeing one repo's own filesystem** — nothing here demonstrates or even gestures at a mechanism for DeepWiki to relate content across two *separately*-indexed wikis (e.g. showing a dependency arrow from `better-auth`'s wiki into some other, separately-indexed repo's wiki). It's a real, useful proxy for "agentic structure can represent internal relationships," not evidence toward the actual cross-repo landscape question from lead 1.

---

## Summary of the honest overall picture

- **No one has a turnkey, off-the-shelf answer to "browsable HTML docs of a multi-repo landscape."** DeepWiki explicitly doesn't attempt it (lead 1, real negative). 
- **The clearest named methodological concept for the top-level "landscape" view is C4's System Landscape diagram** (lead 3) — real, well-documented, with real tooling support (Structurizr's `systemLandscape` DSL keyword) — but it is a single diagram concept, not a full docs-site information architecture.
- **The closest real, working, purpose-built *tooling* for a many-repo entity model with actual navigable relationships is Backstage's Software Catalog + Catalog Graph plugin** (lead 2) — but Backstage's own docs admit the graph is a static relations map (ownership/API/grouping), not a flow-sequence visualization, and TechDocs (the prose-docs half) doesn't span components at all.
- **The closest real precedent for documenting a *specific named flow that crosses component boundaries*, at OSS scale, is Kubernetes' layered docs structure** (lead 4) — topic pages named after the boundary/relationship itself (e.g. "Communication between Nodes and the Control Plane"), not a single big diagram — a shape that may map more naturally onto this project's discrete `cross_repo_edges` rows than a single sprawling landscape diagram would.
- **DeepWiki's own monorepo handling** (lead 5) shows the agentic-generation approach *can* produce relationship-aware content when real internal structure exists, which is encouraging for feasibility, but is not itself cross-repo evidence.

No design proposal is made here. This is a report of what's really out there, per the task's own instruction.

---

## Sources

Directly fetched and read:
- https://docs.devin.ai/work-with-devin/deepwiki
- https://cognition.com/blog/deepwiki
- https://backstage.io/docs/features/software-catalog/system-model/
- https://backstage.io/docs/features/techdocs/introduction (HTTP 404 — attempted direct fetch, page not found at this path)
- https://backstage.io/docs/features/techdocs/techdocs-overview (fetched, no retrievable body content returned)
- https://backstage.io/docs/features/techdocs/ (fetched; used only for the one directly-quoted TechDocs line, remainder of the TechDocs scoping claim is search-inferred — see §2)
- https://backstage.io/docs/features/software-catalog/creating-the-catalog-graph/
- https://github.com/backstage/backstage/blob/master/plugins/catalog-graph/README.md
- https://c4model.com/diagrams/system-context
- https://c4model.com/diagrams/system-landscape
- https://docs.structurizr.com/dsl/language
- https://docs.structurizr.com/ui/diagrams/system-landscape-view (fetched; stub page only, no additional content beyond a heading and a link back to c4model.com)
- https://kubernetes.io/docs/concepts/overview/components/
- https://kubernetes.io/docs/concepts/architecture/
- https://kubernetes.io/docs/concepts/architecture/control-plane-node-communication/
- https://deepwiki.com/better-auth/better-auth/1.2-monorepo-and-workspace-architecture
- https://deepwiki.com/n8n-io/n8n

Search-result-only (snippets/titles, not independently fetched and read in full — flagged inline above wherever used as a claim source):
- codersera.com/blog/deepwiki-complete-guide-2026 (secondary claim re: DeepWiki Enterprise "organization-wide repository indexing")
- github.com/backstage/backstage/issues/4394 ("feat: Generate map of an entire system" — existence/title only)
- deepwiki.com/event-catalog/eventcatalog/1.1-monorepo-structure, deepwiki.com/withastro/astro/2-monorepo-architecture, deepwiki.com/bufbuild/protobuf-es/6.1-monorepo-organization, deepwiki.com/pydantic/pydantic-ai/1.1-package-structure-and-organization (titles only, corroborating lead 5's pattern, not independently fetched)
