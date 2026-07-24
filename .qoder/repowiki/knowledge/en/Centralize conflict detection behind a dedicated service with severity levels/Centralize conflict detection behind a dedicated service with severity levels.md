---
kind: design
name: Centralize conflict detection behind a dedicated service with severity levels
source: session
category: adr
---

# Centralize conflict detection behind a dedicated service with severity levels

_Source: coding plans from commit period 36f181a → b40a668 — records intent at planning time; the implementation may lag or differ._

## Context
Conflict checks (class, teacher, room overlaps plus volume/imposable constraints) were scattered across controllers and front-end validators, making it hard to enforce consistent rules and to provide real-time feedback during drag-and-drop editing.

## Decision drivers
- single rule engine
- real-time frontend feedback
- separation of blocking vs advisory conflicts

## Considered options
- **Keep ad-hoc checks in controllers + client-side only** _(rejected)_ — pros: least backend work; cons: rules diverge, no server authority, no auditability
- **Dedicated ConflitDetectionService returning typed Conflit[] with severity** — pros: shared logic, clear blocking vs warning distinction, reusable by both API and future batch planners; cons: new service to maintain, extra DB queries per check

## Decision
Implement `ConflitDetectionService.detecterConflits(creneau, etablissementId)` returning five conflict types: `classe`, `enseignant`, `salle` (blocking) and `volumeHoraire`, `creneauImposable` (warnings); expose via `POST /api/emploi-du-temps/verifier-conflits` for live validation.

## Consequences
Frontend can color-code blocks (red) vs warnings (orange) during drag-and-drop; adding a new conflict type requires changing only this service.