// Steps 4-5 of governance/roadmap/mcp-direction/10-sectioncontent-
// implementation-tasklist.md. Real, verified 2026-09-06 against hand-
// constructed real-fact_id/fabricated-fact_id and matching/mismatching-
// heading cases (both correctly accepted and correctly rejected) before
// being wired into atomic-prd-agent.ts.
//
// adr-008.md's real reframe: these are NOT persona-prompt "rules" -- a
// prompt instruction the model happens to skip produces silently bad
// output, not a caught failure. Both checks here are mandatory, run
// unconditionally after every generation, and fail closed.
import type { GenerateResponse } from "genkit";
import type { GenerationOutput } from "./section-content";

// Every real fact_ref actually returned by any tool call this run -- scans
// real tool RESPONSE payloads (not requests), across all three tools' real
// result shapes (SearchResult.factRef, GraphNeighborFact.factRef,
// ClusterMember.factRef / ClusterEdge.sourceFactRef+targetFactRef).
export function extractRealFactRefs(response: GenerateResponse<unknown>): Set<string> {
  const refs = new Set<string>();
  for (const message of response.messages) {
    for (const part of message.content) {
      if (!("toolResponse" in part) || !part.toolResponse) continue;
      const output = part.toolResponse.output;
      const collect = (value: unknown) => {
        if (Array.isArray(value)) {
          value.forEach(collect);
          return;
        }
        if (value && typeof value === "object") {
          for (const [key, v] of Object.entries(value)) {
            if ((key === "factRef" || key === "sourceFactRef" || key === "targetFactRef") && typeof v === "string") refs.add(v);
            else collect(v);
          }
        }
      };
      collect(output);
    }
  }
  return refs;
}

// Real, found live 2026-09-17 (governance/roadmap/graphrag/07-prompt-9-real-
// test-results-2026-09-13.md): a real fact_id could legitimately contain
// embedded newlines/indentation -- ts-morph/the Kotlin extractor capture a
// multi-line source call chain verbatim (confirmed directly against
// Postgres, e.g. a real `call_expression` fact_id whose caller segment is
// `inhabitants\n                     .filter(...)\n                     .map`).
// Real, checked-not-assumed correction, same day: the first version of this
// fix collapsed whitespace to a single space, and a hand-constructed test
// case built from this exact real fact_id caught it failing -- the model
// didn't insert a compensating space where the line break was, it removed
// the whitespace entirely (`inhabitants\n  .filter` became `inhabitants.filter`,
// zero separator), the same way a person unwrapping a fluent method chain
// onto one line naturally would (`.filter` reads fine directly after its
// receiver with no line break). Strip-all-whitespace, not collapse-to-one-
// space, is the normalization that actually matches the real, observed
// behavior. Real, narrow residual risk, stated rather than ignored: this
// would fail to distinguish two fact_id segments differing only by an
// internal, semantically-meaningful space inside a string literal (e.g.
// `'owner tenant'` vs `'ownertenant'`) -- not seen anywhere in this
// project's real fact_id corpus (these are compiler/AST-derived structural
// identifiers, not natural-language content), so accepted as a real,
// checked-for-plausibility tradeoff rather than an unconsidered one.
//
// Superseded 2026-09-17 (ADR-010): citations now carry `fact_ref`, a fixed
// 40-char SHA1 hex digest that structurally cannot contain whitespace --
// this history is kept for context, not deleted, but the function below is
// now a defensive no-op for real fact_refs (id.replace on a hex string
// returns it unchanged). Kept rather than removed: harmless, and it's the
// one place that would still catch a stale client sending an old-format
// fact_id with embedded whitespace.
export function normalizeFactRef(ref: string): string {
  return ref.replace(/\s+/g, "");
}

