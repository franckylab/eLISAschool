# Design — Refactoring unifié des edges ReactFlow (organigramme)

> **Contexte** : Les 3 types de liens (hiérarchie, relation directe, relation fonctionnelle) ont des paramètres de routing, styles et interactions hétérogènes. Ce document propose une architecture unifiée, professionnelle et conforme aux conventions eLISAschool.
> **Date** : 2026-07-27
> **Statut** : 🔄 En cours de validation

---

## 1. Audit de l'existant

### 1.1 Paramètres de routing (smoothstep)

| Paramètre | HierarchieEdge | RelationEdge DIRECT | RelationEdge FONCTIONNEL |
|-----------|---------------|--------------------|--------------------------|
| `borderRadius` | 8 | 12 | 12 |
| `offset` | 4 | 8 | 16 |
| `zIndex` | 0 | 1 | 1 |

**Problème** : borderRadius et offset incohérents entre les 3 types. Les relations DIRECT et FONCTIONNEL ont le même borderRadius mais des offsets différents — quand les deux coexistent entre les mêmes nœuds, le routing est visuellement asymétrique.

### 1.2 Style visuel

| Propriété | Hiérarchie | DIRECT | FONCTIONNEL |
|-----------|-----------|--------|-------------|
| stroke | `dominant-500` (vert) | `secondary-500` (ambre) | `accent-600` (bleu) |
| strokeWidth (repos) | 2.5 | 2 | 2 |
| strokeWidth (hover) | 3 | 3 | 3 |
| strokeDasharray | — (plein) | `10 5` | `4 5` |
| opacity (repos) | 1.0 | 0.8 | 0.8 |
| opacity (hover) | 1.0 | 1.0 | 1.0 |
| marker size | 14×14 | 16×16 | 16×16 |
| transition | stroke + width | width + opacity | width + opacity |

**Problèmes** :
- Largeur hiérarchie (2.5) > relations (2) → les relations semblent "secondaires"
- Opacité 0.8 au repos → les relations paraissent fades
- Transitions hétérogènes → animation incohérente au hover global
- Markers de tailles différentes → inconsistency visuelle

### 1.3 Interactivité

| Feature | Hiérarchie | Relations |
|---------|-----------|-----------|
| Hover tooltip | Oui | Oui |
| Clic | Non | Oui (ouvre drawer) |
| Badge compteur | Non | Oui |
| `role="button"` | Non | Oui |
| `aria-label` | Non | Oui |
| Selected state | Non | Oui |

**Problème** : Asymétrie UX — la hiérarchie n'est pas interactive alors qu'elle transporte de l'information (nbPostes).

### 1.4 Code dupliqué

Les deux composants partagent ~70% de logique identique :
- Hit-testing (path transparent 16px)
- `getSmoothStepPath` + `EdgeLabelRenderer`
- Hover state (`isHovered`)
- Tooltip positioning (`translate(-50%, -50%) translate(labelX, labelY)`)
- Export fix (`fill="none"` explicite)
- Transition CSS

---

## 2. Architecture cible

### 2.1 Composant base partagé : `BaseEdge.tsx`

Extraire la logique commune dans un hook + composant de rendu :

```
edges/
├── BaseEdge.tsx          ← NOUVEAU : hook useBaseEdge + composant EdgeShell
├── HierarchieEdge.tsx    ← v5.0.0 : utilise useBaseEdge
├── RelationEdge.tsx      ← v4.0.0 : utilise useBaseEdge
└── index.ts              ← barrel
```

#### `useBaseEdge` hook

```typescript
interface BaseEdgeConfig {
    sourceX: number;
    sourceY: number;
    sourcePosition: Position;
    targetX: number;
    targetY: number;
    targetPosition: Position;
    offset: number;
    borderRadius?: number;
}

interface BaseEdgeResult {
    edgePath: string;
    labelX: number;
    labelY: number;
    isHovered: boolean;
    handlers: {
        onMouseEnter: () => void;
        onMouseLeave: () => void;
    };
}
```

#### `EdgeShell` composant

Rend le `<g>` avec hit-testing + path visible + transitions unifiées :

```typescript
interface EdgeShellProps {
    id: string;
    edgePath: string;
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
    opacity?: number;
    markerEnd?: EdgeMarkerString;
    isHovered: boolean;
    handlers: { onMouseEnter: () => void; onMouseLeave: () => void };
    onClick?: () => void;
    role?: string;
    ariaLabel?: string;
    children?: ReactNode; // Badge/tooltip via EdgeLabelRenderer
}
```

