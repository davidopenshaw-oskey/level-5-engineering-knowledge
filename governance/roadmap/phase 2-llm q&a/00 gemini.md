Here is a systematic attack on the proposed strawman data model. The core concept—separating **deterministic facts** from **probabilistic interpretations**, and treating **documents** as mere projections—is conceptually sound. However, the proposed schema and invalidation mechanics break under real-world engineering constraints and LLM behavior.

---

### 1. The Invalidation "Butterfly Effect" (Fact-ID Volatility)
The model states that if `generatedAgainstFactSet` is not a superset-equal match against the newly extracted facts, the Interpretation is marked `stale`. 

*   **The Hole:** Under Phase 1, `FactId`s include volatile properties like line numbers (e.g., `...|door.controller.ts|41|...`). If a developer inserts a single log line or comment at line 5 of `door.controller.ts`, *every subsequent line number in that file shifts*.
*   **The Consequence:** Every single `FactId` generated downstream of line 5 changes. This invalidates `generatedAgainstFactSet` for *all* Interpretations on that file or module, even though the semantic logic of the code remains 100% identical. 
*   **The Result:** Your cache hit rate on active modules will degrade to nearly **0%**, resulting in constant, expensive regenerations of unaffected claims and defeating the entire economic justification of the split.
*   **The Fix:** `FactId`s used in `evidence` and `generatedAgainstFactSet` must be stripped of volatile metadata (like line numbers) or normalized to a "symbol-only" stable fingerprint (e.g., `type|module|file|symbolPath`) before invalidation checks run.

---

### 2. The Micro-Claim Transactional Crash
The model assumes `evidence: FactId[]` can be enforced as a strict database schema constraint at write time.

*   **The Hole:** LLMs are highly prone to formatting errors, minor typos, casing discrepancies, or off-by-one errors when producing precise, highly structured identifier strings like `call_expression|building_door|door.controller.ts|...`.
*   **The Consequence:** If the LLM generates a brilliant, highly accurate interpretation but makes a single-character typo in one of its `FactId`s, a hard database-level schema validation will reject the entire transaction.
*   **The Result:** You trade a minor downstream citation-parsing error for a catastrophic pipeline crash. The system will either require continuous, expensive retries or discard perfectly valid synthesis runs due to non-fatal syntax typos.
*   **The Fix:** Implement a "Soft-Join" boundary. Treat missing `FactId`s in the write-stream not as schema violations, but as dynamic validation flags that downgrade the Interpretation to `Inferred` (or tag it as "Unverified Citation") while still allowing the write to succeed.

---

### 3. The Logical Coherence Problem of Narration
The document-rendering step asks the LLM to perform "narration of already-decided claims, not re-deriving them" by feeding it a flat list of `current` Interpretations.

*   **The Hole:** If Interpretations are atomized to keep them short and singular (e.g., *"This module checks permission X on Route A"*, *"This module queries collection Y"*), the LLM rendering the document is acting as a blind compositor. It lacks the cohesive context of *why* those assertions were made or how they weave together logically.
*   **The Consequence:** When an LLM is forced to write narrative prose from a disconnected bag of 50 low-level micro-claims, the output will suffer from "Frankenstein's Monster" syndrome—either reading as highly repetitive, dry, robotic bullet points, or hallucinating connections between the claims to force transitions that do not exist.
*   **The Fix:** Interpretations must not be entirely atomized. They should capture "claim-clusters" (e.g., a capability-level architectural pattern) rather than microscopic code-fact restatements, leaving the atomic connections to the underlying Phase 1 Relationships.

---

### 4. The Cascading Staleness Deadlock (Upstream/Downstream Hierarchy)
The proposed hierarchy (Capability $\rightarrow$ Module $\rightarrow$ Repo $\rightarrow$ Landscape) creates a major invalidation dilemma.

*   **The Hole:** There is no semantic dependency map between different levels of `Interpretation`. 
    *   If you cascade staleness **upstream** (a Capability Interpretation change invalidates Module and Repo Interpretations), a minor code change in an obscure corner of the repository cascades all the way to the top. You end up regenerating your entire enterprise/landscape architecture on every minor feature release.
    *   If you do **not** cascade staleness, your high-level Module or Repo profiles will continue to output outdated, confidently incorrect assertions (e.g., "The repo strictly restricts access to resource X," when a newly modified capability has quietly removed that check).
*   **The Fix:** Interpretations at higher levels (Module, Repo) must specify exactly which lower-level `InterpretationId`s they depend on as their "evidence." This restricts the cascade to a direct, traceable logical path, rather than a broad, scope-based wipeout.

---

### 5. The "Document Narration" Cost Illusion
*   **The Hole:** Moving the LLM call from CI/CD-time to Document-request-time does not eliminate the cost; it merely moves it to the read path and introduces massive user latency.
*   **The Consequence:** An engineer opening a portal does not want to wait 5–15 seconds for an LLM to dynamically "narrate" the current claims. If you cache the rendered Document to solve the latency, then the "Document" *becomes* a persisted, mutable state that you must invalidate anyway—rendering the "on-demand rendering" argument moot.
*   **The Fix:** Generate documents asynchronously at the end of the Phase 2 pipeline run (triggered only when relevant Interpretations change), and serve them instantly as static, pre-rendered assets to the end user.