// Fail-closed: every cited-list claim's evidenceRefs must match a real
// fact_ref actually seen in this run's own tool results, exactly or (per the
// normalization above) after collapsing whitespace. The persona must
// separately instruct citing fact_refs verbatim -- a paraphrased or
// reconstructed citation would still slip past this undetected.
//
// Returns a new GenerationOutput with every matched-after-normalization
// evidenceRef rewritten to the real, canonical (verbatim, un-collapsed)
// fact_ref string -- not just a boolean/throw. Found necessary by tracing the
// real downstream consumers, not assumed: `buildCitationNumbering`
// (atomic-prd-agent.ts) keys its numbering map by whatever string literally
// appears in evidenceRefs, not by the real fact_ref. Tolerating whitespace
// only in the comparison here, without also canonicalizing the stored
// citation, would leave the model's collapsed string and the real string as
// two distinct map keys -- the same real fact would then render TWICE in the
// final document: once as a real citation, once again as a separate
// "gathered but uncited" entry in the Audit Trail. Canonicalizing here, once,
// is what keeps every downstream consumer (numbering, snapshot freshness,
// the fact-repo map, the audit trail) seeing one consistent real string per
// fact.
//
// Real, confirmed-live collision risk under the OLD fact_id scheme, checked
// against the actual corpus before trusting this (not assumed): 109 real,
// distinct groups of fact_ids collapsed to an identical normalized form
// corpus-wide under this strip-all-whitespace rule (73 was the count under
// the earlier, abandoned collapse-to-single-space rule above -- both real
// numbers, kept distinct here on purpose so they aren't confused with each
// other; full comparison in governance/roadmap/graphrag/09-prompt-12-
// checkfabrication-whitespace-fix-2026-09-17.md §1-2) (mostly repeated
// Kotlin/Compose UI patterns, e.g. three genuinely different real
// `Modifier.fillMaxSize()` call sites in one file, each independently
// numbered `#1` since the id-generation sequence counter keys off the raw,
// un-normalized text). Superseded 2026-09-17 (ADR-010): fact_ref is a SHA1
// hash of that same fact_id text, so this exact collision set still exists
// structurally (two facts whose fact_id differs only by whitespace still
// hash to two distinct, unrelated fact_refs -- the hash doesn't collapse
// them), but it can no longer surface here, since the model never sees or
// retypes fact_id text anymore. The ambiguity-detection branch below is kept
// for the same defensive reason as normalizeFactRef above, not because this
// class of collision is expected to occur in practice under the new scheme.
export function checkFabrication(output: GenerationOutput, realFactRefs: Set<string>): GenerationOutput {
  const byNormalized = new Map<string, string[]>();
  for (const real of realFactRefs) {
    const normalized = normalizeFactRef(real);
    const existing = byNormalized.get(normalized);
    if (existing) existing.push(real);
    else byNormalized.set(normalized, [real]);
  }

  const fabricated: string[] = [];
  const ambiguous: { cited: string; realMatches: string[] }[] = [];

  const canonicalized: GenerationOutput = {
    sections: output.sections.map(section => {
      if (section.content.kind !== "cited-list") return section;
      return {
        ...section,
        content: {
          ...section.content,
          items: section.content.items.map(item => ({
            ...item,
            evidenceRefs: item.evidenceRefs.map(ref => {
              if (realFactRefs.has(ref)) return ref; // exact match, the common case -- unchanged
              const matches = byNormalized.get(normalizeFactRef(ref));
              if (!matches) {
                fabricated.push(ref);
                return ref;
              }
              if (matches.length > 1) {
                // Genuinely ambiguous for THIS run -- more than one real
                // fact_ref this run actually gathered collapses to the same
                // normalized form as the citation. Never guess which one
                // was meant; fail closed on this specific citation, same
                // "never invent, never silently pick" discipline as the
                // rest of this file.
                ambiguous.push({ cited: ref, realMatches: matches });
                return ref;
              }
              return matches[0]; // unambiguous whitespace-only match -- canonicalize to the real, verbatim string
            }),
          })),
        },
      };
    }),
  };

  if (ambiguous.length > 0) {
    const detail = ambiguous.map(a => `'${a.cited}' matches ${a.realMatches.length} real fact_refs after whitespace normalization: ${a.realMatches.join(" | ")}`).join("; ");
    throw new Error(`[AMBIGUOUS_CITATION] Cited fact_ref(s) match more than one real fact_ref once whitespace is normalized -- cannot safely determine which was meant: ${detail}`);
  }
  if (fabricated.length > 0) {
    throw new Error(`[FABRICATED_CITATION] Cited fact_ref(s) not present in this run's real tool results: ${fabricated.join(", ")}`);
  }
  return canonicalized;
}

// Fail-closed: the run's rendered section headings must match the
// template's own declared LLM-authored heading list -- order-strict, not
// just presence-strict, since a reordered document is a real conformance
// failure (reading flow matters), not cosmetic.
export function checkTemplateConformance(output: GenerationOutput, expectedHeadings: string[]): void {
  const actual = output.sections.map(s => s.heading);
  const mismatch = actual.length !== expectedHeadings.length || actual.some((h, i) => h !== expectedHeadings[i]);
  if (mismatch) {
    throw new Error(`[TEMPLATE_NONCONFORMANT] Expected headings in order [${expectedHeadings.join(", ")}], got [${actual.join(", ")}].`);
  }
}
