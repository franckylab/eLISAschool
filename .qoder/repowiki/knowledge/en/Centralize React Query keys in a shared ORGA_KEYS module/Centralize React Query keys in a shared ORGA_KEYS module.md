---
kind: design
name: Centralize React Query keys in a shared ORGA_KEYS module
source: session
category: adr
---

# Centralize React Query keys in a shared ORGA_KEYS module

_Source: coding plans from commit period d6b7b59 → b5c9c67 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The organisation feature had query key strings duplicated across multiple hooks (`use-unites`, `use-hierarchies`, `use-postes`, `use-echelons-structurels`, `use-templates`, `use-niveaux-responsabilite`, `use-modes-remuneration`), risking inconsistencies and making cache invalidation brittle.

## Decision drivers
- single source of truth for cache keys
- consistency across hooks
- reduced maintenance surface

## Considered options
- **Shared `query-keys.ts` with unified `ORGA_KEYS` object** — pros: one place to update, no duplication, consistent naming
- **Keep inline string literals per hook** _(rejected)_ — pros: no extra file; cons: duplicates everywhere, easy to drift out of sync

## Decision
Create `frontend/src/features/organisation/hooks/query-keys.ts` exporting a single `ORGA_KEYS` object covering unites, hierarchie, organigramme, stats, validation, echelons, niveaux, modes, templates, postes; all hooks import from it.

## Consequences
Cache key changes now happen in one location. New hooks must import `ORGA_KEYS` instead of defining their own strings, preventing future drift.