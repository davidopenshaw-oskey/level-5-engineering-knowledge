# tasks 7& todos

1. remove hard coded paths, even from the repo in the ast extraction
2. remove all of the hardcoded references, make it 100% dynamic
3. ensure all paths are relative for agentic running
4. governance/reference-docs (schemas, indexes, firestore rules, rbac roles) are currently manual snapshots — make these dynamically re-derived from the target repo when read in on P1
5. in p2, the artefacts need to be added ito the repo for versioning. currently /output is .gitignore. we need to review this to avoid saving unnecessary items in git, but storing significant artefacts for governance. maybe the devs decide to put the artefacts and ast run info onto buckets somewhere
   - not yet confirmed: this pipeline might end up running on Google's Gemini Enterprise agentic platform during CI/CD production merge. if so, /output (ast extracts + p2 synthesis) would more likely land in a cloud storage bucket than in this git repo. decision deferred until that platform question is confirmed either way.
6. [DONE 2026-08-01] model_property extractor bug fixed — `01-extract-ast-evidence.ts` only walked `interface` declarations, silently skipping `type X = {...}` object-literal aliases (and intersections containing one), regardless of structural complexity. Patched to also walk type aliases (see `01-extract-ast-evidence.ts` "7b" block). Verified via full re-run: core model_property facts 24→179, building 156→428, confirmed against previously-zero types (`OSKDocumentId`, `OSKBuilding`, `OSKBuildingUnitInhabitant`, `OSKPhoneNumber`, etc).