### 2.2 Paramètres unifiés

| Paramètre | Hiérarchie | DIRECT | FONCTIONNEL |
|-----------|-----------|--------|-------------|
| `borderRadius` | **10** | **10** | **10** |
| `offset` | **4** | **10** | **18** |
| `strokeWidth` (repos) | **2.5** | **2.5** | **2.5** |
| `strokeWidth` (hover) | **3.5** | **3.5** | **3.5** |
| `opacity` (repos) | **1.0** | **1.0** | **1.0** |
| `opacity` (hover) | **1.0** | **1.0** | **1.0** |
| `marker size` | **15×15** | **15×15** | **15×15** |
| `zIndex` | 0 | 1 | 2 |
| `transition` | `all 0.2s ease` | `all 0.2s ease` | `all 0.2s ease` |

**Rationale** :
- `borderRadius: 10` : compromis entre 8 (trop serré) et 12 (trop rond)
- `offset` progressif (4/10/18) : séparation visuelle garantie quand les 3 types coexistent
- `strokeWidth: 2.5` uniforme : tous les liens ont le même poids visuel
- `opacity: 1.0` : les liens sont toujours pleinement visibles
- `marker: 15×15` : taille intermédiaire unifiée
- `zIndex` progressif : FONCTIONNEL > DIRECT > hiérarchie (les overlays passent au-dessus)

### 2.3 Couleurs canon (inchangées)

| Type | Couleur CSS | Fallback |
|------|-----------|----------|
| Hiérarchie | `--color-dominant-500` | #28a745 |
| Direct | `--color-secondary-500` | #f59e0b |
| Fonctionnel | `--color-accent-600` | #007bff |

### 2.4 Dasharray (inchangés — distinction visuelle par le trait)

| Type | Pattern | Signification |
|------|---------|---------------|
| Hiérarchie | plein (solid) | Lien structurel fort |
| Direct | `10 5` | Relation nominative espacée |
| Fonctionnel | `4 5` | Relation dense, flux de travail |

---

## 3. Interactivité unifiée

### 3.1 Tooltip commun

Un seul composant `EdgeTooltip` partagé :

```typescript
interface EdgeTooltipProps {
    labelX: number;
    labelY: number;
    couleur: string;
    titre: string;
    sourceNom?: string;
    targetNom?: string;
    detail?: string; // ex: "3 poste(s)" ou "2 relation(s)"
    position?: 'above' | 'below'; // hiérarchie=above, relations=below badge
}
```

Style unifié :
- `backgroundColor: var(--org-node-bg)`
- `border: 1.5px solid ${couleur}` (bordure colorée selon le type)
- `fontSize: clamp(10px, 0.7vw + 0.35rem, 12px)`
- `padding: 5px 10px`
- `borderRadius: var(--radius-lg)`
- `boxShadow: 0 2px 8px rgba(0,0,0,0.12)`
- Animation : `opacity 0.15s ease` (fade-in)

### 3.2 Badge compteur étendu

Ajouter un badge sur la hiérarchie quand `nbPostes > 0` :
- Même style que le badge relation (cercle, couleur du type)
- Icône Briefcase miniature + nombre de postes
- Non-cliquable (pas de drawer pour la hiérarchie)

### 3.3 Clic sur hiérarchie

Ajouter un `onClick` sur HierarchieEdge qui sélectionne le nœud cible (comme un raccourci) :
- `data.onSelect?.(targetNodeId)` — nouveau callback injecté via `data`
- Feedback visuel : le nœud cible pulse brièvement

---

## 4. Anti-chevauchement

### 4.1 Stratégie d'offset progressif

Quand hiérarchie + DIRECT + FONCTIONNEL relient les mêmes nœuds A→B :
- Hiérarchie : offset 4 (proche du centre)
- DIRECT : offset 10 (décalé à droite)
- FONCTIONNEL : offset 18 (décalé encore plus)

Les 3 traits sont parallèles, jamais superposés.

### 4.2 Détection de coexistence

Dans `use-organigramme-flow.ts`, détecter quand un edge relation partage la même paire (source, target) qu'un edge hiérarchie et ajuster l'offset dynamiquement :

```typescript
// Dans construireEdgesRelations
const aHierarchie = rfEdges.some(e => 
    e.type === 'hierarchieEdge' && 
    ((e.source === g.source && e.target === g.target) ||
     (e.source === g.target && e.target === g.source))
);
// Si coexistence, augmenter l'offset pour séparer
const offsetBase = estFonctionnel ? 18 : 10;
const offset = aHierarchie ? offsetBase + 4 : offsetBase;
```

