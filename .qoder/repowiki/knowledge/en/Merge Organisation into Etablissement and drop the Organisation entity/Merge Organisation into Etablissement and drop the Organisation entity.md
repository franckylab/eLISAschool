---
kind: design
name: Merge Organisation into Etablissement and drop the Organisation entity
source: session
category: adr
---

# Merge Organisation into Etablissement and drop the Organisation entity

_Source: coding plans from commit period 7b24102 → 7ca27dc — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The organisation module had a separate `Organisation` entity that acted as a tenant boundary for organisational units, but this added an unnecessary indirection: every unit was linked to an Organisation which itself belonged to an Etablissement. The grilling session validated merging Organisation into Etablissement so that units attach directly to the establishment.

## Decision drivers
- simplify data model by removing an intermediate tenant layer
- align with Cameroonian school reality where one establishment = one org chart
- reduce FK joins in organigramme queries

## Considered options
- **Keep Organisation as a thin wrapper around Etablissement** _(rejected)_ — pros: preserves existing API surface, minimal migration; cons: adds a redundant table and FK hop; no real business value since each establishment has exactly one org chart
- **Drop Organisation and reattach unites_organisationnelles to etablissements** — pros: single FK from unit to establishment; simpler queries; clearer mental model; cons: breaking change across services/controllers; requires SQL migration copying `etablissementId`

## Decision
Delete the `organisations` table and its entity, add `etablissementId` to `unites_organisationnelles`, migrate existing rows, and update all backend services/controllers to filter by `etablissementId`. Frontend page renamed to 'Organigramme' with four tabs (Unités, Postes, Fonctions, Hiérarchie).

## Consequences
All `/api/organisation` endpoints now operate per-établissement via `req.etablissementId`; the Organisation CRUD routes are removed. Migration 109 handles the data copy and enum remapping (`POLE/FILIERE/CYCLE/SECTION` → `UNITE_PEDAGOGIQUE`). Dependent modules (personnel, paie, postes) must be updated to import `Poste` from the organisation entities without the Organisation layer.