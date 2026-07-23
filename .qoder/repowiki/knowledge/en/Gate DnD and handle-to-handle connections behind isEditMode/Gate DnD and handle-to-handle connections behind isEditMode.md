---
kind: design
name: Gate DnD and handle-to-handle connections behind isEditMode
source: session
category: adr
---

# Gate DnD and handle-to-handle connections behind isEditMode

_Source: coding plans from commit period 2be66fa → 7b24102 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The existing organigramme drag-and-drop was always active, preventing users from simply viewing the hierarchy without accidentally moving nodes. Additionally, connecting nodes required dragging between handles, which was not discoverable.

## Decision drivers
- prevent accidental edits in read-only mode
- make connection affordances visible only when editing
- consistent edit/view UX across vertical and horizontal views

## Considered options
- **Always-on DnD with confirmation dialogs** _(rejected)_ — pros: no mode switching needed; cons: high risk of accidental moves; no clear visual distinction between view and edit
- **Toggle button to enable/disable DnD** _(rejected)_ — pros: explicit control; cons: extra click per session; harder to keep consistent across components
- **Gate everything via a single `isEditMode` prop on ReactFlow** — pros: single source of truth for draggable/connectable/elementsSelectable; applies uniformly to both OrganigrammeVertical and OrganigrammeHorizontal; cons: requires passing the prop through the component tree

## Decision
Bind `nodesDraggable`, `nodesConnectable`, and `elementsSelectable` directly to an `isEditMode` flag passed into `OrganigrammeVertical.tsx` and `OrganigrammeHorizontal.tsx`. When false, React Flow ignores all drag and connect events, so DnD and handle-to-handle connections are disabled together.

## Consequences
Read-only viewers cannot trigger any DnD or connect events by accident. Edit-mode must be explicitly enabled (e.g., via a page-level toggle). The same flag controls node selection, handle visibility, and the ⋮ menu behavior, keeping interaction modes coherent.