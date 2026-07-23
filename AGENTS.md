# eLISAschool — Session Context

## Objective
Refactorer le module organisation et ses nomenclatures en une source de vérité unique, avec routes dédiées, composants génériques, i18n 100% flat, et permissions granulaires.

## Décisions Architecturales (grill-me session)
### Modèle de données
- **NiveauResponsabilite** : table unique `niveaux_responsabilite` (enum supprimé). Poste.niveauResponsabilite calculé via relation.
- **CategoriePoste** : table unique `categories_poste` (remplace l'enum `TypePoste`). Poste.type calculé via `categoriePosteId` FK.
- **TypePersonnel** : entité dans `organisation/entities`, **globale** (pas d'`etablissementId`), `estSysteme` + 8 seeds protégés. Route API UNIQUE : `/api/personnel/types`. Pas de doublon dans `/api/organisation/types-personnel`.
- **Fonction** : nomenclature **multi-tenant** hiérarchique (`etablissementId` requis). Porte le type statutaire via `Fonction.typePersonnelId` (FK optionnelle → type global). Seedée par établissement dans `seed-organisation.ts`.
- **Type attendu d'un Poste** : **dérivé** via `poste.fonction.typePersonnel` — jamais stocké sur `Poste` ni sur `HierarchiePersonnel`.
- **NiveauOrganisation** : table `niveaux_organisation` (niveau 0-3). Lié via `UniteOrganisationnelle.niveauOrganisationId`.
- **UsageUnite** : table `usages_unite`. Lié via `UniteOrganisationnelle.usageUniteId`.
- **TypeRelationHierarchique** : table `types_relation_hierarchique`. Lié via `HierarchiePersonnel.typeRelationId`.
- **JSONB** : `missions`, `competencesRequises` conservés sur Poste (pas de tables séparées).
- **TemplateOrganisation** : JSONB conservé (lecture seule, 22 templates seedés).
- **Validation** : anti-cycle arborescence via CTE récursif PostgreSQL sur UniteOrganisationnelle et Fonction.
- **Protection seeds** : `assertNotSystem()` guard backend, UI bouton Supprimer caché + Dupliquer.

### Modules backend
- **Postes** : fusionné dans `organisation/`. Route `/api/organisation/postes`.
- **Fonctions** : entité dans `organisation/entities/`, service/contrôleur propres.
- **TypePersonnel** : entité dans `organisation/entities/`, accessible depuis `personnel/` via barrel. Routes dans `personnel/controllers/` uniquement.
- **Nomenclatures** : 6 CRUD dans `nomenclature.controller.ts` : niveaux-organisation, usages-unite, categories-poste, niveaux-responsabilite, types-unite, types-relation. Pas de types-personnel ici.
- **Seeds** : `seed-nomenclatures.ts` (global, 5 tables), `seed-organisation.ts` (par établissement : fonctions + unités + postes + hiérarchies avec résolution FK complète).
- **Routes API REST** : pur pluriel. Actions via query params ou sous-ressources.
- **Fonction.etablissementId** requis (NOT NULL). Les fonctions système sont seedées par établissement.

### Frontend
- **Navigation** : routes dédiées pour chaque entité. Sidebar « Organisation » : Vue d'ensemble, Unités, Postes, Fonctions, Hiérarchie, Nomenclatures (6 tabs), Modèles.
- **Layout** : `_auth.organisation.tsx` → Breadcrumbs + motion + ErrorBoundary + `<Outlet/>`.
- **Composants** : `NomenclatureCrudPage<T>` générique (6 nomenclatures). Plus de `TemplatesPage` (supprimé, remplacé par `ModelesPage`).
- **Hooks** : unitaires, tous exportés depuis le barrel `features/organisation/index.ts` (use-postes, use-hierarchies, etc.).
- **i18n** : 100% flat. `NomenclatureCrudPage` utilise `t('colActions')` (pas `t('actions')`).
- **Permissions** : sous-permissions CRUD + section. Ne plus utiliser `organisation:edit`.
- **Icônes** : Building2(module), LayoutDashboard(dashboard), GitBranch(unités), Briefcase(postes), Workflow(fonctions), Network(hiérarchie), Layers(niveaux-org), Tags(usages), FolderTree(catégories), ArrowUpDown(niveaux-resp), FileText(modèles), UserCheck(types-personnel), Sparkles(génération).

### Sidebar
- "Organisation" expandable sous "Organisation Académique" : Vue d'ensemble, Unités, Postes, Fonctions, Hiérarchie, Nomenclatures.
- Icône mère : Building2.

### Seeds ordre (initial.seed.ts)
10. seedTypePersonnel() — global, 8 types
10b. seedTypesContrat() — global
10c. seedNomenclatures() — global : categories_poste, niveaux_organisation, niveaux_responsabilite, usages_unite, types_relation_hierarchique
11. seedOrganisation(etablissementId) — par établissement : 22 fonctions arborescentes + 20 unités + 22 postes + 13 hiérarchies (FK résolues)
12. seedTemplatesOrganisation() — global, 22 templates

### Seeds demo ordre (run-demo-seeds.ts)
4. seedPersonnelDemo() — 10 membres + contrats
7. seedOrganisationDemo() — affectations postes + MembreFonction pour les 10 membres
8. seedBulletinsPaieDemo()

### Tests
- Phase dédiée après stabilisation du refactoring.

## Fond alvéole principal (nid d'abeille)
- **SVG statique généré** : `public/fonds-catalogue/nid-alveole-dark.svg` + `nid-alveole-light.svg` — 570 hexagones chacun, 1920×1080, `preserveAspectRatio="xMidYMid slice"`
- **Damier `e`/`S`** : alternance stricte `(row + col) % 2`, `e` en `#5a8a6a`/`#8a9a84`, `S` en `#6a9a7a`/`#7a8a74` (dark/light), opacité 0.45
- **Gradient global dark** : `#1a3a3a` → `#0d2b2b` (teal foncé)
- **Gradient global light** : `#f0f2ee` → `#e6eae2` (gris clair)
- **Gradient par cellule** : 12 directions (30° incréments), assignation pseudo-aléatoire via `seedRand`. Dark : `#1e4040` → `#2d5a4a`. Light : `#e8ece4` → `#dce2da`. Opacité 0.55, contour 0.5px.
- **Composant** `NidAlveoleBackground.tsx` : `fixed inset-0 -z-20`, `background-size: cover`, détecte `data-theme` via MutationObserver pour servir le SVG correspondant
- **Z-ordering** dans `PageLayout` : `-z-20` (base) → `FondRotator` `-z-10` (SVGs catalogue par-dessus, transparent si aucun fond)
- **Générateur** : `/tmp/opencode/gen-honeycomb.js` (Node, usage unique, génère les deux variantes)

### Blocked
— (none)

## Next Move
- Tests unitaires dédiés (phase séparée)
- Sous-permissions CRUD+section granulaires
- Routes détail pour unités (comme postes/fonctions ont `$id`)
- Installer `reactflow` + `dagre` et résoudre les erreurs TS associées
- Réviser `base-form-modal.tsx` colorMap pour couleurs non-`primary` (indigo, purple, green, orange, amber) — utiliser les CSS vars au lieu de classes hardcodées

## Travail effectué — Session 2026-07-23
### Frontend — Nettoyage `any` types
- **`organisation.types.ts`** : `ModifierPosteDto` index signature `[key: string]: any` supprimée, champs explicites ajoutés (`intitule`, `code`, `description`, `nombrePostes`, `statut`, `fonctionId`, `categoriePosteId`, `categoriePosteCode`, `niveauResponsabiliteId`, `missions`, `competencesRequises`, `estSuppleant`). `TemplateOrganisation.structure` → `TemplateStructure` typé. `GenererOrganisationDto.structure` → `TemplateStructure`. `ResultatGeneration.arborescence` → `Record<string, unknown>`.
- **10 hooks** (`use-usages-unite`, `use-niveaux-responsabilite`, `use-categories-poste`, `use-templates`, `use-types-relation`, `use-unites`, `use-hierarchies`, `use-niveaux-organisation`, `use-postes`) : `handleError(e: any, msg)` → `handleError(e: unknown, msg)` + cast interne. `onError: (e: any)` → `(e: unknown)`. `queryParams: any` → `Record<string, string>`.
- **6 composants nomenclature-page** (`categories-poste-page`, `niveaux-organisation-page`, `niveaux-responsabilite-page`, `types-relation-page`, `usages-unite-page`, `types-personnel-page`) : paramètres implicites `v`, `values` typés.
- **`nomenclature-form-modal.tsx`** : générique `T extends Record<string, any>` supprimé. `Props` non-générique avec `initialData?: unknown`. `catch (e: any)` → `(e: unknown)`. Callbacks `.map(f =>` → `.map((f: FieldConfig) =>`.
- **`nomenclature-crud-page.tsx`** : `error?: any` → `Error | null`. `useCreate` variables type → `Partial<T>`.
- **`hierarchie-form-modal.tsx`** : `data: any` → `Record<string, string | undefined>`. `err: any` → `err: unknown`. `tr: any` → `{ id: string; label: string }`. `CreerHierarchieDto.etablissementId` → `string | null | undefined`.
- **`generation-wizard.tsx`** : `noeud: any` → `ApercuNode` interface. `(e: any)` → `(e: ApercuNode)`. Import `OrganigrammeNode` inutilisé supprimé. `noeud.count` / `noeud.postes` null-safety.
- **`unites-page.tsx`** : `flattenTree(nodes: any[]): any[]` → `UniteOrganisationnelle[]`.
- **`unite-detail-page.tsx`** : `(unite as any)` → cast local. `(e: any)` → `OrganigrammeNode`. `(p: any)` → `OrganigrammePoste`.
- **`tab-hierarchie.tsx`** : `postes: any[]` → `OrganigrammePoste[]`. `TreeNode<any>[]` → `TreeNode<OrganigrammeNode>[]`. `p: any` → `p: OrganigrammePoste`.
- **`OrganigrammeFlowView.tsx`** : paramètres implicites `_event`, `node` → `unknown`, `Record<string, unknown>`.
- **`personnel-search-field.tsx`** : `Record<string, any>` → `Record<string, string | number>`.

### Frontend — Couleurs hardcodées → CSS vars
- **`base-form-modal.tsx`** : colorMap retiré `bg-*`, `text-*` → `wrapper` + `iconColor`. `text-gray-900` → `text-foreground`. `bg-red-50` → `bg-destructive/10`. `text-red-500` → `text-destructive`. `Loader2 text-blue-500` → `text-primary`.
- **`personnel-search-field.tsx`** : toutes les couleurs `text-gray-*`, `bg-gray-*`, `bg-blue-*`, `text-blue-*`, `text-red-*`, `border-gray-*`, `border-red-*` → CSS vars (`text-secondary`, `bg-muted`, `bg-primary/10`, `text-primary`, `text-destructive`, `border-border`, `border-destructive`, `bg-card`, `text-muted-foreground`, `bg-accent`, `hover:bg-accent`).
- **`tab-hierarchie.tsx`** : `text-gray-400` → `text-muted-foreground`. `text-blue-500` → `text-primary`. `text-gray-900` → `text-foreground`. `text-gray-600` → `text-secondary`. `bg-white dark:bg-gray-900 border-gray-200` → `bg-card border-border`.
- **`unites-page.tsx`** : `text-gray-900/500/600/400` → `text-foreground`/`text-muted-foreground`/`text-secondary`. `bg-white dark:bg-gray-900 border-gray-200` → `bg-card border-border`. `hover:text-blue/green/red-600` → `hover:text-primary/success/destructive`.
- **`modeles-page.tsx`** : `text-blue-600 hover:bg-blue-50` → `text-primary hover:bg-primary/10`. `text-red-600/500 hover:bg-red-50` → `text-destructive hover:bg-destructive/10`.
- **`nomenclature-form-modal.tsx`** : `text-red-500` → `text-destructive`.
- **`generation-wizard.tsx`** : `text-blue/purple/green-600` → `text-primary`/`text-secondary-foreground`/`text-success`.
- **`UniteFormModal.tsx`, `PosteFormModal.tsx`, `UniteDetailDrawer.tsx`** : `text-red-500` → `text-destructive`. `hover:bg-red-50` → `hover:bg-destructive/10`.

### Frontend — Fusion organigramme
- `OrganigrammeVertical.tsx` et `OrganigrammeHorizontal.tsx` supprimés, remplacés par `OrganigrammeFlowView.tsx` avec prop `direction: 'TB' | 'LR'`.
- `OrganigrammePage.tsx` mis à jour pour utiliser le composant fusionné.

## Notes de conception
- `FilterPanel` retiré quand redondant avec les filtres DataTable intégrés (`enableCollapsibleFilters` + `filtres` prop).
- Toutes les modales de formulaire suivent le pattern : `CustomModal`, `FORM_INIT` constante, `SectionSeparator`, `hasUnsavedChanges`, reset à la fermeture par `useEffect`.
- Pas de glass container system-wide — uniquement dans les actions du PageHeader.
- `TextLabel` (composant réutilisable `components/ui/TextLabel.tsx`) pour les labels importants : utilise `--color-text-strong` (contrat plus élevé), `font-weight: 600`, tooltip natif `title` lors du troncage.
- Hierarchie de contraste : `--color-text-strong` > `--color-text-primary` > `--color-text-secondary` > `--color-text-muted`.
- **Sources de vérité** : NiveauResponsabilite (table), CategoriePoste (table), TypePersonnel (table + estSysteme). Enums TypePoste, NiveauResponsabiliteEnum supprimés.
- **Protection seeds** : `assertNotSystem()` dans shared/helpers. UI : Supprimer caché si estSysteme, Dupliquer ajouté.
- **Composants génériques** : `NomenclatureCrudPage<T>` (7 nomenclatures), `TreeView<T>` (unités, fonctions, organigramme).
- **i18n** : 100% flat. Helper `useEnumOptions(ns, enumValues, prefix)` pour listes déroulantes.
- **Routes API** : pur pluriel REST. `/api/organisation/*`. Actions via sous-ressources ou query params.

## Fonds SVG catalogue (dark mode)
- Tous les SVGs du catalogue utilisent `stroke="currentColor"` et `fill="currentColor"` → `currentColor` se résout en `#000000` dans une image autonome.
- **Correction dark mode** : CSS variables `--fond-filter` et `--fond-opacity` dans `globals.css` :
  - Light : `--fond-filter: none; --fond-opacity: 0.3`
  - Dark  : `--fond-filter: invert(0.85) brightness(1.4); --fond-opacity: 0.7`
- **Composant `FondImage`** (`components/ui/FondImage.tsx`) réutilisable pour toute vignette/aperçu de fond. Modes `background` (FondRotator) et `img` (grille catalogue).
  - Applique `filter: var(--fond-filter)` et `opacity: var(--fond-opacity)` automatiquement.
  - Cache-bust via `?v=${Date.parse(fond.updatedAt)}` intégré.
- **FondRotator** : wrapper div avec les CSS variables, `willChange: opacity, filter`. Rendu transparent (null) en cas d'erreur/chargement/absence de fonds. Prop `fallbackColor` supprimée.
- **ApparencePage** : preview `<img>` avec `filter: var(--fond-filter)`. Grille catalogue miniatures SVG via `FondImage`.
