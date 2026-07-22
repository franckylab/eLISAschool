---
kind: design
name: Use React Flow + dagre for interactive org chart rendering
source: session
category: adr
---

# Use React Flow + dagre for interactive org chart rendering

_Source: coding plans from commit period 7b80115 → 3814600 — records intent at planning time; the implementation may lag or differ._

## Context
The eLISAschool application needed an interactive organizational chart to visualize hierarchical units and positions. The existing TreeView was insufficient for large hierarchies where users need to pan, zoom, collapse/expand subtrees, and drag-and-drop restructure the tree.

## Decision drivers
- interactive manipulation (drag-and-drop restructuring)
- large hierarchy navigation (zoom/pan/minimap)
- multiple layout orientations (vertical/horizontal)
- existing React ecosystem compatibility

## Considered options
- **React Flow + dagre** — pros: mature graph library with built-in DnD, zoom, minimap; dagre provides automatic hierarchical layout in TB/LR directions; custom node/edge components allow rich UI; active community; cons: additional bundle size (~150KB); learning curve for React Flow concepts (nodes/edges/handles)
- **Custom SVG canvas** _(rejected)_ — pros: zero dependencies, full control over rendering; cons: must implement all interactions from scratch (DnD, zoom, panning, edge routing); no layout engine; high maintenance burden
- **Existing TreeView only** _(rejected)_ — pros: no new dependencies, already implemented; cons: cannot handle large hierarchies effectively; no visual overview; no drag-and-drop restructuring; poor UX for deep trees

## Decision
Adopt React Flow as the rendering engine with dagre for automatic hierarchical layout, supporting both vertical (top-down) and horizontal (left-right) orientations via a single `computeLayout` helper that switches between 'TB' and 'LR' directions.

## Consequences
Adds two npm dependencies (`reactflow`, `dagre`) and introduces a new feature module under `frontend/src/features/organisation/components/organigramme/`. The existing TreeView is preserved as a fallback view for narrow screens (<480px). Custom `UniteNode` and `HierarchieEdge` components encapsulate the org-chart-specific UI, keeping React Flow concerns separate from business logic.