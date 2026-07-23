---
kind: design
name: Collapse Organisation entity into Etablissement and simplify Unit types
source: session
category: adr
---

# Collapse Organisation entity into Etablissement and simplify Unit types

_Source: coding plans from commit period 2be66fa → 7b24102 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The domain model had a redundant intermediate `Organisation` layer between `Etablissement` and `UniteOrganisationnelle`, plus an enum `TypeUniteOrganisationnelle` containing academic concepts (`POLE`, `FILIERE`, `CYCLE`, `SECTION`) that belong to the academic modules, not HR organisation.

## Decision drivers
- remove unnecessary indirection
- separate HR admin from academic modules
- align unit types with Cameroonian school reality

## Considered options
- **Keep Organisation but deprecate unused fields** _(rejected)_ — pros: zero migration cost; cons: dead weight persists; API surface stays bloated
- **Rename Organisation → Etablissement and keep enums unchanged** _(rejected)_ — pros: less schema churn; cons: academic-type values remain semantically wrong
- **Drop Organisation entirely, attach units to Etablissement, prune academic enums, add UNITE_PEDAGOGIQUE** — pros: cleaner model; enforces separation of concerns; seeds provide ready-made Cameroonian templates; cons: large migration and cross-module refactoring

## Decision
Migration 109 adds `etablissementId` on `unites_organisationnelles`, copies data, drops the FK to `organisationId`, and deletes the `organisations` table. `TypeUniteOrganisationnelle` loses `POLE/FILIERE/CYCLE/SECTION` and gains `UNITE_PEDAGOGIQUE`. Backend services and frontend hooks switch every reference from `organisationId` to `etablissementId`. Three system templates (Lycée standard, Ecole primaire, Complexe scolaire) seed realistic hierarchies.

## Consequences
The module now models HR org structure directly under each establishment, removing the orphaned Organisation concept. Academic structures move to their own modules. Existing data survives via the SQL migration, but any client still referencing `organisationId` must update to `etablissementId`.