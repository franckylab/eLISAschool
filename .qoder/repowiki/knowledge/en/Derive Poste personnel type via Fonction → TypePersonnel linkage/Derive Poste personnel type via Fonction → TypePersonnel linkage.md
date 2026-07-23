---
kind: design
name: Derive Poste personnel type via Fonction → TypePersonnel linkage
source: session
category: adr
---

# Derive Poste personnel type via Fonction → TypePersonnel linkage

_Source: coding plans from commit period 7b24102 → 7ca27dc — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
A previous refactoring had moved `typePersonnelId` onto `HierarchiePersonnel` and then back again, creating confusion about where the personnel-type constraint lives. The grilling session clarified that `TypePersonnel` is a global HR status while `Fonction` is a multi-tenant hierarchical role, and the expected personnel type for a poste should be derived from its function's linked type.

## Decision drivers
- separate global HR status (TypePersonnel) from tenant-specific roles (Fonction)
- derive poste compatibility from `poste.fonction.typePersonnel` rather than duplicating the field
- remove dead fields (`roleIdParDefaut`, `permissionsDefaut`) from TypePersonnel that contradict RBAC via `utilisateur_etablissements`

## Considered options
- **Attach typePersonnelId directly to Poste** _(rejected)_ — pros: simple lookup; cons: duplicates information already derivable via fonction; breaks when fonction changes
- **Attach typePersonnelId to HierarchiePersonnel** _(rejected)_ — pros: tracks what type was assigned per assignment; cons: never read by UI; redundant with MembrePersonnel.typePersonnel; creates churn between hierarchie and poste
- **Link Fonction → TypePersonnel and derive poste type transitively** — pros: single source of truth; fonction carries its required HR status; poste inherits it automatically; cons: requires loading `fonction.typePersonnel` in contract checks and organigramme rendering

## Decision
Add `typePersonnelId` FK on `Fonction`, remove `typePersonnelId` from both `Poste` and `HierarchiePersonnel`, delete the unused `roleIdParDefaut`/`permissionsDefaut` columns from `TypePersonnel`, and update `contrat.service.ts` and `getOrganigramme` to resolve the personnel type via `poste.fonction.typePersonnel`.

## Consequences
Contract creation validates compatibility against `poste.fonction.typePersonnel.code` (e.g. ENSEIGNANT). The organigramme drawer displays a `typePersonnelLabel` badge per poste. Migration 112 is idempotent and safe to replay.