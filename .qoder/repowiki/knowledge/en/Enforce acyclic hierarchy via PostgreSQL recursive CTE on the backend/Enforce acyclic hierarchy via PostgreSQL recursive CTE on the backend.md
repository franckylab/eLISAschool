---
kind: design
name: Enforce acyclic hierarchy via PostgreSQL recursive CTE on the backend
source: session
category: adr
---

# Enforce acyclic hierarchy via PostgreSQL recursive CTE on the backend

_Source: coding plans from commit period 7b80115 → 3814600 — records intent at planning time; the implementation may lag or differ._

## Context
Users can drag-and-drop organizational units to change their parent, which risks creating cycles in the unit hierarchy (e.g., moving A under B when B is already a descendant of A). Cycles would break the recursive queries used throughout the application.

## Decision drivers
- data integrity — prevent invalid hierarchies at the source of truth
- performance — detect cycles in one DB round-trip
- consistency — same validation applies whether changes come from UI or API clients

## Considered options
- **PostgreSQL recursive CTE validation** — pros: single atomic check using native SQL recursion; returns clear CYCLE_DETECTED error code; leverages existing database index on parentId; works regardless of client; cons: requires recursive query knowledge; slightly more complex service method
- **Frontend-only cycle detection** _(rejected)_ — pros: faster feedback before network call; cons: race conditions if multiple clients modify simultaneously; bypassable by direct API calls; inconsistent state possible
- **Application-level traversal in memory** _(rejected)_ — pros: simpler to understand; cons: O(n²) worst-case; must load entire tree into memory; slower than indexed DB query

## Decision
Implement a recursive CTE in `organisation.service.ts` that checks whether `newParentId` is reachable from the unit being moved (i.e., is a descendant), returning `AppError('Cycle détecté', 400, 'CYCLE_DETECTED')` on violation. Also enforce a maximum depth of 6 levels.

## Consequences
Every PATCH to `/api/organisation/unites/:id` is protected against cycles regardless of the caller. Frontend performs a fast pre-check for immediate UX feedback but must still handle the server-side CYCLE_DETECTED response. The depth limit prevents unbounded recursion in downstream recursive queries.