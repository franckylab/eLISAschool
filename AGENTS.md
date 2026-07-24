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

## Travail effectué — Session 2026-07-24 (fix FK crash seeds + serveur)
### Problème critique
- **Crash serveur** : `ALTER TABLE heures_cours ADD CONSTRAINT FK_4694216da... REFERENCES classes_annees` échouait car `classeAnneeId` contenait des UUID orphelins (71 lignes avec ancien `classeId`).
- **DTO obsolète** : `createHeureCoursSchema` utilisait `classeId` au lieu de `classeAnneeId` (refactoring v4.0 incomplet).
- **Service obsolète** : référençait `EmploiDuTemps` (supprimé) au lieu de `CreneauHoraire` ; requêtait `slot.classeAnneeId` directement au lieu de `slot.affectationMatiere?.classeAnneeId`.
- **Seed runners** : 3 scripts (`run-seeds.ts`, `run-demo-seeds.ts`, `run-rbac-seed.ts`) créent leur propre `DataSource` et contournent `initializeDatabase()`.

### Correctifs appliqués
1. **`pre-sync-cleanup.ts`** (nouveau module partagé) : nettoie les orphelins AVANT synchronize.
   - Détecte `classeId` (old) vs `classeAnneeId` (new) → DROP TABLE `heures_cours` CASCADE si schéma obsolète
   - Supprime les lignes avec `classeAnneeId`/`salleId` orphelins si le schéma est déjà v4.0
   - Supprime les FK obsolètes sur `creneauId` si la table cible manque
   - Fonctionne avec connexion pg brute, utilisable avant toute `initialize()`
2. **`pre-sync-cleanup.ts` — `envDbConfig()`** : lit la config depuis les vars d'env (DRY)
3. **`data-source.ts`** : `initializeDatabase()` appelle `cleanOrphanHeuresCours()` avant `AppDataSource.initialize()`
4. **`run-seeds.ts`** : importe et appelle `cleanOrphanHeuresCours(envDbConfig())` avant `SeedDataSource.initialize()`
5. **`run-rbac-seed.ts`** : idem
6. **`run-demo-seeds.ts`** : `synchronize: false` (pas de risque FK, pas de modif nécessaire)
7. **`@types/pg`** : installé pour la déclaration TS du module `pg`
8. **DTO `heure-cours.dto.ts`** : `classeId`→`classeAnneeId`, ajout `salleId`/`commentaire`/`affectationMatiereId`
9. **Service `heure-cours.service.ts`** : `EmploiDuTemps`→`CreneauHoraire`, jointure via `affectationMatiere`
10. **`seed-nomenclatures.ts`** v4.0 : 10 échelons avec couleurs, update des existants
11. **`seed-templates.ts`** : 5 codes invalides corrigés (`CENSORAT`→`DIRECTION`, etc.)
12. **`seed-heures-cours-edt.ts`** : constructeur au lieu de `repo.create()`

### Résultat
- `npm run seed` → ✅ (synchronize + seeds système OK)
- `npm run seed:demo` → ✅ (8 créneaux, 5 heures cours, 12 bulletins)
- `npm run start:ts` → ✅ (serveur démarre, health endpoint 200)
- Schéma `heures_cours` : `classeAnneeId uuid NOT NULL` avec FK→`classes_annees`. Table `creneaux_horaires` créée. Ancienne `emploi_du_temps` intacte (données inertes).

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

## Travail effectué — Session 2026-07-24 (grill-me audit + corrections)
### Backend — Bugs critiques corrigés
- **`organisation.service.ts`** : Bug 1 — `creerUniteAvecPostes` supprimé `estSuppleant` et `etablissementId` (champs inexistants sur Poste). Bug 2 — `getImpactUnite` utilisait `uniteOrganisationnelleId` sur HierarchiePersonnel (inexistant) → corrigé pour `posteId: In(postes.map(p => p.id))`.
- **`mode-remuneration.entity.ts` + `niveau-responsabilite.entity.ts`** : Contraintes `unique: true` sur `code` supprimées → index composites partiels multi-tenant `['code', 'etablissementId'] WHERE "etablissementId" IS NOT NULL`.

