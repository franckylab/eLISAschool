# eLISAschool — Session Context

## Objective
Refactorer le module organisation et ses nomenclatures en une source de vérité unique, avec routes dédiées, composants génériques, i18n 100% flat, et permissions granulaires.

## Décisions Architecturales (grill-me session — consolidé v4.0)
### Modèle de données — 8 entités + 1 template (réduction 33% depuis 12)
- **Poste** : pivot central unifiant les 3 axes (où=unite, quoi=fonction, qui=occupant). `categoriePosteId` supprimé — catégorie dérivée via `poste.fonction.typePersonnel`.
- **EchelonStructurel** (ex-NiveauOrganisation + UsageUnite) : fusion des deux concepts. Champs : `niveau` (int), `code` (string, ex: 'DIRECTION'), `label`, `description`, `couleur`, `estSysteme`, `etablissementId`. `UniteOrganisationnelle` référence uniquement `echelonStructurelId`.
- **NiveauResponsabilite** : table `niveaux_responsabilite`. Axe orthogonal à EchelonStructurel (poids hiérarchique vs profondeur structurelle).
- **TypePersonnel** : entité **globale** (pas d'`etablissementId`), 8 seeds protégés (TYPE_ENSEIGNANT, etc.). `modeRemunerationDefaut` supprimé (anomalie global→multi-tenant, déjà porté par TypeContratPersonnalise).
- **ModeRemunerationEntity** : source unique de vérité pour les modes de rémunération. L'enum `ModeRemuneration` du module paie est **supprimée**. FK uuid dans ContratPersonnel et TypeContratPersonnalise.
- **HierarchiePersonnel** : `typeRelationId` (FK) remplacé par `typeRelation` (varchar enum : DIRECT, FONCTIONNEL). `uniteOrganisationnelleId` supprimé (redondant avec Poste).
- **Fonction** : nomenclature multi-tenant hiérarchique. Porte `typePersonnelId` (FK → type global).
- **JSONB** : `missions`, `competencesRequises` conservés sur Poste.
- **TemplateOrganisation** : JSONB (lecture seule, 22 templates). Interfaces adaptées : `TemplatePoste.categoriePosteId` supprimé, `NoeudTemplateOrganisation.usageUnite` → `echelonCode`, `niveau` supprimé.
- **Validation** : anti-cycle arborescence via CTE récursif PostgreSQL.
- **Protection seeds** : `assertNotSystem()` guard backend, UI bouton Supprimer caché + Dupliquer.

### Entités supprimées (4)
- ❌ `UsageUnite` → fusionné dans EchelonStructurel
- ❌ `CategoriePoste` → dérivé via Fonction.typePersonnel
- ❌ `TypeRelationHierarchique` → enum varchar sur HierarchiePersonnel
- ❌ `NiveauOrganisation` → renommé EchelonStructurel

### Modules backend
- **Postes** : dans `organisation/`. Route `/api/organisation/postes`.
- **Fonctions** : entité dans `organisation/entities/`, service/contrôleur propres.
- **TypePersonnel** : entité dans `organisation/entities/`, accessible depuis `personnel/` via barrel. Routes dans `personnel/controllers/`.
- **Nomenclatures** : 4 CRUD dans `nomenclature.controller.ts` : echelons-structurels, niveaux-responsabilite, modes-remuneration. Types-personnel dans personnel.
- **Seeds** : `seed-nomenclatures.ts` (global : echelons_structurels, niveaux_responsabilite, modes_remuneration), `seed-type-personnel.ts` (global, 8 types), `seed-organisation.ts` (par établissement : fonctions + unités + postes + hiérarchies).
- **Routes API REST** : pur pluriel. Actions via query params ou sous-ressources.

### Frontend
- **Navigation** : Sidebar « Organisation » : Vue d'ensemble, Unités, Postes, Fonctions, Organigramme (vue unifiée), Nomenclatures (4 onglets : Échelons, Responsabilités, Types personnel, Modes rémun.), Modèles.
- **Layout** : `_auth.organisation.tsx` → Breadcrumbs + motion + ErrorBoundary + `<Outlet/>`.
- **Composants** : `NomenclatureCrudPage<T>` générique (4 nomenclatures). Pages supprimées : `categories-poste-page`, `usages-unite-page`, `niveaux-organisation-page`, `types-relation-page`.
- **Hooks** : unitaires, barrel `features/organisation/index.ts`.
- **i18n** : 100% flat. Clés obsolètes nettoyées (categoriePoste, usageUnite, niveauOrganisation, typeRelation seeds).
- **Permissions** : sous-permissions CRUD + section. `organisation:unites:read`, `organisation:postes:write`, etc.
- **Icônes** : Building2(module), GitBranch(unités), Briefcase(postes), Workflow(fonctions), Network(organigramme), Layers(échelons), ArrowUpDown(responsabilités), UserCheck(types-personnel), Wallet(modes-rémun.), FileText(modèles), Sparkles(génération).

### Sidebar
- "Organisation" expandable : Vue d'ensemble, Unités, Postes, Fonctions, Organigramme, Nomenclatures, Modèles.
- Icône mère : Building2.

### Seeds ordre (initial.seed.ts)
10. seedTypePersonnel() — global, 8 types (TYPE_ENSEIGNANT, etc.). `modeRemunerationDefaut` supprimé des seeds.
10b. seedTypesContrat() — global
10c. seedNomenclatures() — global : echelons_structurels (fusion niveaux_organisation + usages_unite), niveaux_responsabilite, modes_remuneration
11. seedOrganisation(etablissementId) — par établissement : fonctions + unités + postes + hiérarchies (FK résolues)
12. seedTemplatesOrganisation() — global, 22 templates (interfaces adaptées : echelonCode, sans categoriePosteId)

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
Implémenter la refonte v4.0 du modèle organisation (grill-me consolidé) :
1. **Backend — Migration SQL** : rename niveaux_organisation → echelons_structurels (+ code, couleur), drop usages_unite/categories_poste/types_relation_hierarchique, add FK modeRemunerationId sur contrats/types_contrat, drop modeRemunerationDefaut sur types_personnel, drop categoriePosteId sur postes, HierarchiePersonnel.typeRelationId → typeRelation varchar
2. **Backend — Entités/Services/DTOs** : renommer/créer/supprimer les fichiers correspondants
3. **Backend — Seeds** : adapter seed-nomenclatures, seed-type-personnel, seed-templates
4. **Backend — Enum paie** : supprimer `paie/entities/mode-remuneration.enum.ts`, remplacer par constantes TS
5. **Frontend — Pages** : supprimer 4 pages nomenclature, créer page onglets 4 tabs
6. **Frontend — Composants** : mettre à jour unite-detail, poste-form, types, organigramme
7. **Frontend — i18n** : nettoyer clés obsolètes, ajouter echelonStructurel
8. **Frontend — Sidebar** : retirer "Hiérarchie", ajouter "Organigramme"
9. **Tests** : phase dédiée après stabilisation

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
- **Sources de vérité** : EchelonStructurel (table, fusion NiveauOrg+UsageUnite), NiveauResponsabilite (table), TypePersonnel (table globale), ModeRemunerationEntity (table, remplace enum paie). CategoriePoste, TypeRelationHierarchique supprimés.
- **Protection seeds** : `assertNotSystem()` dans shared/helpers. UI : Supprimer caché si estSysteme, Dupliquer ajouté.
- **Composants génériques** : `NomenclatureCrudPage<T>` (4 nomenclatures), `TreeView<T>` (unités, fonctions, organigramme).
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


## Travail effectué — Session 2026-07-23 (grill-me organisation v4.0)
### Consolidation du modèle (8 décisions validées)
1. **ModeRemunerationEntity** = source unique, enum `ModeRemuneration` (paie) supprimée
2. **NiveauOrganisation** → renommé `EchelonStructurel`
3. **UsageUnite** → fusionné dans `EchelonStructurel` (ajout champ `code`)
4. **TypeRelationHierarchique** (table) → enum varchar `DIRECT/FONCTIONNEL` sur HierarchiePersonnel
5. **CategoriePoste** → supprimé, dérivé via `Fonction.typePersonnel`
6. **TypePersonnel.modeRemunerationDefaut** → supprimé
7. **TemplateOrganisation** → interfaces adaptées (echelonCode, sans categoriePosteId)
8. **Frontend** → sidebar simplifiée, Nomenclatures 4 onglets, Organigramme unifié

### Architecture & Modèle (session précédente)
- **TypePersonnel codes** : préfixe `TYPE_` pour disambiguer de CategoriePoste. `personnel.constants.ts`, `seed-type-personnel.ts`, `seed-organisation.ts` mis à jour. Migration seed auto : renommage des anciens codes (ex. `ENSEIGNANT` → `TYPE_ENSEIGNANT`).
- **TemplatePoste.fonctionId** : champ optionnel ajouté à l'interface. `generation.service.ts` priorise `fonctionId` sur `fonctionRef`. Validation croisée seed-templates : vérifie que chaque `fonctionRef` existe dans la base.
- **CTE anti-cycle HierarchiePersonnel** : remplacement du DFS applicatif par une `WITH RECURSIVE` PostgreSQL dans `organisation.service.ts`.
- **Progression niveaux unités** : validation stricte `enfant.niveau === parent.niveau + 1` ajoutée à `createUnite` et `updateUnite`.
- **Permissions GET** : `requirePermission('organisation:*:read')` ajouté à toutes les routes GET (unites, fonctions, hierarchie, nomenclatures, templates) qui étaient sans guard.
- **Sidebar filtrage** : `organisation:view`/`organisation:manage` ajouté aux `permsMap` du Sidebar via `useModulePermissions('organisation')`.

### Frontend
- **UniteDetailPage** : permission guard (`beforeLoad`), boutons Edit/Delete, modal d'édition (`UniteFormModal`), confirmation suppression. Typage propre (`UniteDetail` extends `UniteOrganisationnelle`). Cast `(unite as any)` supprimé.
- **reactflow + dagre** : `npm install` exécuté. Composant `OrganigrammeFlowView.tsx` fonctionnel sans erreur TS.

### AGENTS.md
- Décisions grill-me documentées (prefix TYPE_, fonctionId, CTE, progression niveaux, permissions GET, sidebar).

### Frontend — base-form-modal colorMap
- **`base-form-modal.tsx`** : couleurs indigo/purple/green/orange/amber remplacées par CSS vars (`var(--color-info)`, `accent`, `var(--color-success)`, `var(--color-warning)`). Plus de classes hardcodées dark/light.
