# Task

Generate a Module Engineering Profile from the supplied evidence pack.

## Pass 1 boundary

This task produces a Pass 1 module document.

Do not try to solve Pass 2 concerns.

Pass 2 concerns include:

- full inter-module dependency mapping
- complete functional flows
- cross-module result sets
- platform-wide fan-out analysis
- cross-repository relationships

If evidence suggests one of these concerns, record it as a candidate for Pass 2 rather than expanding it.

---

# Required Output

Use this structure:

1. Module Summary
2. Primary Evidence
3. Services
4. Controllers
5. Firestore Evidence
6. Permissions
7. Cross-Module Dependencies
8. External Hooks / Candidate Boundaries
9. Architectural Observations
10. Risks and Open Questions
11. Evidence References

# Constraints

- Do not invent facts.
- Use cautious wording for interpretation.
- Include evidence references using file paths and line numbers where available.
- Keep business workflow claims out unless directly supported.