### Backend — Normalisation échelons structurels
- **13 → 10 échelons** : suppression redondances (DIRECTION_GENERAL, DEPARTEMENT, SOUS_SERVICE), rename BIBLIOTHEQUE → CDI.
- **Couleurs ajoutées** : chaque échelon a une couleur distinctive (#2563eb, #7c3aed, #059669, etc.).
- **Config registry** : `typesUnitesActifs` aligné avec 10 codes normalisés.
- **Migration 113** : Drop contraintes unique globales + recréation index composites partiels.
- **Migration 119** (renommée depuis 114) : SQL idempotent (rename BIBLIOTHEQUE→CDI, delete redondants, update couleurs).

### Backend — Organigramme enrichi
- **`buildArborescence`** : ajout `relations: ['echelonStructurel']` + `echelonStructurelLabel` et `echelonCouleur` dans les noeuds.

### Frontend — Organigramme amélioré
- **UniteNode.tsx** : Badge échelon coloré dans header + badge niveau responsabilité sous chaque poste. i18n complet (6 chaînes FR hardcodées → `t()`). CSS vars (`text-destructive`, `text-[var(--color-warning)]`).
- **OrganigrammeFlowView.tsx** : i18n "Quitter" → `t('quitterPleinEcran')`. Height responsive `clamp(300px, calc(100vh - 320px), 800px)`.

### Frontend — Qualité code
- **`use-handle-error.ts`** : Hook partagé `useHandleError()` extrait, remplace 6 duplications dans les hooks.
- **12 usages `any` résorbés** : `use-postes.ts` (CreatePosteDto), `use-unites.ts` (UniteOrganisationnelle[]), `use-hierarchies.ts` (type retour validate), `types-personnel-page.tsx` (Column<TypePersonnel>), `nomenclature-crud-page.tsx` (unknown), `personnel-search-field.tsx` (MembrePersonnel), `modeles-page.tsx` (NoeudTemplate/TemplateStructure), `unites-page.tsx` (n.enfants), `OrganigrammeFlowView.tsx` (React.MouseEvent/Node).
- **Anti-pattern hooks inline** : 4 pages nomenclatures → composant `FormWrapper` dédié avec hooks au niveau supérieur.
- **Couleurs hardcodées restantes** : `UniteDetailDrawer.tsx` fallbacks → CSS vars. `#fff` et fallbacks CSS vars acceptés.

### Frontend — Sidebar
- **Lien Organigramme** : `/organisation/organigramme` → `/organisation` (route index).

### Sécurité multi-tenant (P0 — failles CRITICAL corrigées)
- **`unites.controller.ts`** : `etablissementId` forcé depuis le token sur POST create, POST avec-postes, PATCH update, DELETE, reordonner, chemin hiérarchique.
- **`organisation.service.ts`** : `updateUnite`, `deleteUnite`, `reordonnerUnite`, `getCheminHierarchique`, `updateHierarchie`, `deleteHierarchie` filtrent désormais par `etablissementId`.
- **`organigramme.controller.ts`** : `requirePermission('organisation:organigramme:read')` ajouté sur les 4 routes.
- **`nomenclature.controller.ts`** : `etablissementId` passé à `findById`, `update`, `delete` pour les 4 nomenclatures (échelons, niveaux, templates, modes).
- **4 services nomenclature** : `findById/update/delete` acceptent `etablissementId` et filtrent les requêtes.
- **`postes.controller.ts`** : `etablissementId` passé à `create`, `update`, `delete`.
- **`postes.service.ts`** : `create` vérifie que l'unité cible appartient à l'établissement. `update/delete` filtrent via `findById(id, etablissementId)`.

### Entités — Contraintes multi-tenant corrigées
- **`niveau-responsabilite.entity.ts`** : `unique: true` retiré de `@Column` sur `code`. Index composé avec `where: '"etablissementId" IS NOT NULL'`.
- **`mode-remuneration.entity.ts`** : idem.

### Frontend — Qualité code (suite)
- **`OrganigrammePage.tsx`** : gestion erreur avec bouton Réessayer. `OrganigrammeFlowView` rendu conditionnel (lazy). `handleConfirmMove` avec `toast.error`.
- **`nomenclature-crud-page.tsx`** : suppression wrappée dans try/catch (dialog ne se ferme que si succès).
- **`use-unites.ts`** : `staleTime: 30_000` sur useUnites et useArborescence. `useCreerUniteAvecPostes` invalide aussi l'organigramme.
- **`UniteNode.tsx`** : `aria-expanded`, `aria-haspopup="menu"` sur boutons menu et collapse. Dernières chaînes FR hardcodées → `t()`.

### Frontend — i18n et types (session 2026-07-24 suite)
- **`UniteNode.tsx`** : 5 chaînes FR hardcodées → `t()` (`autres`, `aucunPosteCourt`, `vacants_count`, `deplier`, `replier`).
- **Locales FR/EN** : 6 clés ajoutées à la racine (`ajouterEnfant`, `autres`, `aucunPosteCourt`, `vacants_count`, `deplier`, `replier`).
- **`generation-wizard.tsx`** : `as any` → `as 'ERROR' | 'SKIP' | 'OVERWRITE'` (type littéral).
- **`use-types-personnel.ts`** : 7 `any` → typage propre avec `TypePersonnel`, `ApiResponse<T>`, `Omit<>`, `Partial<>`.
- **Module organisation** : 0 `any` restants (vérifié par grep).

### Frontend — UX et qualité (session 2026-07-24 — suite 2)
- **`use-fonctions.ts`** : 10 `any` supprimés, typage propre avec `Fonction`, `PaginatedResult`, `ApiResponse<T>`. Toasts succès/erreur ajoutés via `useHandleError`.
- **`use-postes.ts`** : 8 `any` supprimés, typage propre avec `Poste`, `AffectationPoste`. Migration vers `useHandleError`. Invalidations organigramme ajoutées dans les mutations.
- **`fonctions-page.tsx`** : Skeleton loading (`PageSkeleton`), état erreur avec bouton Réessayer, 10 chaînes FR hardcodées → `t()`, type `handleSave` propre.
- **`unites-page.tsx`** : État erreur avec bouton Réessayer ajouté.
- **Locales FR/EN** : 5 clés ajoutées (`voirDetails`, `rechercherNomCode`, `aucuneFonctionTrouvee`, `supprimerFonction`, `confirmerSuppressionFonction`).

### Backend — Bugs organisation.service.ts (corrigés session 2026-07-24 tour 4)
- **`creerUniteAvecPostes`** : `estSuppleant` supprimé (champ inexistant sur `Poste`). `etablissementId` supprimé (inexistant sur `Poste`).
- **`getImpactUnite`** : `uniteOrganisationnelleId: In(familleIds)` → `posteId: In(postes.map(p => p.id))` (HierarchiePersonnel n'a plus de `uniteOrganisationnelleId`).
- **Migration 119** : commentaire en-tête corrigé (114 → 119).

### Frontend — Composants fonctions/postes (any résorbés)
- **`fonction-form-modal.tsx`** : `onSave: (data: any)` → `(data: CreerFonctionDto | ModifierFonctionDto)`.
- **`fonction-detail-page.tsx`** : `handleSave`, `membresList.map` typés.
- **`poste-form-modal.tsx`** : 10 `any` → types propres (`Fonction`, `UniteOrganisationnelle`, `NiveauResponsabilite`, `React.ChangeEvent`, etc.).
- **`poste-detail-page.tsx`** : `(a: any)` → `(a: AffectationPoste)`.
- **`postes-page.tsx`** : `filtres as any` → `filtres as PosteFiltres`.
- **Modules fonctions + postes** : 0 `any` restants.

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
- **Helper handleError** : `useHandleError()` dans `hooks/use-handle-error.ts` — pattern partagé dans tous les hooks du module (remplace duplication locale).
- **Anti-pattern hooks** : JAMAIS appeler un hook dans le JSX. Toujours extraire un composant dédié avec hooks au niveau supérieur (voir `FormWrapper` dans les pages nomenclatures).
- **Contraintes multi-tenant** : `unique: true` sur `@Column` interdit pour les nomenclatures multi-tenant. Utiliser `@Index(['code', 'etablissementId'], { unique: true, where: '"etablissementId" IS NOT NULL' })`.
- **10 échelons structurels système** : ETABLISSEMENT(0), DIRECTION(1), DEPARTEMENT_PEDA(2), SERVICE(2), COMMISSION(3), EQUIPE(3), BUREAU(3), ATELIER(3), LABORATOIRE(3), CDI(3).

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

## Refonte Emploi du Temps — Session 2026-07-24 (grill-me 10 décisions)
### Décisions validées (D1–D9)
| # | Décision | Impact |
|---|----------|--------|
| D1 | `MatiereNiveau.volumeHoraire` = source unique et absolue | Supprimé `volumeHoraire` de ProgrammeMatiere, ConfigurationMatiereClasse |
| D2 | Fusion `EmploiDuTemps` + `RepartitionHoraire` → `CreneauHoraire` | Nouvelle entité, référencée par `affectationMatiereId` |
| D3 | `HeureCours` ancré sur `classeAnneeId` (pas `classeId`) | Migration FK, remplacement classeId → classeAnneeId |
| D4 | `ProgrammePedagogique` = curriculum intemporel + historisation | Supprimé periodeId, dateDebut/Fin, anneeScolaireId, nbHeuresHebdo. Table `programmes_versions` |
| D5 | Supprimer `ConfigurationMatiereClasse` | `obligatoire` et `statutValidation` absorbés par AffectationMatiere |
| D6 | Édition manuelle complète : modal + drag & drop + resize | Nouveau frontend |
| D7 | `PreferenceEmploiDuTemps` enrichi : pauses + `creneauxImposables` JSONB | Migration + nouveaux champs |
| D8 | Frontend 5 onglets : Calendrier, Liste, Synthèse, Préférences, Templates | Refonte page |
| D9 | `ConflitDetectionService` : 5 types (3 bloquants, 2 avertissements) | Nouveau service backend |

### Entités supprimées (3)
- `ConfigurationMatiereClasse` → champs absorbés par AffectationMatiere
- `RepartitionHoraire` → fusionnée dans CreneauHoraire
- `EmploiDuTemps` → fusionnée dans CreneauHoraire

### Entités créées (2)
- `CreneauHoraire` (table `creneaux_horaires`)
- `ProgrammeVersion` (table `programmes_versions` — historisation)

### Modèle cible
```
MatiereNiveau (source vérité volume horaire)
    ├── ProgrammePedagogique (curriculum intemporel)
    │       └── ProgrammeMatiere (bridge, SANS volumeHoraire)
    ├── ClasseAnnee.programmeId → ProgrammePedagogique
    └── AffectationMatiere (pivot contextuel: +obligatoire, +statutValidation, -configurationId)
            └── CreneauHoraire (fusion EDT+Repartition)
                    └── HeureCours (matérialisation datée: +classeAnneeId, +creneauId)
```

### Permissions RBAC ajoutées
- `emploi-du-temps:verifier-conflits` (lecture)
- `programmes:historiser` (écriture)

### Fichiers backend modifiés
- Entités : creneau-horaire.entity.ts, programme-version.entity.ts, affectation-matiere.entity.ts, heure-cours.entity.ts, programme-pedagogique.entity.ts, programme-matiere.entity.ts, preference-emploi-du-temps.entity.ts
- Services : emploi-du-temps.service.ts (réécrit), conflit-detection.service.ts (nouveau), programme-pedagogique.service.ts (historisation), matieres.service.ts (nettoyé), notes.service.ts, programme-matiere.service.ts
- Controllers : emploi-du-temps.controller.ts, matieres.controller.ts
- DTOs : emploi-du-temps.dto.ts, matieres.dto.ts, programme-pedagogique.dto.ts, programme-matiere.dto.ts

### Fichiers frontend modifiés
- Types : use-emploi-du-temps.ts (CreneauHoraire, Conflit, types), matiere.types.ts, programme.types.ts
- Hooks : use-emploi-du-temps.ts (useVerifierConflits), use-matieres.ts (nettoyé)
- Composants : edt-calendar.tsx, matiere-detail-page.tsx
- i18n : emplois.json (FR+EN: conflitDetection, synthese)

## Travail effectué — Session 2026-07-24 (grill-me suite)
### Frontend — Couleurs hardcodées → CSS vars (5 fichiers)
- **`PosteCapaciteIndicator.tsx`** : `bg-red-500/amber-500/green-500` → `bg-destructive/warning/success`, `bg-gray-200 dark:bg-gray-700` → `bg-muted`
- **`fonction-form-modal.tsx`** : `text-red-500` (required markers) → `text-destructive`
- **`fonction-arbre.tsx`** : `bg-blue-100` → `bg-primary/10`, `bg-green/red` → `bg-success/destructive`, `hover:bg-red` → `hover:bg-destructive/10`
- **`fonctions-page.tsx`** : status badges `bg-green/red` → `bg-success/destructive`
- **`postes-page.tsx`** : `text-gray-*` → `text-foreground/secondary/muted-foreground`
- **`poste-form-modal.tsx`** : `text-gray-700` → `text-foreground`, `bg-gray-100` → `bg-muted`, `hover:bg-red` → `hover:bg-destructive/10`

### Frontend — i18n : 22 chaînes FR hardcodées → t()
- **`fonction-arbre.tsx`** : `useTranslation` ajouté, 5 chaînes traduites (Actif/Inactif, Modifier, Supprimer, aucuneFonctionIndication)
- **`hierarchie-form-modal.tsx`** : `TYPES_RELATION_OPTIONS` déplacé dans le composant, labels → `t('typeRelation_DIRECT/FONCTIONNEL')`
- **`nomenclature-form-modal.tsx`** : fallback `'Erreur'` → `t('erreurGenerique')`
- **`generation-wizard.tsx`** : `StructureApercu` avec `useTranslation`, `'poste(s)'` → `t('postes')`
- **`modeles-page.tsx`** : `StructurePreview` avec `useTranslation`, `'poste(s)'` → `t('postes')`
- **`unites-page.tsx`** : `header: 'Actions'` → `t('colActions')`
- **`postes-page.tsx`** : `header: 'Actions'` → `t('colActions')`
- **`fonctions-page.tsx`** : `'— Racine —'` → `t('racine')`
- **`poste-form-modal.tsx`** : `'Une erreur est survenue'` → `t('erreurGenerique')`, placeholders missions/compétences → `t()`
- **`poste.zod.ts`** : `STATUT_POSTE_OPTIONS` converti `label` → `labelKey` (i18n keys), consommateurs mis à jour
- **3 clés i18n ajoutées** FR+EN : `ajouterMission`, `ajouterCompetence`, `aucuneFonctionIndication`

### Backend — 21 types `any` éliminés dans `organisation.service.ts`
- **Interfaces ajoutées** : `ArborescenceNode` (extends `Partial<UniteOrganisationnelle>` avec enfants récursif) + `PosteOrganigramme` (extends `Partial<Poste>` avec labels enrichis)
- **`FindOptionsWhere<T>`** : 7 `const where: any` → `FindOptionsWhere<UniteOrganisationnelle>` ou `FindOptionsWhere<HierarchiePersonnel>`
- **Résultats SQL bruts** : `(r: any) => r.id` → `(r: { id: string }) => r.id`
- **Arborescence/Organigramme** : `Promise<any[]>` → `Promise<ArborescenceNode[]>`, `Map<string, any>` → `Map<string, ArborescenceNode>`, callbacks reduce/filtre typés
- **Statistiques** : `statistiques: any` → `Record<string, unknown>`

### Bilan qualité — Module Organisation
- **`any` frontend** : 0 dans organisation/, fonctions/, postes/
- **`any` backend** : 0 dans TOUT le module organisation (services + entities)
- **Couleurs hardcodées** : 0 dans les 3 modules
- **Chaînes FR hardcodées** : 0 dans les 3 modules
- **Cohérence backend** : aucune référence aux entités supprimées (UsageUnite, CategoriePoste, NiveauOrganisation, TypeRelationHierarchique)

## Travail effectué — Session 2026-07-24 (grill-me tour final)
### Backend — Élimination `any` dans 4 services secondaires
- **`postes-vacants.service.ts`** : Interfaces `PosteVacantInfo` et `StatistiquesVacance` ajoutées. 4 `any` → 0 (`critiques: any[]`, `avertissements: any[]`, `Promise<any>`)
- **`statistiques-optimisees.service.ts`** : `params: any[]` → `(string | number)[]`, `(row: any)` → `Record<string, string | number | null>`, `(u: any)` → `{ id: string }`
- **`organigramme.pdf.service.ts`** : Interfaces `NoeudOrganigramme` et `PosteOrganigrammePDF` ajoutées. 13 `any` → 0 (paramètres méthodes + callbacks)
- **`generation.service.ts`** : `templatePoste as any` supprimé. Interface `TemplatePoste` étendue avec `intitulé?` et `niveauResponsabilite?` (champs optionnels utilisés par les templates JSON)
- **4 services nomenclature** (déjà fait tour précédent) : `FindOptionsWhere<T>` dans mode-remuneration, niveau-responsabilite, echelon-structurel, template-organisation

### Bilan final — Zéro `any` module Organisation
- **Backend services** : 0 `any` dans les 8 fichiers de service
- **Backend entities** : 0 `any` dans les interfaces template
- **Frontend** : 0 `any` dans les hooks, composants, types, pages
- **Routes** : 60/60 protégées par `authMiddleware` + `requirePermission`
- **UX** : Toutes les pages ont des états loading/error avec retry
