// **version:** 1.0.0
// **location:** level-5 phase 2 (shared)
// © Oskey SAS. All rights reserved.
//
// Firestore/data ownership HINT, not a label -- deliberately. Per
// governance/adrs/adr-004.md and the Q&A that scoped this (2026-08-02): a
// naming-convention or single-signal heuristic can be confidently wrong,
// and a wrong "confirmed owner" claim is worse than a correctly-hedged
// narrative one, especially since this feeds impact analysis. So this
// computes a deterministic SIGNAL -- which submodule DEFINES a
// Controller/Service class, and how many OTHER submodules/modules call
// into it -- and hands it to the narrative step as a hint. The final
// "this is the owner" judgment stays Tier 3.
//
// Built from data already resolved by 04-build-resolved-graph.ts's call
// edges (both the original cross-module ones and the intra-module ones
// added 2026-08-02, itself only possible once that script's resolution was
// extended to search controllerMethods, not just serviceMethods -- most
// Firestore access in this codebase is mediated through Controller
// classes, which the original resolution never saw at all).

export interface OwnershipHint {
  className: string;
  definingSubmodule: string;
  calledByOtherSubmodulesCount: number;
  callingSubmodules: string[];
  calledByOtherModulesCount: number;
  callingModules: string[];
}

/** moduleFacts: this module's own evidence graph facts (for className ->
 * definingSubmodule, via controller_method/service_method). resolvedGraph:
 * the repo-wide output of 04-build-resolved-graph.ts (for who calls in). */
export function computeOwnershipHints(moduleFacts: any[], moduleName: string, resolvedGraph: any): OwnershipHint[] {
  const classToSubmodule = new Map<string, string>();
  for (const f of moduleFacts) {
    if (f.type !== "controller_method" && f.type !== "service_method") continue;
    if (!f.className) continue;
    classToSubmodule.set(f.className, f.submodule ?? "_module_root");
  }

  const callingSubmodulesByClass = new Map<string, Set<string>>();
  const intraEdges = [...(resolvedGraph.confirmedIntraModuleCallEdges ?? []), ...(resolvedGraph.probableIntraModuleCallEdges ?? [])];
  for (const e of intraEdges) {
    if (e.module !== moduleName || !classToSubmodule.has(e.targetClass)) continue;
    const set = callingSubmodulesByClass.get(e.targetClass) ?? new Set<string>();
    set.add(e.sourceSubmodule);
    callingSubmodulesByClass.set(e.targetClass, set);
  }

  const callingModulesByClass = new Map<string, Set<string>>();
  const crossEdges = [...(resolvedGraph.confirmedCallEdges ?? []), ...(resolvedGraph.probableCallEdges ?? [])];
  for (const e of crossEdges) {
    if (e.targetModule !== moduleName || !classToSubmodule.has(e.targetClass)) continue;
    const set = callingModulesByClass.get(e.targetClass) ?? new Set<string>();
    set.add(e.sourceModule);
    callingModulesByClass.set(e.targetClass, set);
  }

  const hints: OwnershipHint[] = [];
  for (const [className, definingSubmodule] of classToSubmodule.entries()) {
    const callingSubmodules = Array.from(callingSubmodulesByClass.get(className) ?? []).sort();
    const callingModules = Array.from(callingModulesByClass.get(className) ?? []).sort();
    if (callingSubmodules.length === 0 && callingModules.length === 0) continue; // no external callers -- not an interesting hint
    hints.push({
      className,
      definingSubmodule,
      calledByOtherSubmodulesCount: callingSubmodules.length,
      callingSubmodules,
      calledByOtherModulesCount: callingModules.length,
      callingModules,
    });
  }

  return hints.sort((a, b) => b.calledByOtherSubmodulesCount + b.calledByOtherModulesCount - (a.calledByOtherSubmodulesCount + a.calledByOtherModulesCount));
}

export function formatOwnershipHints(hints: OwnershipHint[]): string {
  if (hints.length === 0) return "(no classes in this module are called into by another submodule or module)";
  const lines: string[] = [];
  for (const h of hints) {
    lines.push(
      `${h.className} (defined in ${h.definingSubmodule}) -- called by ${h.calledByOtherSubmodulesCount} other submodule(s)` +
        `${h.callingSubmodules.length ? ` [${h.callingSubmodules.join(", ")}]` : ""} and ${h.calledByOtherModulesCount} other module(s)` +
        `${h.callingModules.length ? ` [${h.callingModules.join(", ")}]` : ""}`
    );
  }
  return lines.join("\n");
}
