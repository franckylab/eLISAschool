---
kind: design
name: Handle-to-handle connections replace node-over-node as the primary way to change parents
source: session
category: adr
---

# Handle-to-handle connections replace node-over-node as the primary way to change parents

_Source: coding plans from commit period 2be66fa → 7b24102 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The original DnD changed a node's parent by dropping it *onto* another node, which conflated reordering with reparenting and made invalid targets hard to distinguish.

## Decision drivers
- unambiguous parent-child semantics
- visual affordance for connection direction
- React Flow native edge creation

## Considered options
- **Keep node-over-node reparenting only** _(rejected)_ — pros: minimal code change; cons: ambiguous intent vs sibling reorder; no directional cue
- **Use handle-to-handle plus node-over-node fallback** _(rejected)_ — pros: familiar pattern; cons: two competing interactions increase cognitive load and conflict resolution complexity
- **Handle-to-handle exclusively (source bottom/right → parent, target top/left → child)** — pros: directional clarity; uses React Flow's built-in `onConnect`; integrates naturally with anti-cycle checks; cons: requires enabling `connectable` handles and wiring `onConnect`

## Decision
Enable `connectable` handles on `UniteNode` in edit mode: bottom/right handles act as parent sources, top/left as child targets. `onConnect` validates anti-cycles via `estDescendant` and calls `modifierUnite(targetId, parentId=sourceId)`. A new `HierarchieEdge` animates the incoming connection.

## Consequences
Reparenting becomes visually explicit and less error-prone. Sibling reordering remains a separate concern (planned Phase 5) and should not compete with handle connections.