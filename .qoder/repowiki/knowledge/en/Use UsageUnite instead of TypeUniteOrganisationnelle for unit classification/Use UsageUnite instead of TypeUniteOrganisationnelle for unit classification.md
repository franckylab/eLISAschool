---
kind: design
name: Use UsageUnite instead of TypeUniteOrganisationnelle for unit classification
source: session
category: adr
---

# Use UsageUnite instead of TypeUniteOrganisationnelle for unit classification

_Source: coding plans from commit period 7b24102 → 7ca27dc — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The `TypeUniteOrganisationnelle` enum (with values like POLE, FILIERE, CYCLE, SECTION, UNITE_PEDAGOGIQUE) was deemed too rigid and not aligned with actual usage patterns. The team decided to keep only `UsageUnite` as the nomenclature for classifying units.

## Decision drivers
- avoid over-constraining unit types with a large enum
- keep unit typing flexible via the existing `UsageUnite` nomenclature
- simplify the schema by dropping a dedicated type table

## Considered options
- **Retain TypeUniteOrganisationnelle with a smaller set of values** _(rejected)_ — pros: stronger validation at DB level; cons: still a rigid enum; adds another table and FK column; maintenance burden
- **Remove TypeUniteOrganisationnelle entirely and rely on UsageUnite** — pros: fewer tables/columns; single source of truth for unit classification; aligns with how units are actually used; cons: less strict DB-level validation; clients must interpret usage labels

## Decision
Drop the `types_unite_organisationnelle` table and the `typeUniteId` FK from `unites_organisationnelles`. Classification is now done exclusively through the `usageUniteId` reference to `usages_unite`.

## Consequences
Backend DTOs and frontend types no longer carry `typeUniteId`; the organigramme drawer shows the `usage` badge instead. Migration drops the table and column.