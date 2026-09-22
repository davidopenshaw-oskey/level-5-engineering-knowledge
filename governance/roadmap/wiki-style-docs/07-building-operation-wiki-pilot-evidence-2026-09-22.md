# Pilot evidence: `createNonAppUserWithAccess`

Bounded Postgres retrieval: 18 selected facts (limit 20) and one direct
resolved HTTP edge (limit 10). All selected Firebase facts belong to current
run `20260911_080454-00e1d9fd`, commit
`00e1d9fd568fab1bdcd1ad81e76b40d6b38ad4a3`, extracted 2026-09-11 08:06:19
UTC. The direct edge was generated 2026-09-21 17:29:15 UTC.

| Evidence | Fact reference / location | Retrieved support |
|---|---|---|
| Callable contract | `80c8ad28d03fe952da108853a6667048aea13641`; `index.ts:57` | Callable contract; request `OSKCreateNonAppUserWithAccessRequest`; success response `OSKCreateNonAppUserwithAccessResponse`; resolved service handler. |
| Handler | `cb5655f1cbc39173e2c4fa8904a17856a3ba99ee`; service `:250` | Async service method returning the named success response. |
| Security / parameters | `c9cb78c24940c0b611a14f791a76f2e322ba4732` (`:250`), `22156263a374fcce3d74e6c09f06c2c2fba44ba6` (`:255`) | Calls `OSKUserSecurityChecks`, then `checkParameters` for context, building ID, unit ID, full name, inviter ID, and optional door IDs. |
| Collaborators | `135bb55f8f89f17d69fde84e93fe28fad7b1fdd1` (`:271`), `ea88677be932b3c885c3801418f0b1e3d7c7b3d7` (`:276`), `e1af68a3a0aaf78662df5115952cc02e830ab150` (`:286`), `52b475756148816ba2cca3da396566a5fdaffc62` (`:298`), `aa0445f4747d672fe39fb58506a13d902fe06b20` (`:311`) | Resolves unit, generates an ID, creates a record, calls `_createNonAppUserAccess`, then retrieves a non-app-user pincode record. |
| Response properties | `2eebe460a8e50fd4a3fc5e042cfd2dc720ba07fb`–`4675ea1c0554a0d785b35e39b722fb0d7f6d40a9`; request model `:45–48` | `nonAppUserId`, `accessId`, `pincode`, and `fullName` are strings. |
| External caller | edge `53640`; Swift source → Firebase target | Resolved AST-derived HTTP edge from `building-createNonAppUserWithAccess` to the callable operation. |

The SQL file is `building-operation-wiki-pilot.sql`. No source files,
architecture/persona documents, embeddings, or recursive graph traversal were
used.