---

## 5. Export

### 5.1 Légende unifiée

La légende export (PNG overlay + PDF jsPDF) reste identique visuellement mais les épaisseurs de trait sont alignées sur les nouveaux paramètres :
- Tous les traits : 2.5px (au lieu de 2.5/2/2)
- Dasharray : inchangés (plein / `10 5` / `4 5`)

### 5.2 Compatibilité

Le `preparerPourExport()` existant fonctionne déjà avec les nouveaux paramètres :
- `fill="none"` explicite sur tous les paths ✓
- Résolution CSS vars ✓
- Suppression animations ✓

Aucun changement nécessaire dans le pipeline export.

---

## 6. Fichiers à modifier

| Fichier | Action | Version |
|---------|--------|---------|
| `edges/BaseEdge.tsx` | **CRÉER** — hook `useBaseEdge` + `EdgeShell` + `EdgeTooltip` | 1.0.0 |
| `edges/HierarchieEdge.tsx` | **REFACTORER** — utilise `useBaseEdge` + `EdgeShell` | 5.0.0 |
| `edges/RelationEdge.tsx` | **REFACTORER** — utilise `useBaseEdge` + `EdgeShell` | 4.0.0 |
| `edges/index.ts` | **METTRE À JOUR** — export `BaseEdge` | — |
| `hooks/use-organigramme-flow.ts` | **MODIFIER** — marker 15×15, offset dynamique, zIndex 0/1/2 | 1.1.0 |
| `utils/export.ts` | **MINOR UPDATE** — légende épaisseur 2.5 pour tous | 4.1.1 |
| `toolbar/OrganigrammeToolbar.tsx` | **MINOR UPDATE** — légende SVG alignée (strokeWidth 2.5) | 4.1.0 |
| `locales/fr/organisation.json` | **AJOUT** clés tooltip hiérarchie (si nouveau) | — |
| `locales/en/organisation.json` | **AJOUT** clés tooltip hiérarchie (si nouveau) | — |

---

## 7. Recommandations supplémentaires

### 7.1 Court terme (cette session)
1. **BaseEdge.tsx** : composant base partagé, élimine 70% de duplication
2. **Paramètres unifiés** : borderRadius=10, offset progressif, strokeWidth=2.5, marker=15
3. **Tooltip unifié** : même composant, même style, même animation
4. **Anti-chevauchement** : détection coexistence + offset dynamique

### 7.2 Moyen terme (sessions futures)
5. **Edge animation on create** : transition `stroke-dashoffset` de 2000→0 lors de l'apparition d'un edge (avec garde export : supprimer avant capture)
6. **Edge bundling** : quand >3 edges partagent le même corridor, les regrouper visuellement (algorithme de FDEB — Force-Directed Edge Bundling). Complexe, à évaluer.
7. **Minimap edge colors** : la minimap ReactFlow ne colore pas les edges par type — proposer un patch custom.

### 7.3 Long terme (si besoin)
8. **WebGL rendering** : pour les organigrammes >500 nœuds, remplacer le SVG par un rendu canvas/WebGL (react-flow n'est pas optimisé pour >1000 edges)
9. **Edge labels inline** : afficher le type de relation directement sur le path (comme les diagrammes UML) au lieu d'un badge

---

## 8. Critères d'acceptation

- [ ] 0 `any` dans les fichiers modifiés
- [ ] 0 couleur hardcodée (CSS vars uniquement, fallbacks dans COULEURS_LIENS_DEFAUT)
- [ ] i18n FR/EN parité complète
- [ ] `tsc --noEmit` : 0 erreur in-scope
- [ ] Export PNG : les 3 types de liens sont visibles et distincts
- [ ] Export PDF : légende alignée (épaisseurs, dasharray, couleurs)
- [ ] Hover : transition fluide et identique pour les 3 types
- [ ] Mode sombre : toutes les couleurs s'adaptent via CSS vars
- [ ] Responsive : edges lisibles de 320px à 2560px
- [ ] Anti-chevauchement : 3 edges entre mêmes nœuds = 3 traits parallèles distincts
- [ ] Composant BaseEdge réutilisable (0 duplication HierarchieEdge/RelationEdge)

---

**📌 Prochaines étapes** : Valider le design → Implémenter BaseEdge.tsx → Refactorer HierarchieEdge + RelationEdge → Mettre à jour use-organigramme-flow.ts → Vérifier export → Mettre à jour AGENTS.md et règles .qoder
