// **version:** 1.0.0
// **location:** level-5 P2 facts index (shared)
// © Oskey SAS. All rights reserved.
//
// Fail-loud placeholder substitution against
// governance/roadmap/facts-serving-strategy/12-atomic-prd-template.md, per
// the design agreed in governance/roadmap/facts-serving-strategy/13-atomic-
// prd-pipeline-tasklist.md (task 3).
//
// Placeholders ({{name}}) are literal, fixed tokens both sides control --
// not a pattern reverse-engineered out of free text, unlike the old Phase 2
// pipeline's regex/footnote citation machinery this deliberately doesn't
// touch. Every value handed to this function is already a complete,
// finished string (rendered by render-evidence.ts, technical-proposal.ts's
// output, or plain PM text) before it reaches this function -- there is no
// extraction step here, only substitution.
//
// Fails loud, not silent, in both directions: a placeholder the template
// has but the caller never fills, or a value the caller supplies that the
// template has no placeholder for, is a bug in the caller or a drift
// between this file and the template -- either way, something to fix, not
// paper over with a default.

const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->\n?/g;

function findPlaceholders(template: string): Set<string> {
  const found = new Set<string>();
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    found.add(match[1]);
  }
  return found;
}

// The template's own header comment block illustrates what each placeholder
// does using the same literal {{name}} tokens as the real body -- real
// bug, found 2026-09-03 by reading a real generated document, not by
// review: a naive global replace mangled the comment along with the real
// insertion points, since both look identical to the pattern. Comments
// are template-maintainer documentation, never meant to reach a generated
// PRD anyway, so they're stripped before scanning or substituting, not
// specially exempted token-by-token.
export function assemblePrd(rawTemplate: string, values: Record<string, string>): string {
  const template = rawTemplate.replace(HTML_COMMENT_PATTERN, "");
  const templatePlaceholders = findPlaceholders(template);
  const suppliedKeys = new Set(Object.keys(values));

  const missing = [...templatePlaceholders].filter(name => !suppliedKeys.has(name));
  if (missing.length > 0) {
    throw new Error(
      `[TEMPLATE_PLACEHOLDER_UNFILLED] Template has placeholder(s) with no supplied value: ${missing.join(", ")}`
    );
  }

  const unused = [...suppliedKeys].filter(name => !templatePlaceholders.has(name));
  if (unused.length > 0) {
    throw new Error(
      `[TEMPLATE_VALUE_UNUSED] Supplied value(s) for placeholder(s) not present in the template: ${unused.join(", ")}`
    );
  }

  return template.replace(PLACEHOLDER_PATTERN, (_match, name: string) => values[name]);
}
