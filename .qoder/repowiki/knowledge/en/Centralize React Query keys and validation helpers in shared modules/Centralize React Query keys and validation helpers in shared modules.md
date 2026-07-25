---
kind: design
name: Centralize React Query keys and validation helpers in shared modules
source: session
category: adr
---

# Centralize React Query keys and validation helpers in shared modules

_Source: coding plans from commit period cdafea3 → f36bb82 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The organisation module had duplicated query key strings across 7+ hook files and a duplicate validate(schema, data) function repeated in 3 controllers, creating maintenance risk and inconsistency.

## Decision drivers
- DRY principle
- consistency across hooks/controllers
- reduced refactoring cost

## Considered options
- **Shared query-keys.ts + utils/validate.ts** — pros: single source of truth for keys and validation; easy to update all consumers
- **Keep inline definitions per file** _(rejected)_ — pros: no extra imports; cons: drift between files, harder to rename or audit

## Decision
Create frontend/src/features/organisation/hooks/query-keys.ts with a unified ORGA_KEYS object and backend/src/modules/organisation/controllers/utils/validate.ts with the shared validate helper; all hooks and controllers import from these modules.

## Consequences
Adding a new organisation resource requires only updating one file. Renaming a key is now a single edit. Validation logic stays consistent across endpoints.