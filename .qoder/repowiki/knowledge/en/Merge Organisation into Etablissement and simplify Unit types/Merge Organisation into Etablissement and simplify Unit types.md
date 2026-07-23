---
kind: design
name: Merge Organisation into Etablissement and simplify Unit types
source: session
category: adr
---

# Merge Organisation into Etablissement and simplify Unit types

_Source: coding plans from commit period 60077cb → efc1425 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The organisation module had an unnecessary indirection: Organisation sat between Etablissement and UniteOrganisationnelle, with a TypeOrganisation enum and StatutOrganisation that were never meaningfully used. The business reality is that organisational units belong directly to an establishment, not to an intermediate organisation entity.

## Decision drivers
- simplify data model by removing an unused abstraction layer
- align schema with actual Cameroonian school structure (lycee, ecole primaire, complexe scolaire)
- keep admin/HR concerns separate from academic modules

## Considered options
- **Keep Organisation as a separate entity** _(rejected)_ — pros: familiar pattern, no migration cost; cons: adds indirection with no business value; TypeOrganisation/StatutOrganisation are dead code
- **Attach Unites directly to Etablissement and drop Organisation table** — pros: flatter schema, fewer joins, clearer ownership, enables Cameroonian templates at the establishment level; cons: breaking migration across backend + frontend; all callers must switch from organisationId to etablissementId

## Decision
Drop the organisations table, add etablissementId FK on unites_organisationnelles, migrate existing rows, and replace the TypeUniteOrganisationnelle enum values (POLE, FILIERE, CYCLE, SECTION) with UNITE_PEDAGOGIQUE. Pre-seed three Cameroonian templates (Lycée standard, Ecole primaire, Complexe scolaire) in templates_organisation.

## Consequences
All services/controllers/handlers now take etablissementId instead of organisationId; the /api/organisation route survives but without CRUD org endpoints. Frontend page title becomes Organigramme with four tabs (Unités, Postes, Fonctions, Hiérarchie). Migration 109 handles data copy and enum remapping; dependent modules (personnel, paie, postes) keep importing Poste unchanged.