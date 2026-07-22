---
kind: design
name: Merge Organisation into Etablissement and restructure organisational units
source: session
category: adr
---

# Merge Organisation into Etablissement and restructure organisational units

_Source: coding plans from commit period 687ff1f → 7b80115 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The existing model had a separate Organisation entity that organisational units (unites_organisationnelles) belonged to, with an enum TypeOrganisation and status fields. This created unnecessary indirection between the legal establishment and its internal structure, and the unit type enum contained pedagogical concepts (POLE, FILIERE, CYCLE, SECTION) mixed with administrative ones.

## Decision drivers
- Simplify data model by removing redundant abstraction layer
- Align domain model with Cameroonian school reality where units belong directly to the establishment
- Separate HR administration from academic/pedagogical concerns

## Considered options
- **Keep Organisation as separate entity** _(rejected)_ — pros: Minimal changes to existing code; cons: Perpetuates conceptual confusion between legal entity and internal structure; adds unnecessary join in queries
- **Merge Organisation into Etablissement, attach units directly to Etablissement** — pros: Eliminates redundant table and FK chain; clearer ownership semantics; simplifies queries; allows keeping templates for quick setup without creating a separate org record; cons: Breaking migration required; all callers must switch from organisationId to etablissementId

## Decision
Drop the organisations table entirely via migration 109, add etablissementId to unites_organisationnelles, migrate existing data, and update every backend service/controller/dto and frontend hook/type to reference etablissementId. The TypeUniteOrganisationnelle enum is trimmed of POLE/FILIERE/CYCLE/SECTION and gains UNITE_PEDAGOGIQUE. Three Cameroonian presets (Lycée standard, Ecole primaire, Complexe scolaire) are seeded into templates_organisation so new establishments can bootstrap their hierarchy without manual entry.

## Consequences
All modules importing Poste, HierarchiePersonnel, etc. from @modules/organisation/entities remain compatible because those entities were not renamed — only the parent link changed. The /api/organisation route group is kept but stripped of CRUD endpoints, now exposing only organigramme/unit/post/function/hierarchy operations scoped by req.etablissementId. Frontend page title becomes Organigramme with four tabs (Unités, Postes, Fonctions, Hiérarchie). Migration 109 is the single point of truth for data transition.