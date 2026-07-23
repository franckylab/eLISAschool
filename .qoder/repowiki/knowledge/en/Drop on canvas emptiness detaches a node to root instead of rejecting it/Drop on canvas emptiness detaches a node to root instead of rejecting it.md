---
kind: design
name: Drop on canvas emptiness detaches a node to root instead of rejecting it
source: session
category: adr
---

# Drop on canvas emptiness detaches a node to root instead of rejecting it

_Source: coding plans from commit period 2be66fa → 7b24102 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
Dragging a node over empty canvas space previously had no effect, forcing users to drop onto another node and then set its parent to null via a dialog — a two-step process that felt unintuitive.

## Decision drivers
- direct manipulation expectation
- fewer clicks to detach a node
- clear visual feedback during drag

## Considered options
- **Show a confirmation dialog before detaching** _(rejected)_ — pros: safety net against accidental drops; cons: adds latency and friction for a common operation
- **Ignore drops on empty pane** _(rejected)_ — pros: simplest implementation; cons: confusing dead zone; users think DnD is broken
- **Treat pane drop as detach (parentId = null)** — pros: one-shot detachment matching user intent; leverages existing `executerDeplacement` with a sentinel targetId; cons: must guard against dropping the root itself

## Decision
Implement `onPaneDrop` in `use-dnd-organigramme.ts`: if a node is being dragged and dropped on the pane background, call `executerDeplacement(draggedNodeId, '__root__')`, which maps to `parentId: null` on the backend.

## Consequences
Users can detach a subtree to root in one gesture. The sentinel `'__root__'` value must be documented so future callers do not treat it as a real unit id.