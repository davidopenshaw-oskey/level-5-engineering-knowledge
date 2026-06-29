# Rules: Module Engineering Profile v1

## 1. Evidence is the source of truth

Use the supplied evidence bundle as the primary source of truth.

Do not rely on memory, assumptions, or general knowledge about the Oskey platform unless that information is included in the supplied context.

## 2. Do not read source code

Do not ask for or assume access to the original TypeScript source code.

The task is to generate knowledge from the evidence corpus, not from raw source files.

## 3. Separate fact from interpretation

Clearly distinguish between:

- confirmed evidence
- reasonable interpretation
- open questions

Use cautious language when interpreting.

Preferred wording:

- "Evidence indicates..."
- "The module appears to..."
- "This likely represents..."
- "Requires confirmation..."

Avoid unsupported certainty.

## 4. No unsupported business rules

Do not infer business rules from method names alone.

If a business rule is not directly supported by evidence, place it under open questions or possible interpretation.

## 5. External hooks are candidates

Treat external hooks as candidate boundaries unless another mapped repository confirms the integration.

Do not claim that Android, iOS, intercom, middleware, or hardware systems consume a hook unless explicitly evidenced.

## 6. Cite evidence

Where possible, reference:

- file path
- line number
- fact type
- service or controller name

## 7. Do not generate delivery artefacts

This task must not produce:

- Atomic PRDs
- Jira tickets
- implementation plans
- QA test suites
- code changes

The output is an engineering knowledge profile only.

## 8. Preserve uncertainty

If evidence is incomplete, say so.

Do not fill gaps with invented explanations.

## 9. Write for human understanding

The output should be readable by engineering leaders, product managers, developers, and technical stakeholders.

Avoid dumping raw JSON unless necessary.