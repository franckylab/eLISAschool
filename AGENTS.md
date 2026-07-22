# eLISAschool — Session Context

## Objective
Refactorer le module organisation et ses nomenclatures en une source de vérité unique, avec routes dédiées, composants génériques, i18n 100% flat, et permissions granulaires.

## Décisions Architecturales (grill-me session)
### Modèle de données
- **NiveauResponsabilite** : table unique `niveaux_responsabilite` (enum supprimé). Poste.niveauResponsabilite calculé via relation.
- **TypePoste** : enum supprimé, `CategoriePoste` table unique. Poste.type calculé via `categoriePosteCode`.
- **TypePersonnel** : entité dans `organisation/entities`, **globale** (pas d'`etablissementId`), `estSysteme` + 8 seeds protégés. Statut RH d'une personne via `MembrePersonnel.typePersonnelId` (1 par personne). Pilote la paie (`modeRemunerationDefaut`). **Aucun** `roleIdParDefaut`/`permissionsDefaut` (RBAC uniquement via `utilisateur_etablissements`).
- **Fonction** : nomenclature **multi-tenant** hiérarchique (primes, carrière). Porte le type statutaire via `Fonction.typePersonnelId` (FK optionnelle → type global). Une personne exerce N fonctions dans le temps via `MembreFonction`.
- **Type attendu d'un Poste** : **dérivé** via `poste.fonction.typePersonnel` — jamais stocké sur `Poste` ni sur `HierarchiePersonnel`. Compatibilité contrat : seul un ENSEIGNANT occupe un poste dont la fonction est de type ENSEIGNANT.
- **JSONB** : `missions`, `competencesRequises`, `metadata` normalisés en tables séparées (Mission, CompetenceRequise, UniteMetadata).
- **TemplateOrganisation** : JSONB conservé (lecture seule, 22 templates seedés).
- **Validation** : anti-cycle arborescence via CTE récursif PostgreSQL sur UniteOrganisationnelle et Fonction.
- **Protection seeds** : `assertNotSystem()` guard backend, UI bouton Supprimer caché + Dupliquer.

### Modules backend
- **Postes** : fusionné dans `organisation/` (contrôleur, service, DTO). Route `/api/organisation/postes`.
- **Fonctions** : sous-domaine d'organisation (entité dans organisation, service/contrôleur propres).
- **TypePersonnel** : entité dans `organisation/entities/`, toujours accessible depuis `personnel/` via barrel.
- **Routes API REST** : pur pluriel (`/api/organisation/niveaux-organisation`, `/api/organisations/usages-unite`, etc.). Actions spéciales via query params ou sous-ressources.

### Frontend
- **Navigation** : routes dédiées pour chaque entité (pattern *utilisateurs*). **Aucune sticky sub-nav intra-page** — la navigation latérale entre sections d'organisation passe par le **sous-menu sidebar** « Organisation » (doublon supprimé).
- **Layout** : `_auth.organisation.tsx` → layout minimal (Breadcrumbs + motion + ErrorBoundary + `<Outlet/>`). Chaque page utilise `PageHeader variant="gradient"` + `DataTable` (liste) ou `TabsBar`/`TabsContent` (détail & config).
- **Modèles & Génération** : section dédiée `/organisation/modeles` (galerie de modèles + builder visuel par nœuds + panneau de génération), séparée des nomenclatures.
- **Pagination** : enveloppe `meta` unifiée (`PaginatedResult<T>` via `@common/utils/pagination.util`) sur les listes unites/postes/fonctions ; hooks front consomment `{ items, meta }`.
- **Composants** : `NomenclatureCrudPage<T>` générique pour les nomenclatures. `TreeView<T>` générique avec DnD pour arbres. `OrgViewToggle` (Table ⇄ Arbre).
- **Hooks** : unitaires par entité (`use-unites.ts`, `use-niveaux-organisation.ts`, etc.), éclatement de `use-organisation.ts`.
- **i18n** : 100% flat, helper `useEnumOptions` pour listes déroulantes.
- **Permissions** : sous-permissions CRUD + section (`organisation:unites:read`, `organisation:postes:write`, etc.). ⚠️ Ne plus utiliser `organisation:edit` (grossier).
- **ConfirmDialog** : pour suppressions. `ConfirmationModal`/`useConfirmation` conservé pour wizards. Documéntés.
- **Icônes** : Building2(module), LayoutDashboard(dashboard), GitBranch(unités), Briefcase(postes), Workflow(fonctions), Network(hiérarchie), Layers(niveaux-org), Tags(usages), FolderTree(catégories), ArrowUpDown(niveaux-resp), FileText(modèles), UserCheck(types-personnel), Sparkles(génération).

### Sidebar
- "Organisation" expandable sous "Organisation Académique" : Vue d'ensemble, Unités, Postes, Fonctions, Hiérarchie, Nomenclatures.
- Icône mère : Building2.

### Tests
- Phase dédiée après stabilisation du refactoring.

## Work State
### Completed
- **10 modules uniformisés** (session précédente) : filières, spécialités, examens-nationaux, diplomes-eleves, competences, periodes, notes, emploi-du-temps, configuration, parametres.
- **Grill-me session** (courante) : 25 décisions architecturales validées pour le refactoring organisation.

### Active
— Aucune tâche active (planification terminée, en attente d'implémentation).

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
Implémenter les décisions du grill-me : backend (modèle, entités, routes, guard) puis frontend (routes, composants génériques, i18n, sidebar).

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
