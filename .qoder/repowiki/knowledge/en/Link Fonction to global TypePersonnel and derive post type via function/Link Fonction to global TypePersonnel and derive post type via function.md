---
kind: design
name: Link Fonction to global TypePersonnel and derive post type via function
source: session
category: adr
---

# Link Fonction to global TypePersonnel and derive post type via function

_Source: coding plans from commit period 60077cb → efc1425 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
TypePersonnel (global HR status such as ENSEIGNANT) and Fonction (multi-tenant hierarchical role) were kept as orthogonal concepts, but there was no link between them. A Function should carry its expected personnel type so that contract validation can check whether a person's MembrePersonnel.typePersonnel matches the post's expected type through poste.fonction.typePersonnel. Additionally, HierarchiePersonnel.typePersonnelId was redundant (never read) and TypePersonnel.roleIdParDefaut / permissionsDefaut were dead fields contradicting RBAC via utilisateur_etablissements.

## Decision drivers
- enforce contract compatibility at the post level via the function's declared type
- remove stale columns that conflict with the RBAC model
- keep TypePersonnel global and Fonction multi-tenant as distinct concepts

## Considered options
- **Put typePersonnelId directly on Poste** _(rejected)_ — pros: simple lookup for contract checks; cons: duplicates what the function already declares; breaks the intended derivation chain
- **Add optional FK fonctions.typePersonnelId and derive labels in getOrganigramme** — pros: single source of truth for a function's expected type; supports derived labels on the organigramme; keeps HierarchiePersonnel clean; cons: requires migration 112 and updating DTOs/services to propagate the relation

## Decision
Add nullable typePersonnelId FK on fonctions (migration 112), remove typePersonnelId from hierarchie_personnel, drop dead roleIdParDefaut/permissionsDefaut from types_personnel, and enrich getOrganigramme to populate typePersonnelLabel/fonctionLabel by loading poste.fonction.typePersonnel. Frontend adds a Type de personnel select on the Fonction form and shows a badge in the organigramme drawer.

## Consequences
Contract creation now validates against poste.fonction.typePersonnel.code === ENSEIGNANT (via contrat.service.ts). Organigramme responses include derived labels. Dead RBAC fields are gone, keeping the nomenclature consistent with utilisateur_etablissements-based permissions.