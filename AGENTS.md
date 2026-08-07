# eLISAschool — Session Context

## Objective
Refactorer le module organisation et ses nomenclatures en une source de vérité unique, avec routes dédiées, composants génériques, i18n 100% flat, et permissions granulaires.

## Décisions Architecturales (consolidé v5.0 — TypePersonnel supprimé)
### Modèle de données — 7 entités + 1 template
- **Poste** : pivot central unifiant les 3 axes (où=unite, quoi=fonction, qui=occupant). Catégorie dérivée via `poste.fonction.categorie`.
- **EchelonStructurel** (ex-NiveauOrganisation + UsageUnite) : fusion des deux concepts. Champs : `niveau` (int), `code` (string, ex: 'DIRECTION'), `label`, `description`, `couleur`, `estSysteme`, `etablissementId`. `UniteOrganisationnelle` référence uniquement `echelonStructurelId`.
- **NiveauResponsabilite** : table `niveaux_responsabilite`. Axe orthogonal à EchelonStructurel (poids hiérarchique vs profondeur structurelle).
- **ModeRemunerationEntity** : source unique de vérité pour les modes de rémunération. L'enum `ModeRemuneration` du module paie est **supprimée**. FK uuid dans ContratPersonnel et TypeContratPersonnalise.
- **HierarchiePersonnel** : `typeRelationId` (FK) remplacé par `typeRelation` (varchar enum : DIRECT, FONCTIONNEL). `uniteOrganisationnelleId` supprimé (redondant avec Poste). **v4.1** : sémantique duale explicite — personne→personne (`personnelId`+`superieurId`) OU poste→poste (`posteId`+`superieurPosteId`, colonne ajoutée migration 122).
- **Fonction** : nomenclature multi-tenant hiérarchique. Porte `categorie` varchar(20) NOT NULL DEFAULT 'AUTRE' (enum `CategorieFonction` : ENSEIGNANT, DIRECTION, ADMINISTRATIF, TECHNIQUE, SERVICE, SANTE, SOCIAL, AUTRE). Remplace l'ancienne FK `typePersonnelId`.
- **Catégorie membre** : TOUJOURS dérivée (jamais stockée) via fonctions des postes occupés. API retourne `categorie`, `estEnseignant`, `categorieSource`.
- **JSONB** : `missions`, `competencesRequises` conservés sur Poste.
- **TemplateOrganisation** : JSONB (lecture seule, 22 templates). Interfaces adaptées : `TemplatePoste.categoriePosteId` supprimé, `NoeudTemplateOrganisation.usageUnite` → `echelonCode`, `niveau` supprimé.
- **Validation** : anti-cycle arborescence via CTE récursif PostgreSQL.
- **Protection seeds** : `assertNotSystem()` guard backend, UI bouton Supprimer caché + Dupliquer.

### Entités supprimées (5)
- ❌ `UsageUnite` → fusionné dans EchelonStructurel
- ❌ `CategoriePoste` → dérivé via Fonction.categorie
- ❌ `TypeRelationHierarchique` → enum varchar sur HierarchiePersonnel
- ❌ `NiveauOrganisation` → renommé EchelonStructurel
- ❌ `TypePersonnel` (v5.0) → remplacé par `Fonction.categorie` (migration 121 : drop `types_personnel` CASCADE + drop `fonctions.typePersonnelId`)

### Modules backend
- **Postes** : dans `organisation/`. Route `/api/organisation/postes`.
- **Fonctions** : entité dans `organisation/entities/`, service/contrôleur propres. Filtre `?categorie=` disponible.
- **Nomenclatures** : 3 CRUD dans `nomenclature.controller.ts` : echelons-structurels, niveaux-responsabilite, modes-remuneration. (Types-personnel supprimé v5.0.)
- **Seeds** : `seed-nomenclatures.ts` (global : echelons_structurels, niveaux_responsabilite, modes_remuneration), `seed-organisation.ts` (par établissement : fonctions avec `categorie` + unités + postes + hiérarchies).
- **Routes API REST** : pur pluriel. Actions via query params ou sous-ressources.

### Frontend
- **Navigation** : Sidebar « Organisation » : Vue d'ensemble, Unités, Postes, Fonctions, Organigramme (vue unifiée), Nomenclatures (3 onglets : Échelons, Responsabilités, Modes rémun.), Modèles.
- **Layout** : `_auth.organisation.tsx` → Breadcrumbs + motion + ErrorBoundary + `<Outlet/>`.
- **Composants** : `NomenclatureCrudPage<T>` générique (3 nomenclatures). Pages supprimées : `categories-poste-page`, `usages-unite-page`, `niveaux-organisation-page`, `types-relation-page`, `types-personnel-page` (v5.0).
- **Hooks** : unitaires, barrel `features/organisation/index.ts`. `use-types-personnel.ts` supprimé (v5.0).
- **i18n** : 100% flat. Clés obsolètes nettoyées (categoriePoste, usageUnite, niveauOrganisation, typeRelation, typePersonnel). Nouvelles clés `personnel.categorie_*` (common.json) + `categorie_*` (organisation.json).
- **Permissions** : sous-permissions CRUD + section. `organisation:unites:read`, `organisation:postes:write`, etc.
- **Icônes** : Building2(module), GitBranch(unités/arbre structurel), Briefcase(postes), Workflow(fonctions — partout, y compris arbre/modal/détail), Network(organigramme), Layers(échelons), ArrowUpDown(responsabilités), Wallet(modes-rémun. — DollarSign banni), FileText(modèles), Sparkles(génération), GraduationCap(catégorie ENSEIGNANT), ListTree(hiérarchie), Link2(relations hiérarchiques — toggle toolbar, drawer relation, badge FONCTIONNEL, modal hiérarchie, stat hiérarchies), Maximize(fit-view — Maximize2/Minimize2 réservés au plein écran), Route(spécialités — dédup vs GitBranch unités).

### Sidebar
- "Organisation" expandable : Vue d'ensemble, Unités, Postes, Fonctions, Organigramme, Nomenclatures, Modèles.
- Icône mère : Building2.

### Seeds ordre (initial.seed.ts)
10b. seedTypesContrat() — global
10c. seedNomenclatures() — global : echelons_structurels (fusion niveaux_organisation + usages_unite), niveaux_responsabilite, modes_remuneration
11. seedOrganisation(etablissementId) — par établissement : fonctions (avec `categorie`, seed système ENSEIGNANT protégé) + unités + postes + hiérarchies (FK résolues)
12. seedTemplatesOrganisation() — global, 22 templates (interfaces adaptées : echelonCode, sans categoriePosteId)

### Seeds demo ordre (run-demo-seeds.ts)
4. seedPersonnelDemo() — 10 membres + contrats
7. seedOrganisationDemo() — affectations postes + MembreFonction pour les 10 membres
8. seedBulletinsPaieDemo()

### Tests
- Phase dédiée après stabilisation du refactoring.

## Fond principal unique
- **Modèle** : UN SEUL fond d'écran pour le layout authentifié (plus de rotator, plus de catalogue, plus de personnalisation par établissement).
- **Fond animé actif (grill-me 2026-07-31)** : composant Originkit **Text Wave** (`frontend/src/components/originkit/ui/text-wave.tsx`, vendored, 1 seul fix TS ligne 78 : `RefObject<HTMLElement | null>` pour React 19). Grille de caractères à ripple CSS trig (pas de WebGL), rAF 30fps, auto-pause hors écran (IntersectionObserver) et onglet caché (navigateur). `@property --t` + `sin()` CSS → navigateurs modernes uniquement ; dégradation = grille statique.
- **Couche d'intégration** `frontend/src/components/layout/fond-anime.tsx` : 3 couches — (1) dégradé général OPAQUE (`FOND_DEGRADE_LIGHT` : surface→var(--color-accent-100)→var(--color-dominant-100)→surface 135° — BLEU eLISAschool principal + blanc + vert / `FOND_DEGRADE_DARK` : lueur blanche 8%→var(--color-background) (gris principal)→var(--color-accent-900)→var(--color-dominant-900) 135° — gris + bleu + blanc + vert), (2) quadrillage « cahier » statique 100% CSS (cellule 23px, lignes gris clair thème `--color-bordure` (#e5e7eb) en light / BLEU eLISAschool `--color-accent-500` (#3b82f6) en dark, opacité FORTE 75-100%, bords progressifs 0.4px — « léger effet flouté » SANS `filter: blur()` (filtre GPU plein écran coûteux, source d'instabilité de compositing en rendu logiciel — ligne douce = rampe dans les stops des repeating-gradients) + points embossés + teinte verticale `FOND_GRILLE_TINTE` (blanc 38% → accent-500 20% → noir 30%, en DERNIÈRE couche au-dessus des lignes), (3) lettres Text Wave (opacité 0.4 via `FOND_ANIME_*`, `backgroundColor="transparent"`). Résolution thème au runtime (`getComputedStyle` + MutationObserver `data-theme` + `normaliserCouleurHex` depuis `@/lib/export`). `prefers-reduced-motion` → `speed={0}` (grille figée, rAF réduit à du recalc sans changement visuel). Wrapper `fixed inset-0 -z-20`, `aria-hidden`, `pointer-events: none`. Vérif CDP 2026-07-31 : 17 couches background-image (16 + teinte), rampes 0.4px résolues (light : gris #e5e7eb 85% ; dark : accent-500 75% — suit le thème de marque), teinte blanc→bleu→noir au-dessus des lignes, `--t` animé (rAF), bascule light/dark instantanée via MutationObserver, propagation thème de marque confirmée (var custom → quadrillage+dégradé suivent à la peinture).
- **Source de vérité unique des couleurs (grill-me 2026-07-31)** : `frontend/src/components/layout/fond-palette.ts` — SEUL fichier définissant des couleurs pour le fond. Règles : couleurs existant dans l'échelle thème (globals.css @theme, réécrite au runtime par `theme-utils.appliquerThemeCSS`) → référencées par `var(--color-…)` (le thème d'un établissement se propage au fond) ; alphas via `color-mix(in srgb, var(--color-…) N%, transparent)` (chaînes statiques, socle navigateur = Text Wave) ; seules les couleurs propres au fond (stops custom, ombres relief) y sont définies en hex. Hybride assumé : quadrillage statique (color-mix) vs lettres résolues au runtime (le vendored `paletteAt()` interpole en rgb, ne peut pas consommer de var). Mapping lettres = ordre canon 60-30-10 (vert→bleu→ambre). Garde anti-drift : `scripts/check-fond-colors.sh` (hex/rgba hors fond-palette.ts dans les fichiers `fond-*` de components/layout/ → exit 1 ; originkit vendored et PageHeader exclus). Directives visuelles (grill-me 2026-07-31, version « bleu eLISAschool ») : fond light = BLEU eLISAschool principal (accent-100) + dégradé blanc et vert (dominant-100) ; fond dark = GRIS principal (--color-background) + dégradé bleu eLISAschool (accent-900), blanc (lueur) et vert (dominant-900) ; lignes = gris clair (light) / bleu eLISAschool (dark), dégradé vertical blanc→bleu→noir (blanc en haut), opacité forte, léger flou = bords progressifs.
- **`FondPrincipalBackground.tsx`** = wrapper mince → `<FondAnime />` (contract inchangé, `PageLayout.tsx` intact).
- **SVG statique conservé mais DÉSACTIVÉ (décision grill-me)** : `public/fonds-principal/fond-principal-{dark,light}.svg`, bloc statique `/fonds-principal` dans `app.ts`, nginx `^~ /fonds-principal` → backend, symlink `scripts/setup-symlinks.sh`. Inertes au runtime (rien ne les sollicite), conservés pour réactivation future. `^~` OBLIGATOIRE : la regex `~* \.(...svg...)$` (assets statiques) primerait sur un simple `location /fonds-principal` → fallback SPA (index.html). Le symlink ne se résout PAS dans le conteneur frontend (mount `../frontend:/app`, cible `../../public` hors conteneur) — c'est le backend qui sert les SVG, pas Vite.
- **Système supprimé** : module backend `apparence/` (fonds, fonds_etablissement, rotation, upload), page `/apparence`, `FondRotator`, `NidAlveoleBackground`, `FondImage`, `use-rotation-controle`, catalogue 36 SVG, permissions `apparence:fonds:*`/`audit:apparence:view`, actions audit `FOND_*`. Login et page d'accueil intouchés.
- **Nettoyage staging/prod** : `scripts/deploy-fonds-principal.sh` (idempotent — DROP tables fonds + DELETE params + permissions).
- **Clé Originkit** : `ORIGINKIT_API_KEY` (shell uniquement, jamais committer). `.originkit/` gitignoré (brief agent). Quota 10 fetches/jour. Réinstall : `npx originkit@latest add text-wave --custom-style`.

## Système d'animations et loading
- **SplashScreen v2** (`frontend/src/components/feedback/SplashScreen.tsx`) : écran de démarrage avec logo SVG qui se dessine trait par trait (pathLength Framer Motion), texte « elisaschool° » en reveal lettre par lettre, barre de progression style règle/graduation, version affichée, thème auto (light/dark via MutationObserver). Durée minimum 5s (gérée par `App.tsx`). Ultra-responsive (clamp()).
- **Intégration bootstrap** (`frontend/src/app/App.tsx`) : hook `useSplashScreen()` — affiche le splash jusqu'à `min(5s, auth._initialized)` + transition de sortie AnimatePresence (opacity 0.4s).
- **Animations CSS** (`frontend/src/styles/animations.css`) : keyframes globaux (shimmer, progress-indeterminate, fade-in-up, pulse-soft, pulse-ring, draw-stroke, bounce-soft, gradient-shift) + classes utilitaires (.animate-shimmer, .skeleton-wave, .progress-indeterminate, .progress-shimmer) + `prefers-reduced-motion` respecté. Importé dans `main.tsx` après `globals.css`.
- **Skeleton theme-aware** (`frontend/src/components/ui/Skeleton.tsx` v2.0) : `bg-gray-200` hardcodé → `bg-[var(--color-surface-hover)]`. Variants : text, circular, rectangular, card. Animations : pulse (Framer Motion), wave (CSS shimmer overlay), none. Tous les dimensions en `clamp()`. Composants : `Skeleton`, `TableSkeleton` (avec showCheckbox), `StatsCardSkeleton`, `PageSkeleton`, `FormSkeleton`.
- **ProgressBar** (`frontend/src/components/feedback/ProgressBar.tsx`) : modes `determinate` (valeur 0-100 animée) et `indeterminate` (barre glissante). Variantes : default, success, danger, accent. Tailles : sm/md/lg (clamp()). Shimmer overlay. Accessible (role=progressbar, aria-value*).
- **InlineSpinner** (`frontend/src/components/feedback/InlineSpinner.tsx`) : spinner SVG thématique (couleur dominante), tailles sm/md/lg, label optionnel. Remplace `LoadingState` pour les chargements inline/onglets.
- **SchoolLoading v2** (`frontend/src/components/feedback/SchoolLoading.tsx`) : composant thématique scolaire avec **4 thèmes animés** : `book` (livre ouvert + crayon), `pencil` (crayon écrivant sur papier), `notebook` (cahier à spirale + page qui tourne), `globe` (globe terrestre + méridiens en rotation). Props : `theme`, `variant` (full/compact), `message`. Thème auto (light/dark). Ultra-responsive (clamp). Intégré dans 18 fichiers (pages, onglets, modals, détails).
- **Composants supprimés** : `LoadingState` (feedback + ErrorMessage), `ListLoading` — remplacés par `InlineSpinner` (17 fichiers migrés) et `Skeleton` (PageSkeleton/TableSkeleton).
- **Hiérarchie loading** : SplashScreen (app startup) → SchoolLoading (page loading thématique) → PageSkeleton (page loading structure) → TableSkeleton (DataTable) → StatsCardSkeleton (cards) → InlineSpinner (inline/tabs) → ProgressBar (opérations longues).

### Blocked
— (none)

## Travail effectué — Session 2026-08-07 (modal génération HeuresCours — 4 étapes + preview)

### Backend — preview HeuresCours
- **`heure-cours.service.ts`** : nouvelle méthode `previsualiserHeuresCoursFromEdt()` — même logique d'expansion que `materialiserInstances()` mais en lecture seule (query créneaux EDT validés + expansion dates + exclusion JF). Retourne `{ creneaux[], stats: { totalCreneaux, totalHeures, joursCouverts, matieresCouvertes, detailParMatiere[], detailParJour[] } }`.
- **`materialiserInstances()`** : return type enrichi avec `detailParMatiere` (tracking `creees`/`ignorees` par `matiereId` via helpers `trackSkip`/`trackCreate`).
- **`heure-cours.controller.ts`** : nouvel endpoint `POST /previsualiser` (permission `heures-cours:view`).
- **`genererHeuresCoursFromEdt()`** : retour enrichi `{ created, skipped, errors, total, detailParMatiere }`.

### Frontend — types + hooks
- **`use-heure-cours.ts`** : nouveaux types `CreneauPreviewHC`, `DetailMatierePreview`, `DetailJourPreview`, `PreviewHeuresCoursResult`. Hook `usePrevisualiserHeuresCours()` (mutation POST). `GenererHeuresCoursResult` enrichi avec `detailParMatiere`.

### Frontend — composants partagés (`generation-ui.tsx`)
- **`GenerationStatsCard`** : carte stat compacte avec 6 couleurs (dominant, accent, success, warning, danger, info), dark mode, clamp() responsive.
- **`StatsIcons`** : preset d'icônes lucide (creneaux, heures, matieres, conflits, creees, ignorees, erreurs, total).
- **`GenerationResultBreakdown`** : breakdown par matière avec barres de progression inline, supporte mode 'resultat' (creees/ignorees) et 'preview' (creneaux/heures).
- **`MiniBarChart`** : mini graphique barres pour distribution par jour.

### Frontend — refactor modal HeuresCours (4 étapes)
- **`edt-heures-cours-modal.tsx` v4.0** : passage de 3 à 4 étapes — Sélection → Aperçu (preview API) → Résumé+Confirmation → Résultats.
- **Étape Aperçu** : `GenerationStatsCard` (4 stats) + `MiniBarChart` (distribution par jour) + `GenerationResultBreakdown` (détail par matière).
- **Étape Résultats** : `GenerationStatsCard` (créées/ignorées/erreurs/total) + `GenerationResultBreakdown` (breakdown par matière). Remplace l'ancien `ResultatCard` supprimé.

### Frontend — refactor modal génération EDT
- **`edt-generation-modal.tsx`** : `ResumeCard` local supprimé → remplacé par `GenerationStatsCard` + `StatsIcons` (composants partagés). Import `BookOpen` retiré (inutilisé).

### i18n — 14 clés ajoutées FR+EN
- `generationHeuresCours.etapeApercu`, `creneauxIdentifies`, `heuresPlanifiees`, `joursCouverts`, `matieresCouvertes`, `detailParMatiere`, `detailParJour`, `aucunCreneauPreview`, `modifierSelection`, `detailParMatiereResultat`, `creeesLabel`, `ignoreesLabel`, `generationComplete`, `aucunDetail`.

### Qualité
- `tsc --noEmit` : 0 erreur frontend + backend.
- Parité i18n FR/EN complète sur le module.
- Composants réutilisables (generation-ui.tsx) partagés entre les 2 modals de génération.

## Travail effectué — Session 2026-08-06 (palette créneaux EDT — contraste WCAG)

### Utilitaire palette (`frontend/src/lib/palette-creneau.ts`)
- **Nouveau fichier** : `paletteCreneau(couleur, surface?)` → `PaletteCreneau` complet (fondTeinte, fondAssombri, texteSurFond, texteSurTeinte, bordure, fondBadge)
- **Fonctions exportées** : `hexToRgb`, `luminanceRelative`, `ratioContraste` (WCAG 2.1), `melangeCouleur`, `estCouleurClaire`
- **Contraste garanti** : `couleurTexteAuto()` choisit blanc (#ffffff) ou sombre (#1f2937) selon ratio ≥ 3:1 ; fond assombri (60% couleur + 40% noir) garantit ≥ 4.5:1 avec blanc
- **Surface adaptative** : paramètre `surface` (défaut `#ffffff`) pour le mélange en mode clair ; en dark, la surface sombre (`#111827`) est utilisée pour le fond assombri

### Composants migrés (4 vues + 1 légende + 1 synthèse)
- **`edt-month-view.tsx`** : créneaux avec `fondAssombri` + `texteSurFond` (contraste max en vue condensée)
- **`edt-calendar.tsx`** : week view avec `fondTeinte` + `texteSurTeinte` + bordure gauche `pal.bordure`
- **`edt-day-view.tsx`** : day view avec `fondTeinte` + `texteSurTeinte` + bordure gauche `pal.bordure`
- **`edt-legend.tsx`** : surface pleine (`fondAssombri`) + `texteSurFond` pour contraste amélioré
- **`edt-synthese.tsx`** : barres matières avec `fondTeinte` + bordure `pal.bordure`

### Règle frontend ajoutée (règle 34 — section EDT)
- **TOUJOURS** utiliser `paletteCreneau()` (`@/lib/palette-creneau`) pour colorer les créneaux — jamais de `backgroundColor: couleur` brut
- **NE JAMAIS** afficher une couleur matière sans contraste vérifié

### Fichiers modifiés (6)
- `frontend/src/lib/palette-creneau.ts` (nouveau, 134 lignes)
- `frontend/src/features/emploi-du-temps/components/edt-month-view.tsx`
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx`
- `frontend/src/features/emploi-du-temps/components/edt-day-view.tsx`
- `frontend/src/features/emploi-du-temps/components/edt-legend.tsx`
- `frontend/src/features/emploi-du-temps/components/edt-synthese.tsx`
- `.qoder/rules/elisaschool-frontend.md` (+2 règles palette dans section 34)

## Travail effectué — Session 2026-08-06 (cascading selects + scrollbars EDT)

### Cascading selects affectation (`edt-creneau-modal.tsx`)
- **Ancien pattern** : select unique avec recherche + `optgroup` par matière (doublons visuels)
- **Nouveau pattern** : 3 selects en cascade **Matière → Enseignant → Classe**
  - Select 1 : Matière (toutes les matières disponibles)
  - Select 2 : Enseignant (filtré par matière sélectionnée)
  - Select 3 : Classe (filtrée par matière + enseignant)
  - Résolution automatique : si 1 seule combinaison → auto-sélectionnée
  - Reset en cascade : changer matière → reset enseignant + classe
  - `disabled` progressif : enseignant désactivé tant que matière non sélectionnée, etc.
- **Interface `AffectationOption.matiere`** : ajout `id: string` (nécessaire pour cascade)
- **Hook `useAffectationsOptions`** : interface alignée (`matiere.id` + `couleur`)
- **Initialisation édition** : cascade pré-remplie depuis l'affectation existante du créneau
- **Bloc « Classe associée »** supprimé (redondant — maintenant intégré dans le cascade)

### Scrollbars calendrier (3 vues)
- **Vue jour** (`edt-day-view.tsx`) : `overflow-hidden` → `overflow-y-auto` + `maxHeight: clamp(400px, 70vh, 800px)` + hauteur calculée (`~50px/heure`)
- **Vue semaine** (`edt-calendar.tsx`) : `overflow-x-auto` → `overflow-auto` + `maxHeight: clamp(400px, 75vh, 850px)` (scroll vertical + horizontal, sticky header préservé)
- **Vue mois** (`edt-month-view.tsx`) : wrapper `overflow-x-auto` + `minWidth: min(100%, 420px)` (scroll horizontal sur petits écrans)

### i18n
- Clé `selectionnerMatiere` ajoutée FR+EN (top-level)
- Clés obsolètes supprimées : `creneau.modal.selectionnerAffectation`, `creneau.modal.rechercherAffectation`, `creneau.modal.aucunResultat`

### Fichiers modifiés (6)
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` (cascading selects, +52 lignes net)
- `frontend/src/features/emploi-du-temps/components/edt-day-view.tsx` (scroll vertical + hauteur calculée)
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx` (overflow-auto + max-height)
- `frontend/src/features/emploi-du-temps/components/edt-month-view.tsx` (wrapper scroll horizontal)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (interface `matiere.id`)
- `frontend/src/locales/fr/emplois.json` (+1 clé, -3 obsolètes)
- `frontend/src/locales/en/emplois.json` (+1 clé, -1 obsolète)

## Travail effectué — Session 2026-08-06 (grill-me : fix i18n + cohérence contexte + auto-résolution cascade)

### Audit /grill-me — 3 bugs identifiés et corrigés
1. **Bug i18n (CRITIQUE)** : Clés `selectionnerMatiere/Enseignant/Classe` appelées à la racine du namespace `emplois` mais inexistantes → affichées en texte brut
   - **Fix** : Ajout des 3 clés à la racine des fichiers FR+EN (`emplois.json`)
   
2. **Bug contexte (CRITIQUE)** : `classeAnneeIdForModal = undefined` quand `contexteType !== 'classe'` → selects cascade vides hors contexte classe
   - **Fix** : Refactoré `useAffectationsOptions` pour accepter `AffectationsContexteFilter` (type+value) au lieu de `classeAnneeId?: string`
   - **Nouvelle interface** : `{ type: 'classe' | 'enseignant' | 'salle'; value: string }`
   - **Filtrage serveur** : `type=classe` → `classeAnneeId` query param
   - **Filtrage client** : `type=enseignant/salle` → limit:100 + filtrage JS côté frontend (convention backend max 100)
   
3. **Bug UX (MODÉRÉ)** : Placeholders des selects non-désactivés → sélectionnables
   - **Fix** : Ajout `disabled` sur les `<option value="">` des 3 selects cascade

### Améliorations ajoutées
- **Auto-résolution cascade 1-unique** :
  - Si Matière → 1 seul Enseignant possible → auto-sélection + résolution continue vers Classe
  - Si Enseignant → 1 seule Classe possible → auto-sélection
  - Pattern `isInitializingRef` pour distinguer initialisation vs interaction utilisateur
  - 2 `useEffect` dédiés (déclenchés sur `matiereSelectId` et `enseignantSelectId`)

- **Cohérence toolbar↔modal** :
  - `edt-page.tsx` : passage du contexte complet (`contexteType` + `contexteFilter`) au hook
  - Modal reçoit les affectations filtrées selon le contexte actif (classe/enseignant/salle)

### Fichiers modifiés (4)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` : refactoré `useAffectationsOptions` + export `AffectationsContexteFilter`
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` : passage contexte complet au hook + import type
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` : auto-résolution + `isInitializingRef` + placeholders disabled
- `frontend/src/locales/fr/emplois.json` : +3 clés racine (`selectionnerMatiere/Enseignant/Classe`)
- `frontend/src/locales/en/emplois.json` : +3 clés racine (parité EN)

## Travail effectué — Session 2026-08-06 (fix validation limit backend)

### Bug identifié via logs backend
**Erreur 400 répétée** : `[VALIDATION_ERROR] Erreur de validation: limit: Number must be less than or equal to 100`

**Cause** : Hook `useAffectationsOptions` utilisait `limit: 200` (introduit dans la session précédente), mais le backend valide avec max 100 (convention eLISAschool).

**Impact** : Cascading selects du modal créneau échouaient à charger les affectations hors contexte classe.

**Fix** : `limit: 200` → `limit: 100` dans `useAffectationsOptions` (conforme convention backend).

**Fichier modifié** :
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (ligne 528)

## Travail effectué — Session 2026-08-06 (refactor modal créneau : indépendance toolbar + ordre cascade)

### Problème identifié
Le modal de création de créneaux dépendait du filtre toolbar (Classe/Enseignant/Salle) pour charger les affectations. Les selects cascade étaient limités par le contexte toolbar, ce qui empêchait de créer des créneaux pour d'autres classes/matières/enseignants.

### Corrections apportées
1. **Indépendance modal↔toolbar** :
   - Le modal charge maintenant SES PROPRES affectations via `useAffectationsOptions()` sans filtre contexte
   - Le modal charge SES PROPRES salles via `useSallesFromCreneaux()`
   - Le filtre toolbar ne sert QU'À filtrer l'affichage des créneaux dans la vue principale
   - Props `affectations` et `salles` marquées `@deprecated` (rétrocompatibilité)

2. **Pré-sélection classe** :
   - Si contexte toolbar = classe avec valeur → `contexteClasseId` passé au modal
   - Le select classe du modal est pré-sélectionné (l'utilisateur peut la changer)

3. **Réorganisation cascade** :
   - **Nouvel ordre** : Type créneau → Classe → Matière → Enseignant
   - **Logique** : On choisit d'abord le type, puis le contexte (classe), puis le contenu (matière), puis le responsable (enseignant)
   - Plus logique pédagogiquement et fonctionnellement

4. **Auto-résolution cascade adaptée** :
   - Si Classe → 1 seule Matière possible → auto-sélection
   - Si Classe + Matière → 1 seul Enseignant possible → auto-sélection
   - Pattern `isInitializingRef` conservé pour distinguer init vs interaction

5. **Améliorations UI/UX** :
   - Selects avec hover/focus states harmonisés (`hover:border-[var(--color-dominant-400)]`)
   - Focus ring visible (`focus:ring-2 focus:ring-[var(--color-dominant-300)]`)
   - `disabled:opacity-50 disabled:cursor-not-allowed` pour les selects dépendants
   - Placeholders `disabled` (non-sélectionnables)

### Fichiers modifiés (2)
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` :
  - Import `useAffectationsOptions` + `useSallesFromCreneaux`
  - Props `affectations`/`salles` dépréciées + nouvelle prop `contexteClasseId`
  - Hooks internes pour charger affectations/salles
  - Cascade réorganisée : `classesDisponibles` → `matieresDisponibles` → `enseignantsDisponibles`
  - Auto-résolution adaptée au nouvel ordre
  - Pré-sélection classe si `contexteClasseId` fourni
  - Selects UI améliorés (hover, focus, disabled states)

- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` :
  - Retrait `useAffectationsOptions` + `useSallesFromCreneaux` (plus utilisés ici)
  - Retrait import `AffectationsContexteFilter`
  - Ajout `contexteClasseIdForModal` (pré-sélection classe si contexte toolbar)
  - Modal appelé avec `contexteClasseId` au lieu de `affectations`/`salles`

## Travail effectué — Session 2026-08-06 (fix redondances + dark mode + select affectation)

### Corrections apportées
1. **Redondance jour vue quotidienne** (`edt-day-view.tsx`) :
   - `formatDate(date, 'EEEE d MMMM')` → `formatDate(date, 'd MMMM')` : suppression du jour de la date car déjà affiché en titre ("Samedi" + "samedi 15 août" → "Samedi" + "15 août")
   - `{creneauxJour.length} {t('jour.creneaux', { count })}` → `{t('jour.creneaux', { count })}` : suppression du compteur dupliqué (la traduction contient déjà `{{count}}`)
   - Clé `creneaux_zero` ajoutée FR+EN pour "Aucun créneau" / "No slots"

2. **Dark mode bloc Contexte** (`edt-creneau-modal.tsx`) :
   - `bg-[var(--color-dominant-50)]` → ajout `dark:bg-[var(--color-dominant-900)]/20`
   - `border-[var(--color-dominant-200)]` → ajout `dark:border-[var(--color-dominant-800)]`
   - `text-[var(--color-dominant-700)]` → ajout `dark:text-[var(--color-dominant-300)]`

3. **Select affectation factorisé** (`edt-creneau-modal.tsx`) :
   - **Recherche** : champ input avec icône Search pour filtrer par matière/enseignant/classe
   - **Groupement** : `<optgroup>` par matière pour lever l'ambiguïté des doublons
   - **Labels enrichis** : chaque option affiche "Enseignant — Classe" (au lieu de "Matière — Enseignant")
   - **État dédié** : `rechercheAffectation` + `useMemo` pour filtrage et groupement
   - **Message vide** : "Aucune affectation trouvée" si recherche sans résultat

### Fichiers modifiés (5)
- `frontend/src/features/emploi-du-temps/components/edt-day-view.tsx` (fix redondance jour + créneaux)
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` (dark mode + select groupé)
- `frontend/src/locales/fr/emplois.json` (+3 clés : creneaux_zero, rechercherAffectation, aucunResultat)
- `frontend/src/locales/en/emplois.json` (+3 clés parité FR)

## Travail effectué — Session 2026-08-06 (résumé enrichi + section JF modal création)

### Diagnostic — Logique de création/génération des créneaux
- **Modèle abstrait** : `CreneauHoraire` stocke `jour` (LUNDI...SAMEDI) + `heureDebut`/`heureFin`, PAS de date concrète
- **Année scolaire** : colonnes `periodeId` et `anneeScolaireId` nullable sur l'entité, mais jamais envoyées par le frontend
- **Résolution implicite** : via la chaîne `affectationMatiere → classeAnnee → anneeScolaire`
- **Création manuelle** : StepperModal 3 étapes (Identification → Planification → Résumé)
- **Génération batch** : `genererEmploiDuTemps()` résout automatiquement l'année scolaire via `classeAnnee`

### Améliorations apportées
- **Backend `findAll()`** : jointure `classeAnnee.anneeScolaire` ajoutée (était commentée « JAMAIS ») pour que le frontend reçoive le libellé année scolaire
- **Frontend `AffectationOption`** : interface enrichie avec `anneeScolaire` (nom, anneeDebut, anneeFin) et `matiere.couleur`
- **Résumé (étape 3) réécrit** : 2 blocs distincts + section JF dédiée :
  - **Bloc Contexte** (fond dominant-50) : Matière (nom + code), Enseignant (nom + prénom), Classe (nom + niveau), Année scolaire
  - **Bloc Planification** (fond surface-alt) : Jour, Horaire, Durée calculée (ex: « 1h30 »), Type, Salle
  - **Section JF** : si conflit `CONFLIT_JOUR_FERIE` détecté, liste les dates avec nom du JF + message informatif auto-exclusion
  - **Conflits** : les conflits JF sont affichés dans la section dédiée, pas dans les avertissements génériques
- **Durée calculée** : `useMemo` sur `heureDebut`/`heureFin` → format « XhYY » ou « Xmin »
- **i18n** : 7 clés ajoutées FR+EN (`contexte`, `matiere`, `enseignant`, `anneeScolaire`, `duree`, `joursFeriesDetectes`, `exclusionJF automatique`)

### Fichiers modifiés (5)
- `backend/src/modules/emploi-du-temps/services/emploi-du-temps.service.ts` (+1 jointure anneeScolaire)
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` (résumé réécrit, +123 lignes)
- `frontend/src/locales/fr/emplois.json` (+7 clés)
- `frontend/src/locales/en/emplois.json` (+7 clés)

## Travail effectué — Session 2026-08-06 (détection conflits jours fériés)

### Problème résolu
Aucune détection de conflit avec les jours fériés n'existait. Les créneaux sont stockés avec un `jour` (LUNDI, MARDI...) et une `heureDebut`/`heureFin`, mais les jours fériés sont des dates absolues (ex: 2026-05-01 = vendredi). Il fallait résoudre le mapping jour de semaine → date réelle dans l'année scolaire pour détecter les conflits.

### Décisions de conception
- **Sévérité** : AVERTISSEMENT (warning, pas bloquant) — permet la création mais affiche un avertissement
- **Portée** : Tout (création manuelle, génération batch, prévisualisation, audit global)
- **Résolution** : Via année scolaire (mapper jour→date réelle dans la période de l'année scolaire)

### Backend — `conflit-detection.service.ts` (v1.1.0)
- **Nouveau type de conflit** : `CONFLIT_JOUR_FERIE` ajouté à `TypeConflit`
- **Nouvelle méthode privée** : `detecterConflitJourFerie()` — résout les dates du jour de semaine dans l'année scolaire, vérifie si l'une d'elles est un jour férié
- **Audit global** : section 4 ajoutée — scanne tous les créneaux existants et détecte ceux qui tombent sur un jour férié
- **Imports ajoutés** : `ClasseAnnee`, `AnneeScolaire`, `JourFerie`

### Backend — `emploi-du-temps.service.ts`
- **`genererEmploiDuTemps()`** : charge les JF de l'établissement, résout les jours de semaine qui tombent sur un JF dans l'année scolaire, les exclut de la liste `jours` utilisée pour la génération, ajoute un avertissement dans le résultat
- **`previsualiserGeneration()`** : même logique d'exclusion + ajoute un conflit `CONFLIT_JOUR_FERIE` dans le preview si des jours sont exclus
- **`classeAnnee`** : relation `anneeScolaire` ajoutée au chargement (nécessaire pour résoudre les dates)

### Frontend — Types et i18n
- **`edt.types.ts`** : `CONFLIT_JOUR_FERIE` ajouté à `TypeConflit`
- **`fr/emplois.json`** : 3 clés ajoutées dans `conflitDetection` (`conflitJourFerie`, `conflitJourFerieDesc`, `joursExclus`)
- **`en/emplois.json`** : 3 clés ajoutées (parité FR)

### Fichiers modifiés (5)
- `backend/src/modules/emploi-du-temps/services/conflit-detection.service.ts` (v1.1.0, +83 lignes)
- `backend/src/modules/emploi-du-temps/services/emploi-du-temps.service.ts` (+84 lignes)
- `frontend/src/features/emploi-du-temps/types/edt.types.ts` (+1 type)
- `frontend/src/locales/fr/emplois.json` (+3 clés)
- `frontend/src/locales/en/emplois.json` (+3 clés)

## Travail effectué — Session 2026-08-02 (continuation — i18n, dark mode, responsive EDT)

### Audit i18n complet (4 problèmes corrigés)
1. **`CONTEXTE_LABELS` hardcodé supprimé** (`edt-page.tsx`) : objet statique hors composant avec labels FR en dur → remplacé par `t(\`contexte.${type}\`)` directement dans le JSX aria-label.
2. **Clé `filtres.contexteLabel` ajoutée** FR+EN (`emplois.json`) : `t('filtres.contexteLabel')` sans defaultValue.
3. **"PDF" hardcodé traduit** (`edt-page.tsx`) : bouton `PDF` → `{t('exporterPdf')}` + clé FR/EN.
4. **Locale `'fr-FR'` hardcodée → dynamique** (3 fichiers) : `use-navigation-edt.ts`, `edt-calendar.tsx`, `edt-month-view.tsx` — `i18n.language || 'fr'` pour `toLocaleDateString()`.
5. **Abréviations jours traduites** (`edt-month-view.tsx`) : `['LUN', 'MAR', ...]` hardcodé → `t('jours.${key}')` avec abrégé responsive (`hidden sm:inline` / `sm:hidden`).

### Dark mode — classes CSS non-résolues (3 occurrences)
- **`edt-calendar.tsx`** : `text-foreground` → `text-[var(--color-text-primary)]`, `text-secondary` → `text-[var(--color-text-secondary)]`, `border-border` → `border-[var(--color-bordure)]`, `bg-surface-hover` → `bg-[var(--color-surface-hover)]`.
- `text-success` dans `edt-audit.tsx` : vérifié sain (`--color-success` existe dans globals.css).

### Vérifications
- **DataTable/FilterPanel** : `edt-liste.tsx` intègre déjà correctement le FilterPanel via DataTable (`enableCollapsibleFilters`).
- **Breadcrumbs** : pas de doublon — `PageHeader` (variant="gradient") affiche le fil d'Ariane auto, pas de breadcrumb séparé dans les sous-composants.
- **Compilation** : 0 erreur TypeScript (LSP).

### Fichiers modifiés (7)
- `frontend/src/locales/fr/emplois.json` (+2 clés)
- `frontend/src/locales/en/emplois.json` (+2 clés)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (CONTEXTE_LABELS supprimé, PDF traduit)
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx` (locale dynamique, 3 classes CSS)
- `frontend/src/features/emploi-du-temps/components/edt-month-view.tsx` (jours traduits)
- `frontend/src/features/emploi-du-temps/hooks/use-navigation-edt.ts` (locale dynamique)

## Travail effectué — Session 2026-08-02 (optimisation performance EDT — lazy loading)

### Chargement lazy des options (performance)
**Problème** : 4 requêtes API déclenchées simultanément au chargement de la page, même si seulement 1 nécessaire selon le contexte.

**Correction** : hooks modifiés pour accepter `enabled` (TanStack Query) + conditions dans `edt-page.tsx` :
- `useToutesClasses()` — toujours chargé (contexte par défaut = 'classe')
- `useEnseignantOptions(contexteType === 'enseignant')` — chargé uniquement quand l'utilisateur passe au contexte enseignant
- `useSalleOptions(contexteType === 'salle')` — chargé uniquement quand l'utilisateur passe au contexte salle
- `useMatiereOptions(planningView === 'liste')` — chargé uniquement en vue liste

**Rétro-compatible** : paramètre `enabled = true` par défaut. Seul consommateur = `edt-page.tsx`.
**Cache** : `staleTime: 3-5 min` — une fois chargé, le switch de contexte est instantané.

### Audit log — vérification pattern
- **Controller EDT** : 0 appel `auditService.log()` — tout délégué aux services ✅
- **Service `emploi-du-temps.service.ts`** : 5 appels `auditService.log()` (create, update, delete, valider, valider-classe) — pattern correct ✅
- **Service `heure-cours.service.ts`** : audit dans le service — cohérent ✅
- **Conclusion** : le pattern signalé dans l'audit précédent ("audit dans controller") est déjà résolu.

### Fichiers modifiés (2)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (3 hooks : param `enabled` ajouté)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (conditions lazy aux 3 hooks)

## Travail effectué — Session 2026-08-02 (refactor toolbar EDT + code mort supprimé)

### Problèmes identifiés (audit HTML rendu)
- **`edt-filter-bar.tsx` = code mort** : composant standalone exporté dans le barrel mais **jamais importé** par aucun consommateur. Le même code (context switcher Classe/Enseignant/Salle) était dupliqué inline dans `edt-page.tsx`.
- **Redondance** : `CONTEXTE_ICONS` défini 2 fois (filter-bar + page).
- **Toolbar trop fragmentée** : 4 lignes séparées (navigation, vues, contexte, actions) → encombrement visuel.
- **Dark mode** : segmented buttons actifs (`bg-[var(--color-dominant-100)]`) sans variante dark explicite.
- **Accessibilité** : pas de `aria-label` sur les boutons du segmented context switcher.

### Corrections appliquées
1. **`edt-filter-bar.tsx` supprimé** : composant standalone mort, 196 lignes de code dupliqué éliminées.
2. **Barrel `index.ts` nettoyé** : export `EDTFilterBar` + `ContexteType` retirés.
3. **`edt-page.tsx` v4.0.0 — toolbar consolidée** :
   - **Row 1** (toolbar principale) : Navigation + Contexte + Actions — tout en une ligne compacte avec séparateurs verticaux.
   - **Row 2** (toolbar secondaire) : Vues (semaine/mois/jour/liste) en segmented button + Analytique.
   - **Suppression** du select dropdown de vue (redondant avec les toggles). `ChevronDown` import retiré.
   - **Dark mode** : variantes `dark:bg-[var(--color-dominant-900)]/30 dark:text-[var(--color-dominant-300)]` sur tous les segmented buttons.
   - **Accessibilité** : `aria-label` ajoutés sur les boutons de contexte et les toggles de vue.
   - **Responsive** : labels masqués sur mobile (`hidden sm:inline`), `hidden lg:inline` pour “Heures de cours”. Navigation label passé en `hidden md:inline`.
4. **Imports nettoyés** : `ChevronDown`, `X`, `JourSemaine`, `FilterPanel`, `FilterDef` retirés (non utilisés).

### Backend — confirmé sain
- `queryCreneauxSchema` (DTO) supporte déjà `matiereId` (l.71) + `affectationMatiereId` (l.67).
- `findAll` service applique `am.matiereId = :matiereId` (l.88).
- Pas de modification backend nécessaire.

### Qualité
- `tsc --noEmit` : 0 erreur sur le module EDT.
- 4 rows → 2 rows (réduction 50% de l'encombrement vertical toolbar).
- 196 lignes de code mort supprimées (`edt-filter-bar.tsx`).
- 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur.

## Travail effectué — Session 2026-08-02 (fix i18n EDT — collision clé `jour`)

### Bug critique corrigé
- **`edt-liste.tsx`** : `t('jour')` utilisé comme header de colonne et label de filtre DataTable → `jour` est un **objet** dans le JSON (`{ vide, precedent, suivant, creneaux_one, creneaux_other }`), pas une string. Résultat : `[object Object]` affiché au lieu de "Jour".
- **Fix** : `t('jour')` → `t('calendrier.jour')` (clé existante = "Jour" FR / "Day" EN). 2 occurrences corrigées (header colonne l.28, label filtre l.178).
- **Convention i18n ajoutée** : règle 35 dans `elisaschool-frontend.md` — ne jamais nommer une clé objet et une clé string identiques au même niveau. Utiliser des namespaces distincts (`calendrier.jour` pour le label, `jour.vide` pour la vue jour).

### Qualité
- 0 `t('jour')` restant dans le module EDT. `calendrier.jour` = "Jour" (FR) / "Day" (EN) vérifié dans les deux fichiers JSON.
- Parité i18n FR/EN complète sur le module EDT (343+ clés).

## Travail effectué — Session 2026-08-04 (audit deep-dive EDT + corrections frontend)

### Contexte
Audit de conformité du module EDT vs conventions eLISAschool (rapport livré en conversation, décisions Q1–Q6 validées : rapport d'abord, axe équilibré P0/P1/P2, rapport en conversation, granularité par composant + blocs transverses, backend niveau service, workflow validation générique NON recommandé). Corrections à faible risque implémentées ; chantiers lourds documentés (refonte DataTable, barrels) en attente de validation séparée.

### Verdicts rapport
- **Backend** : ✅ services sains (conflit-commun, heure-cours v1.2.0, cron-jobs, controller permissionné). ⚠️ P1 `conflit-detection.service.ts` l.187 : `coEnseignantIds` SQL brut `ANY(string_to_array(...))` non indexable + `auditConflitsGlobaux` 3 scans. ⚠️ P1 : audit loggé dans le controller EDT (15 appels l.33-238) vs dans le service pour heure-cours (13) — pattern à uniformiser (déplacer dans le service). P2 documenté : table jonction co-enseignants, `creneauId` NOT NULL, triggers DB, dé-normalisation `typeCreneau`/`salleId`.
- **Frontend** : ✅ conforme edt-page/calendar/month-view/preferences (+ templates mineur). 🔴 edt-liste (table artisanale). ⚠️ edt-generation-modal (stepper maison), edt-synthese, edt-audit, edt-heures-cours-modal, edt-filter-bar (emojis). Bonus : tab-heure-cours sans ErrorBoundary, 3 hooks morts `use-heure-cours`.

### Corrections implémentées (10 fichiers)
1. **Règle 34 ajoutée** `.qoder/rules/elisaschool-frontend.md` : pattern module EDT (DataTable partagée, jamais setState pendant rendu, StepperModal/StatCard partagés, icônes lucide partout, CSS vars, JOUR_MAP canonique, ErrorBoundary onglets personnel, imports via barrels, parité i18n, audit dans services).
2. **`edt-liste.tsx` (P0 setState pendant rendu)** : `setPage(Math.min(page, …))` → dérivation pure `pageEffectif = Math.min(page, totalPages)` ; badges green/blue hardcodés → `var(--color-success)`/`var(--color-info)` /10 (pattern AuditTimeline/Badge) ; colonnes « Type »/« Statut » → `t('type')`/`t('statut')`.
3. **i18n EN** : 61 clés manquantes ajoutées (`synthese.*`, `audit.*`, `generationHeuresCours.*`) + `type`/`statut` FR+EN → parité 343/343 (vérifiée par script Python).
4. **`personnel-detail-page.tsx`** l.785-789 : `<TabHeureCours>` enveloppé `<ErrorBoundary key="heures-cours">` (aligné autres onglets).
5. **`edt-day-view.tsx`** : bug `JOUR_MAP :{0:'SAMEDI'}` corrigé → `{1:'LUNDI'…6:'SAMEDI'}` + fallback `t('jour.vide')` ; `dateStr` via `formatDate(date, 'EEEE d MMMM')` (@/lib/date-utils) ; **code mort supprimé** `statut === 'ANNULE'` (inexistant sur StatutCreneau → erreur TS2367) ; rouge → `var(--color-danger)`.
6. **`edt-month-view.tsx`** : vue mois TOUJOURS vide (bug logique) — groupement par `c.date` (champ inexistant) → groupement par `c.jour` (hebdomadaire récurrent) + lookup cellule par index colonne (`JOURS_INDEX`). Erreurs TS2339 résolues.
7. **Couleurs → CSS vars** : edt-synthese (3), edt-audit (18), edt-heures-cours-modal (15) ; grep final : seul `#3b82f6` (input type=color) légitime.
8. **`edt-creneau-modal.tsx` réécrit** (~450 l. → 460 l.) sur `StepperModal` partagé (3 étapes, validate étape 1 affectation + étape 3 conflits bloquants, footerActions Valider/Supprimer, ConfirmationModal propagation). Imports CustomModal/ChevronRight/ant retirés. **⚠️ piège dominant** : classes `text-destructive`/`border-destructive/30` **aucun CSS généré** (`--color-destructive` absent de `@theme` — seule `--color-danger` existe) — remplacées par `var(--color-danger)`. Emojis 🔴/🟠 → lucide AlertTriangle/AlertCircle.
9. **`edt-filter-bar.tsx`** : emojis 🏫👨🏫🚪 → lucide (Users/GraduationCap/DoorOpen).
10. **`StepperModal.tsx` étendu** (rétro-compatible) : props `footerActions?: ReactNode` + `onStepChange?: (index)` ; footer = `{footerActions}<ElisaButton ghost Annuler>` ; handlePrev/handleStepClick/handleClose/handleNext notifient onStepChange.

### Qualité
- `npx tsc --noEmit` **0 erreur full frontend** (exit 0). Parité i18n FR/EN 0 manquante. 0 emoji dans le module EDT. 0 classe destructive ; convention = `var(--color-danger)`.

### Chantiers documentés (non implémentés — validation séparée)
- **T2** : refonte edt-liste sur DataTable partagée (P1).
- **T6** : barrels personnel (`features/personnel/index.ts` n'exporte ni use-heure-cours ni TabHeureCours/HeureCoursFormModal/OngletEdt) ; edt-synthese + edt-heures-cours-modal importent par chemins directs.
- **Backend P1** : co-enseignants indexable + audit déplacé dans les services EDT.
- 3 hooks morts `use-heure-cours` (P2 nettoyage).

### Corrections complémentaires (session suite — 2026-08-04)
- **edt-generation-modal migré sur StepperModal** (T3 complet) — modal autonome (contrat `open`/`onOpenChange` retiré de edt-page), 3 étapes Options/Préview/Succès. **Piège `isStepValid`** : le StepperModal appelle `validate` à chaque rendu pour le `disabled` — un `validate` async avec effets (preview/génération) déclencherait des requêtes en double → `disableNextOnInvalid={false}` (le `validate` reste click-only dans `handleNext`). Stephés : step 1 `validate: async runPreview`, step 2 `validate: async runGeneration`, step 3 footer caché (`hideFooterOnLastStep`) + boutons Fermer/VoirEDT dans le contenu. Labels primaires par étape via `nextLabels` (Prévisualiser→Prévisualisation…→Générer→En cours…→Générer malgré les conflits). Reset d'état à la fermeture (useEffect). Clé i18n `generation.previewErreur` ajoutée FR+EN.
- **StepperModal étendu** : props `nextLabels?: string[]` (label du bouton principal par étape) + `hideFooterOnLastStep?: boolean` (footer masqué à la dernière étape). Rétro-compatibles.
- **T6 barrels** : `features/personnel/index.ts` exporte désormais `use-heure-cours`, `TabHeureCours`, `HeureCoursFormModal`, `OngletEdt` ; edt-heures-cours-modal importe via `@/features/personnel`. Plus aucun import cross-feature direct dans personnel.
- **3 hooks morts supprimés** de `use-heure-cours.ts` : `useEdtEnseignant`, `useVolumeHoraire`, `useHeureCoursById` (aucun import).

### Corrections appliquées (4 modifications, 2 fichiers)

1. **Motif de propagation** (`heure-cours.service.ts` l.343-351) : traçabilité des changements propagés dans `commentaire` — format `Propagé(xxxxxxxx): jour→MARDI, début→08:00, salle→uuid`. Concaténé avec commentaire existant via `filter(Boolean).join(' | ')`.

2. **Save par lots — propagation** (`heure-cours.service.ts` l.366-373) : remplacement du `mgr.save(cibles)` monolithique par des chunks de 50. Réduit la charge DB pour les propagations de masse (30 créneaux × 16 semaines = 480 instances).

3. **Commentaire architecture** (`heure-cours.entity.ts` l.39-61) : bloc JSDoc documentant que toutes les écritures HeureCours doivent passer par `HeureCoursService`. Décrit les 4 flux (propagation, matérialisation, annulation, remontée).

4. **Bulk insert — matérialisation** (`heure-cours.service.ts` l.1015-1016, 1096-1111) : remplacement des `this.repo.save(hc)` individuels (N requêtes) par accumulation dans `batch[]` + flush par chunks de 50 en fin de semaine. Réduction : 480 requêtes → ~10 requêtes.

### Fichiers modifiés (2)
- `backend/src/modules/personnel/services/heure-cours.service.ts` (+33 lignes, -4 lignes)
- `backend/src/modules/personnel/entities/heure-cours.entity.ts` (+23 lignes)

### Cohérence vérifiée
- `mgr` utilisé dans propagation (transactionnel) vs `this.repo` dans matérialisation (pas de transaction externe)
- Motif annulation (`annulerInstancesCreneaux` SQL COALESCE) inchangé
- Audit trail existant conservé (l.375-385 propagation, l.1118-1127 matérialisation)

## Travail effectué — Session 2026-08-03 (Phase 1 — traçabilité, performance, architecture EDT)

### Corrections appliquées (4 modifications, 2 fichiers)

1. **Motif de propagation** (`heure-cours.service.ts` l.343-351) : traçabilité des changements propagés dans `commentaire` — format `Propagé(xxxxxxxx): jour→MARDI, début→08:00, salle→uuid`. Concaténé avec commentaire existant via `filter(Boolean).join(' | ')`.

2. **Save par lots — propagation** (`heure-cours.service.ts` l.366-373) : remplacement du `mgr.save(cibles)` monolithique par des chunks de 50. Réduit la charge DB pour les propagations de masse (30 créneaux × 16 semaines = 480 instances).

3. **Commentaire architecture** (`heure-cours.entity.ts` l.39-61) : bloc JSDoc documentant que toutes les écritures HeureCours doivent passer par `HeureCoursService`. Décrit les 4 flux (propagation, matérialisation, annulation, remontée).

4. **Bulk insert — matérialisation** (`heure-cours.service.ts` l.1015-1016, 1096-1111) : remplacement des `this.repo.save(hc)` individuels (N requêtes) par accumulation dans `batch[]` + flush par chunks de 50 en fin de semaine. Réduction : 480 requêtes → ~10 requêtes.

### Fichiers modifiés (2)
- `backend/src/modules/personnel/services/heure-cours.service.ts` (+33 lignes, -4 lignes)
- `backend/src/modules/personnel/entities/heure-cours.entity.ts` (+23 lignes)

### Cohérence vérifiée
- `mgr` utilisé dans propagation (transactionnel) vs `this.repo` dans matérialisation (pas de transaction externe)
- Motif annulation (`annulerInstancesCreneaux` SQL COALESCE) inchangé
- Audit trail existant conservé (l.375-385 propagation, l.1118-1127 matérialisation)

## Travail effectué — Session 2026-08-03 (Lot 2 — Q7 matérialisation auto HeureCours + Q8 nettoyage)

### Contexte
Suite du grill Q1–Q8 : matérialisation automatique des instances HeureCours à partir des créneaux hebdomadaires. **Q8 (code mort)** terminé, **Q7 (matérialisation auto)** complet backend + frontend, vérifié par walkthrough API réel (8/8 verts).

### Sémantique Q7 (décisions actées)
- **`genereAutomatiquement`** = flag d'autorisation sur CreneauHoraire, **défaut `true`** (défaut DB `false` mais le service force `?? true` à la création ; le générateur EDT force `true`).
- **Canal A** : à la validation (PLANIFIE→VALIDE), matérialisation des instances de la semaine courante → S+1, uniquement pour les créneaux flag-auto.
- **Canal B** : cron **configurable par établissement** — `materialisationAuto` JSONB sur PreferenceEmploiDuTemps : `{actif, horaires: [{jour, heure}]}` (1..14 horaires, 7 jours, validation zod). **Défaut** : samedi 21:00 + mercredi 21:00. Garde journalière (1 run/jour/établissement).
- **Plage** : `[lundi de la semaine courante, dimanche S+1]`, **clampée aux bornes de l'année scolaire EN_COURS** (`enCours=true` OU `statut=EN_COURS`, **tri `dateDebut DESC`** si plusieurs — doublon de données découvert au walkthrough). Hors bornes → ignoré proprement.
- **Fuseau** : cron node-cron `timezone: 'Africa/Douala'` + calcul jour/heure/date via `Intl.DateTimeFormat` (fix bug : `new Date()` serveur = UTC → décalage 1h).

### Backend (6 fichiers)
- **`heure-cours.service.ts`** : coeur réutilisable `materialiserInstances({etablissementId, enseignantId?, classeAnneeId?, creneauIds?, dateDebut, dateFin, periodeId?, respecterFlagAuto?, createurId?, req?})` (anti-doublon + conflit enseignant conservés) ; `genererHeuresCoursFromEdt` délègue avec `respecterFlagAuto: false` ; nouvelle `materialiserSemainesCourantes()` (plage + clamp année + `respecterFlagAuto: true`).
- **`emploi-du-temps.service.ts`** : `creerCreneau` → `genereAutomatiquement: dto.genereAutomatiquement ?? true` ; Canal A dans `validerCreneau` (creneauIds: [id]) et `validerCreneauxClasse` (creneauIds: idsAuto).
- **`emploi-du-temps.dto.ts`** : `genereAutomatiquement: z.boolean().optional()` (création) ; `horaireMaterialisationSchema` + `materialisationAutoSchema` (horaires 1..14) dans `preferenceEmploiDuTempsSchema`.
- **`preference-emploi-du-temps.entity.ts`** : interfaces `HoraireMaterialisation`/`MaterialisationAutoConfig` + colonne `materialisationAuto jsonb` (sauvegarde via Object.assign, inchangé).
- **`cron-jobs.ts`** (nouveau) : `DEFAULT_MATERIALISATION_AUTO`, `materialiserSiNecessaire()` (garde journalière Map), `initEmploiDuTempsCronJobs()` (cron `'* * * * *'`, timezone Africa/Douala, try/catch par établissement).
- **`index.ts`** : `initEmploiDuTempsCronJobs()` câblé. **Migration `140-materialisation-auto.sql`** (colonne jsonb, idempotente).
- ⚠️ Index unique anti-doublon : **déjà existant** via migration 139 (`idx_heures_cours_no_dup` partiel `deletedAt IS NULL` + `idx_heures_cours_no_dup_manuel`) — rien à créer.

### Q8 — Code mort supprimé (frontend)
- `edt-heure-cours-modal.tsx` supprimé (+ export barrel) ; hooks `useValiderCreneau`/`useValiderCreneauxClasse` + type `ResultatValidationClasse` supprimés (**routes backend `POST /:id/valider` et `/valider-classe/:classeAnneeId` conservées**) ; clés i18n mortes (`creneauValide`, `classeValide`, `erreurValidation`) supprimées FR/EN.
- **Filtres fantômes** `inclureHeuresCours`/`typeSource` supprimés de `CreneauFilters` + `onglet-edt.tsx` (le backend ne les a jamais traités — seule mention dans la migration 071).

### Frontend Q7
- **`edt-preferences.tsx`** : carte « Matérialisation automatique » — checkbox actif, lignes jour+heure (selects + time inputs), ajout/suppression d'horaires (max 14, min 1), bouton Réinitialiser mis à jour, `DEFAULT_MATERIALISATION_AUTO` local, i18n FR/EN (`preferences.materialisationAuto*`).
- **`edt-creneau-modal.tsx`** : checkbox `genereAutomatiquement` (étape Identification, défaut true, payload création uniquement) + clé i18n `creneau.modal.genereAutomatiquement` FR/EN.
- **`edt.types.ts`** : `PreferenceEDT.materialisationAuto?` typé.

### Walkthrough API réel (SUPER_ADMIN, CM1) — 8/8 verts
1. Validation créneau flag=true → **2 instances** (MARDI 4 + 11 août) ✅
2. Créneau flag=false → validation → **0 instance** ✅
3. `validerCreneauxClasse` → matérialise seulement les flag-auto (0 ici : les 2 validés étaient flag=false) ✅
4. **Idempotence** : re-run → `2 ignorées`, aucun doublon ✅
5. Garde année scolaire : hors bornes → « Matérialisation auto ignorée » ✅
6. Config préférences PUT/GET + validation zod (15 horaires → 400 VALIDATION_ERROR) ✅
7. Cron : config LUNDI 03:01 → déclenchement → **10 créées / 2 ignorées** ✅
8. Garde journalière : re-déclenchement même jour → rien ✅
- **Bug découvert/fixé** : fuseau cron (heure serveur UTC vs Africa/Douala) → `maintenantFuseau()` via Intl.
- **Bug découvert (données)** : 2 années scolaires EN_COURS sur des établissements différents — comportement correct après tri DESC.
- Données de test nettoyées : heures_cours restaurées à 13, créneaux de test supprimés, année scolaire et préférence restaurées.

### Qualité
- tsc backend : 0 nouvelle erreur (297 préexistantes hors périmètre, dont cron-jobs audit/auth `scheduled: true` TS2353). tsc frontend : 0 erreur in-scope. JSON i18n valides FR/EN.

## Travail effectué — Session 2026-08-03 (suite — migration 141 soft delete + vérif instrumentation)

### Migration `141-soft-delete-rh-organisation.sql` (créée + appliquée en local)
- **19 tables** avec `deletedAt TIMESTAMP NULL` (ADD COLUMN IF NOT EXISTS, DO $$ idempotent) : les 13 entités D1 (personnel×6 : absences_personnel, evaluations_enseignants, heures_cours, affectations_postes, progressions_programme, indisponibilites_enseignants ; paie×4 : cotisations, types_primes, types_retenues, elements_salaire ; organisation×3 : unites_organisationnelles, postes, hierarchie_personnel) + tables RH/EDT déjà en soft delete créées via synchronize uniquement (membres_personnel, contrats_personnel, bulletins_paie, creneaux_horaires, annonces, backup_records).
- **⚠️ Ordre staging/prod** : la migration 139 (index unique heures_cours, `WHERE "deletedAt" IS NULL`) exige la colonne sur heures_cours → appliquer la **141 AVANT la 139** (documenté en en-tête de la migration + Next Move).
- Les migrations SQL ne sont PAS branchées sur TypeORM (`data-source.ts` sans glob migrations) → application manuelle via psql/docker (comme les 122–131).

### Vérification instrumentation (Next Move items 4–5) — tout déjà présent
- `bulletin-paie.service.ts` : 8 appels `auditService.log` (CREATE/UPDATE/DELETE/GENERATE/PUBLIE) ✅
- `absence-personnel.service.ts` : 4 actions (CREATE/UPDATE/DELETE/JUSTIFIER) ✅
- `evaluation.service.ts` (nom réel — pas evaluation-enseignant.service.ts) : 3 actions ✅
- `progression-programme.service.ts` : 3 actions ✅
- `indisponibilite-enseignant` : **entité sans service** (inerte, aucun CRUD exposé) → rien à instrumenter.

### Qualité
- Migration appliquée en local : 19 NOTICE « already exists, skipping » (colonnes créées par synchronize), exit 0, 20 tables avec deletedAt au total.

## Travail effectué — Session 2026-08-03 (synchronisation CreneauHoraire ↔ HeureCours — Lot 1 complet)

### Contexte
Grill Q1–Q8 : synchronisation bidirectionnelle entre les créneaux hebdomadaires de l'EDT et les instances de cours datées. **Lot 1 (backend + frontend)** terminé et vérifié par walkthrough API réel. Lot 2 (matérialisation auto, nettoyage) à venir.

### Sémantique retenue (Q1–Q6)
- **Hybride à frontière temporelle (Q4)** : une instance suit le créneau si `statutEffectue = PLANIFIE` ET `date >= aujourd'hui` ; sinon figée (passée/effectuée/annulée).
- **Propagation (Q2)** : modification jour/heure/salle/type du créneau → instances futures PLANIFIE alignées. **Suppression créneau** → instances futures PLANIFIE passent à `ANNULE` (+ motif en commentaire). **Régénération EDT** = soft delete des créneaux + ANNULE des instances liées.
- **Conflits (Q5)** : dry-run AVANT toute écriture dans `updateCreneau` ; 409 `CONFLITS_PROPAGATION` avec `details.{ rapport }` ; mode `propagerForce` = exclure les instances en conflit.
- **Q6-C** : case explicite `mettreAJourCreneau` (défaut OFF) — le PATCH d'une instance peut aussi mettre à jour le créneau hebdo + propager aux autres instances (instance courante exclue via `excludeInstanceIds`).

### Backend (5 fichiers)
- **`heure-cours.service.ts`** : types `ConflitPropagation`/`RapportPropagation{instancesQuiSuivent,instancesInchangees,conflits}`/`ChangementsPropagation` ; `propagerModificationCreneau` (2 passes : calcul+conflits sans écriture, puis `save(cibles)`) ; `annulerInstancesCreneaux` ; `appliquerModificationAuCreneau` (Q6-C, check hebdo `conflitDetectionService.detecterConflits` filtre BLOQUANT → 409 `CONFLITS_CRENEAU`) ; helpers `dateToString`/`toDate`/`lundiDeSemaine`/`jourVersIndex`/`jourDepuisDate` **tolérants `Date | string`** (le driver pg retourne les colonnes `date` en string — bug découvert au walkthrough).
- **`heure-cours.dto.ts`** : `mettreAJourCreneau: z.boolean().optional()`.
- **`heure-cours.controller.ts`** : PATCH → `{ data: heureCours, rapport }`.
- **`emploi-du-temps.service.ts`** : `updateCreneau(id, dto, etablissementId, userId?, req?)` → `{ creneau, rapport }` — dry-run AVANT save **avec `force: propagerForce`** (sinon le service de propagation jetait avant le contrôle du 409 — fix walkthrough) ; `supprimerCreneau` → `{ instancesAnnulees }` ; `genererEmploiDuTemps` : ids → `softDelete().whereInIds()` + `annulerInstancesCreneaux` (motif régénération) si `options.regenerer`.
- **`emploi-du-temps.dto.ts`** : `propagerForce: z.boolean().optional()`.

### Frontend (8 fichiers)
- **`edt.types.ts`** : `ConflitPropagation`, `RapportPropagation`, `ResultatUpdateCreneau{success,data,rapport?}`, `ChangementsCreneau`.
- **`use-emploi-du-temps.ts`** : `useUpdateCreneau` accepte `propagerForce`, 409 silencieux (le composant gère le force), toasts `creneauModifiePropage`/`creneauSupprimeAvecInstances` ; `useSupprimerCreneau` → `{ instancesAnnulees }`. **Doublon `useGenererHeuresCoursFromEdt` supprimé** (ré-import depuis `personnel/hooks/use-heure-cours`, source unique).
- **`edt-calendar.tsx`** : `soumettreModification` (mutateAsync + capture 409 → `forceRequest` + invalidation serveur) et `forcerPropagation` **déclarés AVANT `handleDragStart`** (TS2448/2454 — hoist) ; bannière force : `propagation.{conflitsTitre,conflitsMessage,forcer,annuler}` ; drag/resize passent par la soumission.
- **`edt-creneau-modal.tsx`** : bouton Supprimer (danger, si édition) + `ConfirmationModal` (`propagation.supprimer*`) → DELETE + close ; onError PATCH 409 → toast message backend.
- **`heure-cours-form-modal.tsx`** : checkbox `mettreAJourCreneau` (si `cours.creneauId`, payload conditionnel) + garde UI REMPLACE (avertissement + bouton disabled si pas de remplaçant).
- **`use-heure-cours.ts`** : `HeureCours` + `creneauId?/affectationMatiereId?/updatedAt?` ; `useGenererHeuresCoursFromEdt` enrichi (type complet, toasts `heuresCours.generationReussie/erreurGeneration`, invalidation croisée `['personnel','heures-cours']` + `['emploi-du-temps']`).
- **i18n** : `emplois.json` — bloc `propagation.*` (7 clés), toasts propagation ; `personnel.json` — `heuresCours.{mettreAJourCreneau,mettreAJourCreneauAide,remplacantRequis}`. Clé morte `toasts.heuresCoursGenerees` supprimée.

### Bugs découverts au walkthrough réel (tous corrigés)
1. **Colonnes `date` pg = strings** : `dateToString`/`lundiDeSemaine`/`jourDepuisDate` + l.643 `update()` (`.toISOString()` sur string) → tolérance `Date | string` + helper `toDate()`.
2. **Dry-run sans force** : `propagerModificationCreneau` jetait 409 lui-même → le contrôle `propagerForce` du service EDT était mort ; `force: propagerForce` passé au dry-run.
3. **Doublon `useGenererHeuresCoursFromEdt`** (personnel + emploi-du-temps) → unifié côté personnel.
4. **TS2448/2454** : `soumettreModification` utilisé avant déclaration (drag/resize) → hoist + `return (` dupliqué nettoyé.

### Walkthrough API réel (SUPER_ADMIN, CM1, 17 créneaux, 13 instances) — tout vert
- PATCH créneau heureDebut/Fin → `rapport {1,0,[]}`, instance DB alignée ✅
- Changement jour → 409 `CONFLITS_PROPAGATION` (1 suit / 1 conflit enseignant+classe exclue) ✅
- `propagerForce:true` → créneau appliqué, conflit exclu, rapport complet ✅
- DELETE créneau → `{ instancesAnnulees: 2 }`, instances `ANNULE` + motif « Créneau supprimé » ✅
- PATCH instance `mettreAJourCreneau:true` → créneau + autres instances alignées (08:00-08:55) ✅
- Gardes REMPLACE : `REMPLACANT_REQUIS` (sans id) / `REMPLACANT_INVALIDE` (id inexistant) ✅
- PATCH instance en conflit → 409 `CRENEAU_CONFLIT` avec liste ✅
- POST /generer `{options:{regenerer:true}}` → 3 créneaux recréés, anciens soft-deletés, instances ANNULE (motif régénération) ✅
- Données de test nettoyées (7 lignes), heures_cours restaurées à 13.

### Qualité
- tsc frontend : 0 erreur in-scope (fichiers Lot 1). Backend : 0 nouvelle erreur (297 préexistantes hors périmètre — controller DonneesCreneau, PDF nom/prenom, salleNom, TS1064, PreferenceEmploiDuTemps).
- 0 `any` nouveau, 0 couleur hardcodée, i18n FR/EN parité.

## Travail effectué — Session 2026-08-02 (EDT P2–P5 : preview, pointage, timeline, export)
### P2 : Génération progressive avec preview + résolution conflits
- **Backend** : route `POST /api/emploi-du-temps/previsualiser` ajoutée au controller (dry-run, permission `emploi-du-temps:generer`). Service `previsualiserGeneration()` déjà existant.
- **Frontend types** : `CreneauPreview`, `ConflitPreview`, `ResumePreview`, `ResultatPreviewEDT` ajoutés à `edt.types.ts`.
- **Frontend hook** : `usePrevisualiserEDT()` ajouté à `use-emploi-du-temps.ts`.
- **Modal multi-étapes** : `edt-generation-modal.tsx` réécrit (3 étapes : Options → Preview → Succès). Stepper animé (Framer Motion), 4 resume cards (créneaux/heures/matières/conflits), liste créneaux filtrée par jour, onglet conflits, bouton "Générer malgré les conflits" si conflits détectés.
- **i18n** : 18 nouvelles clés FR+EN dans `emplois.json` (generation.preview.*, generation.succes.*, toasts.erreurPreview).

### P3 : Page dédiée HeureCours (suivi effectif, pointage)
- **Backend** : déjà complet (CRUD, génération depuis EDT, volume horaire, résumé mensuel, conflits).
- **Frontend** : `tab-heure-cours.tsx` réécrit (v2) — toggle Résumé/Liste détaillée, filtre par statut (TOUS/PLANIFIE/EFFECTUE/ANNULE/REMPLACE), liste groupée par date avec pointage rapide inline (boutons ✓/✗ pour marquer effectué/annulé), hover reveal actions, badge statut coloré.
- **i18n** : 11 nouvelles clés FR+EN dans `personnel.json` (vueResume, vueListe, marquerEffectue, marquerAnnule, statutChange.*).

### P4 : Timeline verticale Google Calendar
- **Indicateur temps réel** : ligne rouge horizontale avec point showing current time, mise à jour toutes les minutes (setInterval 60s), visible uniquement dans la plage horaire.
- **Clic cellule vide** : prop `onCellClick` ajoutée à `EDTCalendar`, hover background sur les cellules, cursor-pointer.
- **Cartes améliorées** : fond coloré subtil via `color-mix(in srgb, couleur 8%, surface)` au lieu de surface uni.

### P5 : Navigation semaine + export PDF
- **Navigation semaine** : barre de navigation avec boutons prev/next (ChevronLeft/ChevronRight) + bouton "Aujourd'hui" (highlighted si semaine courante). Calcul du lundi de la semaine via `semaineOffset`, numéro de semaine ISO, label "28 juil. — 3 août".
- **Dates dans les colonnes** : `edt-calendar.tsx` accepte `semaineDebut?: Date` — affiche la date réelle sous le nom du jour (ex: "Lundi\n4 août"). Le jour courant est highlighté en couleur accent (`bg-[var(--color-accent-600)]`).
- **Clic → créer créneau** : `handleCellClick` wired dans `edt-page.tsx`, ouvre le modal créneau.
- **Export PDF** : bouton Download ajouté dans la toolbar de la page EDT (visible quand une classe est sélectionnée).
- **i18n EN** : clés `calendrier.semaine`, `precedent`, `suivant`, `aujourdhui`, `jour` ajoutées dans `en/emplois.json`.

### Fichiers modifiés (13)
- `backend/src/modules/emploi-du-temps/controllers/emploi-du-temps.controller.ts` (route /previsualiser)
- `frontend/src/features/emploi-du-temps/types/edt.types.ts` (types preview)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (hook preview)
- `frontend/src/features/emploi-du-temps/components/edt-generation-modal.tsx` (réécrit v2, 418 lignes)
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx` (indicateur temps réel, onCellClick, cartes colorées, dates colonnes, semaineDebut)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (onCellClick, export PDF, navigation semaine)
- `frontend/src/features/personnel/components/tab-heure-cours.tsx` (réécrit v2, 324 lignes)
- `frontend/src/locales/fr/emplois.json` + `en/emplois.json` (clés preview + navigation)
- `frontend/src/locales/fr/personnel.json` + `en/personnel.json` (clés pointage)
- `AGENTS.md` (cette section)

## Travail effectué — Session 2026-08-02 (audit EDT — recommandations grill-me)
### Recommandations implémentées (9/9)

**P0 — Backend critiques** :
- **P0-1** : `genererHeuresCoursFromEdt` vérifie maintenant les conflits enseignant (chevauchement horaire) avant création — retourne liste des conflits dans le résultat.
- **P0-2** : Nouvel endpoint `GET /api/emploi-du-temps/audit-conflits` — scan global de tous les conflits EDT (par groupe classe/jour, enseignant/jour, salle/jour) avec sévérité (bloquant/avertissement).
- **P0-3** : `getStatistiques()` calcule désormais `conflitsPotentiels` via `conflitDetectionService.auditConflitsGlobaux()`.

**P1 — Frontend pilotage** :
- **P1-1** : Nouvel onglet « Audit » dans `edt-page.tsx` (6ème onglet, icône Shield). Composant `edt-audit.tsx` (273 lignes) : KPIs (total/bloquants/avertissements), filtres par sévérité, liste groupée par type de conflit avec icônes, état vide (CheckCircle2 si 0 conflit).
- **P1-2** : Widget `ChargeEnseignant` ajouté dans `edt-synthese.tsx` — bar chart horizontal de la charge hebdomadaire par enseignant, seuil d'alerte 20h (rouge si dépassé), badge "N en alerte".
- **P1-3** : Modal `edt-heures-cours-modal.tsx` (230 lignes) — sélection plage dates (lundi→samedi par défaut), appel `POST /api/personnel/heures-cours/generer-from-edt`, affichage résultat (créées/ignorées/erreurs/total). Bouton dans la toolbar de `edt-page.tsx`.

**P2 — Structurel** :
- **P2-1** : Templates intégrés dans la génération automatique. Backend : `templateId` optionnel dans `genererEmploiDuTempsSchema`, méthode `appliquerTemplate()` override les préférences (joursTravaillés, heureDebut/Fin, duréeCréneau). Frontend : sélecteur de template dans `edt-generation-modal.tsx`.
- **P2-2** : Permissions granulaires `heures-cours:*` (5 permissions : view/create/edit/delete/generate). Controller `heure-cours.controller.ts` migré de `personnel:manage`/`personnel:view` vers les permissions fines. Attribution par rôle : ADMIN/CHEF_ETABLISSEMENT/PROVISEUR/PRINCIPAL (toutes), DIRECTEUR/CENSEUR/SECRETAIRE_DIRECTION (sans generate), ENSEIGNANT/SURVEILLANT (view seule). Migration 138.
- **P2-3** : Soft delete sur `CreneauHoraire` — `@DeleteDateColumn()` ajouté à l'entité, `softRemove()` au lieu de `remove()` dans le service.

### Fichiers modifiés/créés (16)
- `backend/src/modules/personnel/controllers/heure-cours.controller.ts` (permissions granulaires)
- `backend/src/modules/emploi-du-temps/services/emploi-du-temps.service.ts` (templateId + appliquerTemplate)
- `backend/src/modules/emploi-du-temps/dto/emploi-du-temps.dto.ts` (templateId dans schéma)
- `backend/database/migrations/138-permissions-heures-cours.sql` (créé, 79 lignes)
- `shared/src/enums/roles.enum.ts` (5 nouvelles permissions HEURES_COURS + attribution rôles)
- `frontend/src/features/emploi-du-temps/components/edt-audit.tsx` (créé, 273 lignes)
- `frontend/src/features/emploi-du-temps/components/edt-heures-cours-modal.tsx` (créé, 230 lignes)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (onglet audit + bouton heures-cours)
- `frontend/src/features/emploi-du-temps/components/edt-synthese.tsx` (widget ChargeEnseignant)
- `frontend/src/features/emploi-du-temps/components/edt-generation-modal.tsx` (sélecteur template)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (hooks useAuditConflits, useGenererHeuresCoursFromEdt, templateId)
- `frontend/src/features/emploi-du-temps/types/edt.types.ts` (types AuditConflitsResult)
- `frontend/src/locales/fr/emplois.json` (60+ clés i18n : audit, synthese.chargeEnseignant, generationHeuresCours)
- `AGENTS.md` (cette section)

## Travail effectué — Session 2026-08-01 (animations loading — centrage + SchoolLoading v2)
### Améliorations apportées
- **Centrage InlineSpinner** : 3 pages non centrées corrigées (personnel-page, eleves-page, finances-page) — ajout `flex justify-center min-h-[200px] items-center`.
- **SchoolLoading v2** (`frontend/src/components/feedback/SchoolLoading.tsx`) : composant thématique scolaire avec **4 thèmes animés** :
  - `book` (défaut) : livre qui s'ouvre (pages gauche/droite en rotateY), lignes qui apparaissent séquentiellement, crayon animé qui écrit
  - `pencil` : crayon qui écrit seul sur du papier avec lignes qui apparaissent
  - `notebook` : cahier à spirale avec page qui tourne (rotateY -160°)
  - `globe` : globe terrestre avec méridiens en rotation, continents stylisés, point lumineux orbital
- **Variantes** : `full` (page, 80-120px) / `compact` (onglet/section, 48-72px)
- **Thème auto** : light/dark via MutationObserver. Ultra-responsive (clamp). Accessible (role=status, aria-label). Message personnalisable.
- **Intégration étendue** :
  - Pages : personnel-page, eleves-page, finances-page, evaluations-page, rapports-page, statistiques-page, analytics-page, securite-page, laboratoire-page, stage-page, parking-page, etablissement-edit-page (variant="full")
  - Onglets (8) : onglet-absences, onglet-contrat, onglet-edt, onglet-evaluations, onglet-parcours, onglet-matieres, onglet-matieres-planning, onglet-matieres-kanban (variant="compact")
  - Sections : tab-fonctions, fonction-arbre, tab-niveaux, tab-programme, matiere-detail-page (EDT + affectations), personnel-detail-page (contrats + bulletins + affectations) (variant="compact")
  - Modals : personnel-form-modal, suppression-utilisateur-modal (variant="compact")
- **Spinners manuels éliminés** : 12 `animate-spin border-b-2 border-blue-600` hardcodés supprimés et remplacés par SchoolLoading (thème auto, plus de couleur hardcodée).
- **Loader2 section-level migrés** : tab-fonctions, fonction-arbre → SchoolLoading compact.
- **InlineSpinner conservé** pour les indicateurs inline uniquement — 2 occurrences restantes (workflow matiere-detail, soumission heure-cours-form-modal).
- **Hiérarchie loading** : SplashScreen → SchoolLoading → PageSkeleton → TableSkeleton → StatsCardSkeleton → InlineSpinner → ProgressBar.
- **Barrel export** : `SchoolLoading` ajouté à `components/feedback/index.ts`.

### Fichiers modifiés (32)
- `frontend/src/components/feedback/SchoolLoading.tsx` (réécrit v2, 368 lignes, 4 thèmes)
- `frontend/src/components/feedback/index.ts` (export ajouté)
- Pages (12) : personnel, eleves, finances, evaluations, rapports, statistiques, analytics, securite, laboratoire, stage, parking, etablissement-edit
- Onglets (8) : onglet-absences, onglet-contrat, onglet-edt, onglet-evaluations, onglet-parcours, onglet-matieres, onglet-matieres-planning, onglet-matieres-kanban
- Sections (8) : tab-fonctions, fonction-arbre, tab-niveaux, tab-programme, matiere-detail-page, personnel-detail-page, ModulesTab, SecuriteTab
- Modals (2) : personnel-form-modal, suppression-utilisateur-modal
- `AGENTS.md` (section animations + résumé session)

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

## Travail effectué — Session 2026-07-25 (refonte Notes + Bulletins full-stack)
### Backend — Phase A (16 fichiers modifiés + 1 créé, 0 erreur TS in scope)
- **5 bugs critiques corrigés** : `createBulk` sans `classeAnneeId` ; permissions inexistantes `notes:read`/`bulletins:read` → remplacées par `notes:view`/`bulletins:view` (+ `bulletins:delete` créé et attribué aux 7 rôles ayant `bulletins:generate`) ; SQL brut snake_case → camelCase quoté (`"eleveId"`, `statut::text = ANY($n)`) dans notes-batch-loader, bulletins.service (calculerStatsMatieres), dashboard-dataloader ; `enseignantId` = MembrePersonnel.id (nullable, résolu via `MembrePersonnel.utilisateurId`) ; notes VALIDEE+PUBLIEE comptées dans les moyennes (`In([VALIDEE, PUBLIEE])`).
- **notes.service.ts** : createBulk avec guards (période clôturée, AffectationEleve active batch → 400 avec liste, `notes.allow_bulk_entry` → 403), `notes.validation_levels` config, multi-tenancy findOne/update/remove, `findAll` → `PaginatedResult` + `recherche` ILIKE, nouvelle méthode `getStatistiques` (moyenne/médiane/min/max/écart-type/distribution/parType/parStatut).
- **notes.controller.ts** : perms `notes:view/create/edit/delete/bulk:create/statistiques:view` ; route `/statistiques` AVANT `/:id`.
- **bulletins** : index unique classe `['etablissementId','eleveId','periodeId']` (était mal déclaré au niveau propriété) ; `bulletins.require_validation` (fallback ancienne clé `validation_workflow`, seed corrigé) ; rangs + moyenneClasse/Min/Max renseignées ; `DELETE /:id` (400 si publié) + AuditAction.BULLETIN_DELETE ; **`bulletin.pdf.service.ts` créé** (export HTML A4 imprimable, sans dépendance) ; `GET /:id/export` avant `/:id` ; PATCH `publie:true` exige `bulletins:publier`.
- **Adaptations** : verification-suppression.service (join bulletins↔notes corrigé), portal-parent.service (retour paginé).
- ⚠️ **Migration DB à générer** : enseignantId nullable, index unique bulletin, enum audit BULLETIN_DELETE.

### Frontend — Phase B (3 196 lignes, pattern `utilisateurs`)
- **Notes** : `notes-page.tsx` (DataTable serveur, recherche debounced, 5 filtres collapsibles, badges statut/type, helper `note-couleur.ts` — remplace classes cassées `bg-${color}-100`) ; `notes-saisie-masse-page.tsx` + route `/notes/saisie` (grille tableur, navigation clavier Enter/flèches, validation inline valeur ≤ barème, moyenne prévisionnelle, POST `/api/notes/bulk`, gestion 400 élèves non affectés, cartes < 480px) ; `note-detail-page.tsx` (TabsBar : Informations / Statistiques gated `notes:statistiques:view` / Validation workflow gated `notes:validate`) ; `note-form-modal.tsx` migré BaseFormModal → CustomModal + RHF/zod.
- **Bulletins** : `bulletin-generate-modal.tsx` (nouveau, classe+période → POST `/generate`) ; `bulletins-page.tsx` (DataTable serveur, actions export/delete gated) ; `bulletin-detail-page.tsx` (TabsBar Synthèse/Matières, publier/dépublier, export HTML→print via Blob URL).
- **Hooks** : URLs corrigées (`/en-masse`→`/bulk`, `/generer`→`/generate`, `/statistiques`), PaginatedResult typé, `useHandleError`, invalidations ciblées.
- **Sidebar** : Notes expandable (« Liste » /notes, « Saisie en masse » /notes/saisie gated `notes:bulk:create`) ; prop `permission?` ajoutée à `NavItem`.
- **i18n** : notes.json 126 clés FR+EN, bulletins.json 79 clés FR+EN.
- **Qualité** : 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur, tsc 0 erreur in scope, routeTree régénéré.

### Docs
- Skill `elisaschool-business-logic` : section « Domaine 1 » (notes/bulletins) réécrite avec les règles corrigées.

## Travail effectué — Session 2026-07-25 (hiérarchie v4.1 — audit + intégration Voie A)
### Audit — Verdict
- **Nomenclature TypeRelationHierarchique** : 100% supprimée du runtime (enum varchar DIRECT/FONCTIONNEL sur HierarchiePersonnel). Résidus nettoyés : migration doublon `src/database/migrations/110-consolidation-organisation.sql` supprimée, 4 permissions legacy `HIERARCHIE_VIEW/CREATE/EDIT/DELETE` retirées de `roles.enum.ts` (les granulaires `organisation:hierarchie:read|write|delete` restent), `config.registry.ts` aligné, clés i18n mortes retirées.
- **HierarchiePersonnel** : conservée (conforme grill-me v4.0). Suppression totale NON recommandée — écritures réelles (auto-création contrat, templates, seeds, CRUD REST).
- **Bug sémantique corrigé** : `seed-organisation.ts` et `generation.service.ts` stockaient des ids de **Poste** dans `superieurId` (censé référencer MembrePersonnel) → corruption silencieuse.

### Modèle dual — `superieurPosteId` (nouvelle colonne)
- `HierarchiePersonnel` porte désormais 2 sémantiques explicites :
  - **personne→personne** : `personnelId` + `superieurId` (auto-création via contrat.service)
  - **poste→poste** : `posteId` + `superieurPosteId` (seeds, templates, organigramme)
- DTO : `.refine()` exige (personnelId+superieurId) OU (posteId+superieurPosteId).
- Anti-cycle : nouveau CTE récursif `verifierPasDeCyclePostes` (chaînes de postes), en plus du CTE personnes.
- **Migration 122** (`122-hierarchie-superieur-poste.sql`, idempotente) : ADD COLUMN + index + FK→postes ON DELETE SET NULL + **backfill** (`superieurId` contenant un id de poste → déplacé vers `superieurPosteId`) + backfill `etablissementId` via postes→unités.
- `contrat.service.autoCreerHierarchie` renseigne aussi `superieurPosteId` (affectation active du supérieur).
- `generation.service.supprimerArbreUnites` nettoie aussi `superieurPosteId: In(posteIds)`.

### Frontend — Réintégration page Hiérarchie
- **Sidebar** : « Hiérarchie » réintégré (`/organisation/hierarchie`, icône `ListTree`) entre Organigramme et Nomenclatures.
- **`tab-hierarchie.tsx`** réécrit : zéro UUID affiché — helper partagé `hierarchie-libelles.ts` (`libelleExtremite`, `estRelationPoste`, `uniteRelation`) ; icônes User/Briefcase + sous-labels ; badges typeRelation (DIRECT plein, FONCTIONNEL pointillé), badges statut ; filtres segmentés Tous|Personnes|Postes|DIRECT|FONCTIONNEL (aria-pressed, tactile 44px) ; états vide/erreur+retry.
- **`hierarchie-form-modal.tsx`** réécrit : sélecteur segmenté Personne→Personne / Poste→Poste, selects postes via `useTousPostes()`, validation zod miroir backend (`relationIncomplete`).
- **Organigramme — overlay relations** : nouveau `RelationEdge.tsx` (Bézier pointillé, `--color-accent-600` FONCTIONNEL / `--color-dominant-600` DIRECT, compteur si >1) ; agrégation poste→poste par couples d'unités (même unité ignorée) dans `use-organigramme-flow.ts` ; toggle GitBranch dans la toolbar, état `showRelations` remonté dans `OrganigrammePage`.
- **Hooks** : orphelins `useSuperieurs`/`useSubordonnes` supprimés (+ query keys).
- **i18n** : parité FR/EN complète (statutRelation_*, filtres, modes, relationIncomplete, afficherRelations/masquerRelations, section toasts EN 27 clés).
- **Qualité** : 0 `any` nouveau, 0 couleur hardcodée, 0 UUID exposé, aucune nouvelle erreur tsc (erreurs préexistantes hors périmètre intactes).

## Travail effectué — Session 2026-07-27 (organigramme — export PNG/PDF, edges, toolbar, légende)

### Export PNG/PDF — Bugs critiques corrigés
- **`export-types.ts`** : `estimerExport()` réécrit — le `pixelRatio` effectif est maintenant calculé pour remplir les dimensions du preset de taille (Standard→8K), pas seulement basé sur la qualité. `Math.max(qualite.pixelRatio, ratioPourTaille)` capped à 8.
- **`export.ts`** : `preparerPourExport()` supprime les `<animate>` SVG (animation draw-in des liens hiérarchiques) qui rendaient les edges invisibles si capturés avant la fin de l'animation. Supprime `stroke-dashoffset` et `stroke-dasharray="2000"` (valeurs d'animation uniquement), préserve les dasharray stylés (`8 4`, `3 4`). Résolution des variables CSS pour les styles inline et attributs SVG.
- **Overlay export** : légende avec traits plus épais (2.5/2/2), couleurs plus sombres, dasharray cohérents avec les nouveaux edges.
- **Filtre export** : exclusion controls, minimap, attribution, toolbar.

### Edges — Routing orthogonal (smooth step)
- **`HierarchieEdge.tsx`** v4.0.0 : `getBezierPath()` → `getSmoothStepPath()` (routing orthogonal avec coins arrondis, borderRadius=8, offset=4). Animation SVG `<animate>` supprimée (causait le bug export). Épaisseurs augmentées (2.5/3), couleur `--color-dominant-500` (plus sombre).
- **`RelationEdge.tsx`** v3.0.0 : `getBezierPath()` → `getSmoothStepPath()` (borderRadius=12). Offset différencié par type (fonctionnel=16, direct=8) pour séparer visuellement les edges superposés. Dasharray mis à jour (fonctionnel=`4 5`, direct=`10 5`). Épaisseurs augmentées (2.5/3). Badge agrandi.
- **`use-organigramme-flow.ts`** : couleur marker hiérarchie `--color-dominant-500` (était `-400`), taille markers augmentée (14/16).

### Toolbar et légende — UX améliorée
- **`OrganigrammeToolbar.tsx`** v4.0.0 :
  - Légende popup : animation Framer Motion (AnimatePresence + opacity/y/scale), click-outside-to-close (mousedown listener), fermeture Escape, ref pour détection clic extérieur.
  - Helper `sep()` pour les séparateurs (JSX plus propre).
  - `toggleBtnClass()` pour boutons actif/inactif.
  - `flex-wrap` pour responsive.
  - Légende SVG : traits plus épais (2.5/2/2), viewBox 36×10, dasharray cohérents avec les nouveaux edges.

### Couleur relation directe — différenciée du vert (feedback utilisateur)
- **Canon couleurs liens** : hiérarchie = vert `--color-dominant-500/600`, relation DIRECTE = ambre `--color-secondary-500` (#f59e0b, retenu vs -600 #ffc107 trop clair), relation FONCTIONNELLE = bleu `--color-accent-600`.
- Sites modifiés (5) : `RelationEdge.tsx:45` (stroke+badge+tooltip), `use-organigramme-flow.ts:73` (marker flèche), `RelationDetailDrawer.tsx:72-73` (couleur + fond `--color-secondary-50`), `OrganigrammeToolbar.tsx` (légende SVG), `export.ts` (`COULEURS_EXPORT.secondary` #f59e0b + légende overlay, dasharray alignés `10 5`/`4 5`).
- Badges `tab-hierarchie.tsx` : variants génériques Badge, pas de vert codé — inchangés.

### Qualité
- 0 `any` nouveau, 0 couleur hardcodée, 0 chaîne FR en dur.
- `tsc --noEmit` : 0 erreur in-scope.
- 5 fichiers modifiés (export-types.ts déjà committé dans b340a14).

## Travail effectué — Session 2026-07-27 (suite — export v2 : presets, estimation réaliste, fix fill noir)

### Presets de taille/qualité v2 (`export-types.ts` v2.0.0, réécrit)
- **Tailles** : modèle `bordLong` (px du bord le plus long, agnostique de l'orientation), strictement croissantes, résolutions standard web : `hd` 1280 → `full-hd` 1920 → `qhd` 2560 → `4k` 3840 → `8k` 7680. Remplace moyen/grand/tres-grand (carrés incohérents, non croissants vs 4k/8k).
- **Qualités** : `facteur` = fraction de la taille cible (minimale 0.25 / reduite 0.5 / equilibree 0.75 / maximale 1.0). La taille sélectionnée est un plafond dur jamais dépassé — l'ancien `Math.max(qualite.pixelRatio, ratioPourTaille)` permettait à la qualité de dépasser la taille (source de l'incohérence estimation/fichier).
- **Estimation réaliste** : `OCTETS_PAR_PIXEL_PNG = 0.12` (empirique diagrammes aplats post-deflate) remplace 4 o/px RGBA brut (surestimait ~30× — le fameux "69 Mo"). `pixelRatio = min(ratioCible × facteur, 8)`. Dimensions estimées = dimensions exactes de sortie.
- **Défauts ExportDialog** : `qhd` + `maximale`. `formatTaille` affiné (Go/Mo 0-1 décimale/Ko min 1). Tooltips `title` via clés i18n `taille_*_desc` / `qualite_*_desc`.
- **i18n FR+EN** : anciennes clés supprimées, nouvelles clés + descriptions ajoutées (`organisation.json` bloc `organigramme.export`).

### Fix remplissage noir des liens hiérarchiques à l'export
- **Cause racine** : le path visible de `HierarchieEdge` dépendait de la classe CSS `.react-flow__edge-path` pour `fill: none` ; cette règle est perdue lors de la sérialisation SVG de html-to-image → les paths smoothstep à angles sont remplis en noir. `RelationEdge` avait déjà `fill="none"` explicite (d'où l'export correct des relations directes).
- **Double fix** : (1) `HierarchieEdge.tsx` — attribut `fill="none"` explicite sur le path visible ; (2) `export.ts` `preparerPourExport()` — normalisation défensive `setAttribute('fill','none')` sur tout path de `.react-flow__edges` / `.react-flow__edge` sans attribut fill.

### Légende PDF alignée sur le canon couleurs
- **`export-pdf.ts`** : `dominantLight` supprimé, `secondary: '#f59e0b'` ajouté. Légende : Hiérarchie=vert plein, Rel. directe=ambre pointillé, Rel. fonctionnelle=bleu pointillé.

### Qualité
- 0 `any`, 0 couleur hardcodée hors palettes export dédiées, i18n FR/EN complet, `tsc --noEmit` 0 erreur in-scope.

## Travail effectué — Session 2026-07-27 (suite 2 — export : légendes thème, toast taille réelle, stabilisation DOM, plafond canvas)

### Légendes PNG/PDF alignées sur le thème actif
- **`css-var-resolver.ts`** : `normaliserCouleurHex(cssColor, fallback)` — normalisation via canvas 2D `fillStyle` (gère oklch/rgb/noms → `#rrggbb` ; fallback posé avant pour que toute valeur invalide retombe dessus).
- **`export.ts`** : `resoudreCouleursLiens()` résout à l'export `--color-dominant-500` (hiérarchie), `--color-secondary-500` (directe), `--color-accent-600` (fonctionnelle) — fallbacks canon #28a745/#f59e0b/#007bff. Injecté dans l'overlay PNG (`creerOverlay`) ET le PDF (`PdfOptions.couleursLegende`). `COULEURS_EXPORT`/`COULEURS_PDF` : couleurs de liens hardcodées supprimées (seuls les neutres restent).

### Toast post-export avec taille réelle
- **`exporterOrganigramme` → `ResultatExport | null`** : `{ format, tailleOctets, largeurPx, hauteurPx }`. PNG : octets du dataUrl (`base64.length × 0.75`) ; PDF : `exporterPdfJsPdf` retourne `Promise<number>` via `doc.output('blob').size`.
- **`ExportDialog.tsx`** : `toast.success` sonner (format + dimensions réelles + taille réelle formatée), `toast.error` en échec. `formatTaille` extrait hors composant. Clés i18n FR/EN : `exportReussi`, `exportDetail`, `exportEchec`, `resolutionPlafonnee`.

### Stabilisation DOM (portée « Tout déplié »)
- **`attendreStabilisationDom(element, calmeMs=250, timeoutMs=3000)`** : MutationObserver debouncé remplace le `setTimeout(600)` fixe après le dispatch `expand-all` — capture uniquement quand ReactFlow a fini de re-layouter.

### Plafond dimension canvas
- **`export-types.ts`** : `DIMENSION_MAX_PX = 16384` ; `pixelRatio = min(demandé, PIXEL_RATIO_MAX=8, plafondCanvas)` ; `EstimationExport.plafonne` → avertissement « Résolution plafonnée (limite navigateur) » dans le bloc estimation du dialog.

### Reco 4 (PDF côté serveur) — reportée, justifiée
- La capture pixel-fidèle de ReactFlow exige le DOM client (layout dagre, CSS vars thème, fonts). Pas de navigateur headless dans la stack backend ; un rendu serveur divergerait du rendu écran. Statu quo client-side assumé.

### Qualité
- 0 `any`, 0 couleur hardcodée hors fallbacks canon, i18n FR/EN complet, `tsc --noEmit` 0 erreur in-scope.

## Travail effectué — Session 2026-07-27 (suite 3 — export v3 : 20K px, orientation, dédup PDF, minimap, progression)

### Presets 20 000 px + double plafond canvas (`export-types.ts` v3.0.0)
- Presets ajoutés : `16k` (15 360 px) et `ultra` (20 480 px). `DIMENSION_MAX_PX = 20480`.
- **Nouveau plafond surface** `SURFACE_MAX_PX = 268_000_000` (limite d'AIRE Chrome ~268 Mpx, distincte de la limite de bord) : `pixelRatio = min(demandé, DIMENSION_MAX/bordLong, sqrt(SURFACE_MAX/surface))`. `plafonne` couvre les deux plafonds.

### Orientation paysage/portrait (PDF)
- `OrientationExport = 'paysage' | 'portrait'` dans `ExportOptions`. `export-pdf.ts` v2.0.0 : `getPageDimensions(format, orientation)` swap min/max des dims PAGE_FORMATS (stockées portrait). Sélecteur segmenté dans ExportDialog (RectangleHorizontal/RectangleVertical), visible uniquement en PDF.

### Dédup PDF titre/établissement/date/légende (fix redondance)
- **Overlay incrusté uniquement pour le PNG** (`capturerElement` : `options.format === 'png'`) ; le PDF reçoit une image nue et jsPDF dessine son propre en-tête (hauteur dynamique : titre 14pt + établissement 10pt + date 8pt, séparateur conditionnel), sa légende (alignée droite via `doc.getTextWidth`, dash `[3,1]`/`[1,1]`) et son footer.
- **Titre document** (recherche web) : « Organigramme hiérarchique et fonctionnel » (`titreDocument` i18n) + nom établissement en sous-ligne. `ExportOptions.titre` + `nomEtablissement` séparés.

### Minimap : toggle export + label accessible
- `ExportOptions.inclureMinimap` (défaut false) → filtre toPng `return options.inclureMinimap` sur `.react-flow__minimap`. Checkbox « Vue miniature (minimap) » dans Inclusions. ⚠️ La minimap n'est rendue que ≥1280px (`isDesktop`) — le toggle n'a d'effet que sur desktop.
- `MiniMap ariaLabel={t('organigramme.flow.minimapLabel')}` : « Vue miniature de l'organigramme » / "Organization chart overview map".

### Progression d'export par étapes
- `EtapeExport = 'preparation' | 'depliage' | 'capture' | 'generation' | 'telechargement'` ; `exporterOrganigramme(elementId, options, onProgress?, libellesLegende?)` émet chaque étape. UI : barre `role="status" aria-live="polite"`, pourcentages indicatifs (10/25/55/85/95), fieldsets/boutons `disabled` pendant l'export, fermeture modal bloquée.
- `LibellesLegende` injecté depuis React (t()) avec défauts FR — utils restent sans dépendance React.
- Stabilisation DOM « tout déplié » : `attendreStabilisationDom` (MutationObserver, calme 250ms, plafond 3s), collapse-all en `finally`.

### Fichiers
- `export-types.ts` v3.0.0, `export.ts` v4.0.0, `export-pdf.ts` v2.0.0, `ExportDialog.tsx` v3.0.0, `OrganigrammeFlowView.tsx` (ariaLabel), locales FR/EN (`organigramme.export` + `organigramme.flow.minimapLabel`).

### Qualité
- 0 `any`, 0 couleur hardcodée hors palettes export, i18n FR/EN parité, `tsc --noEmit` 0 erreur in-scope, JSON locales valides.

## Travail effectué — Session 2026-07-27 (grill-me RH : contrats, personnel, paie, organisation)

### 4 arbitrages validés puis implémentés
1. **Workflow validation effectif** : `validationWorkflowService` dispatch réellement sur l'entité (statut EN_ATTENTE_VALIDATION → ACTIF/REJETE appliqué à ContratPersonnel/BulletinPaie/MembrePersonnel), plus de workflow orphelin.
2. **Transplantation frontend contrats/paie** : pages listes + détails alignées sur le pattern `utilisateurs` (PageHeader gradient, DataTable serveur, TabsBar `?tab=`, modals CustomModal + RHF/zod).
3. **Multi-occupants unifié** : `Poste.nombrePostes` + affectations actives comptées, helper partagé de capacité (backend + frontend), fin de la double logique estSuppleant/occupant.
4. **Soft delete complet RH** : `@DeleteDateColumn()` sur MembrePersonnel, ContratPersonnel et entités paie ; suppressions REST → soft delete ; requêtes filtrent nativement.

### P0 backend paie
- Calcul bulletin corrigé (gains/retenues via ElementSalaire, decimals `numericTransformer`), POST bulletins avec garde période/doublon, audit actions paie.
- `typeContrat` = nomenclature dynamique `TypeContratPersonnalise` (plus d'enum figé) ; mode rémunération = FK `ModeRemunerationEntity` (source unique).

### P1 sécurité
- Fuites cross-tenant colmatées (etablissementId forcé depuis le token sur services contrats/paie/personnel).
- RBAC : `requireAnyPermission(...)` là où un OR de permissions est légitime (plus de bypass par permission grossière).

### Hygiène (task 8)
- **i18n personnel** : parité FR/EN stricte vérifiée par script (`personnel-detail-page`, `heure-cours-form-modal`, `personnel-page`, clés heuresCours).
- **`Fonction.chemin` harmonisé** : convention unique service = segments **ids** séparés par **`.`** (`parentChemin.id`, racine = id seul). `seed-organisation.ts` réaligné (pattern save deux temps + `cheminsMap` code→chemin) avec réalignement idempotent des chemins legacy `parentId/CODE` via `cheminAttendu`. Vérifié : le champ n'est jamais requêté (pas de LIKE).
- **Migration `029-paie-etendue.sql` réécrite v3.0** : 4 défauts corrigés — FK vers table inexistante `bulletin_paies` → **`bulletins_paie`** ; colonnes snake_case → camelCase quoté aligné entités (`"bulletinPaieId"`, `"tauxPatronal"`, `"typeCalcul"`, `"montantMax"`) ; UNIQUE global sur `code` → index composite `(code, "etablissementId")` ; INSERTs seeds SQL supprimés (violaient NOT NULL etablissementId — gérés par `seed-cotisations.ts`/`seed-types-primes.ts`). Bloc `DO $$` idempotent de rattrapage v2 (RENAME COLUMN + DROP `*_code_key`). ✅ appliquée en local.

### Docs
- Skill `elisaschool-business-logic` : **Domaine 12 RH** ajouté (workflow effectif, multi-occupants, soft delete, nomenclatures dynamiques, convention chemin, migration 029 v3.0, anti-patterns).

### Qualité
- 0 `any` nouveau, 0 couleur hardcodée nouvelle, i18n FR/EN parité, `tsc --noEmit` 0 erreur in-scope, multi-tenant strict.

## Travail effectué — Session 2026-07-27 (grill-me RH — frontend personnel)

### 4 arbitrages validés (confirmés)
1. **Historiser** : affecterEnseignant désactive l'ancienne affectation + crée une nouvelle ligne
2. **Blocage strict** : 400 si membre inexistant / pas de contrat actif / pas ENSEIGNANT
3. **Fusion EDT + suppression documents** : un seul onglet EDT, suppression de la vue hebdomadaire dupliquée
4. **Sous-menu RH sidebar** : entrée expandable « Ressources humaines »

### Corrections frontend (6 fichiers)
- **`personnel-page.tsx`** : `window.location.href` → `navigate()` (TanStack Router)
- **`heure-cours-form-modal.tsx`** : champs UUID brut → selects (classeAnneeId, matiereId, salleId, remplacantId)
- **`personnel-detail-page.tsx`** : 90+ couleurs hardcodées → CSS vars, onglet documents mort supprimé, chaînes FR → `t()`, deep-linking `?tab=`
- **`tab-heure-cours.tsx`** : vue hebdomadaire supprimée (doublon EDT dédié), 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur, 6 nouvelles clés i18n FR+EN
- **`Sidebar.tsx`** : Personnel/Contrats/Paie groupés sous « Ressources humaines » (expandable, icône UserCheck, permissions granulaires par enfant)
- **`personnel.types.ts`** : `PostePartial` dupliqué supprimé (import depuis contrats), `PersonnelFormData` interface ajoutée, `fromFormToCreateDto` typé proprement
- **`use-personnel.ts`** : 8 `any` éliminés (params query, error handlers, mutation types)

### i18n
- 6 nouvelles clés `heuresCours.*` dans `fr/personnel.json` et `en/personnel.json` (aucunCreneauEdt, generationReussie, erreurGeneration, coursAjoute, coursMisAJour, genererDepuisEdt)

### Qualité
- 0 `any` dans personnel.types.ts, use-personnel.ts, tab-heure-cours.tsx
- 0 couleur hardcodée dans personnel-detail-page.tsx, tab-heure-cours.tsx
- 0 chaîne FR en dur dans tab-heure-cours.tsx

## Travail effectué — Session 2026-07-27 (grill-me RH — audit qualité frontend personnel/contrats/paie)

### Audit qualité — 82 problèmes résolus
- **36 `any`** éliminés dans 10 fichiers (hooks, modals, types, pages)
- **30 couleurs hardcodées** remplacées par CSS vars (`bg-muted`, `border-border`, `text-secondary`, `text-muted-foreground`)
- **16 chaînes FR hardcodées** remplacées par `t()` (i18n)

### Fichiers corrigés (10)
- **personnel-form-modal.tsx** : `useState<FormState>` typé, submit via `fromFormToCreateDto()`, import `CreerPersonnelDto` supprimé
- **cotisation-modal.tsx** : `FORM_INIT: CotisationFormData`, cast `as CotisationFormData['type']` sur select onChange
- **prime-modal.tsx** : `FORM_INIT: PrimeFormData`, cast `as PrimeFormData['typeCalcul']`
- **retenue-modal.tsx** : `FORM_INIT: RetenueFormData`, cast `as RetenueFormData['frequence']`
- **use-heure-cours.ts** : annotations `Promise<T>` explicites supprimées des queryFn (inférence TypeScript)
- **use-contrats.ts** : 8 `any` → types propres (`ContratPersonnel`, `PaginatedResult`, `ApiResponse<T>`)
- **use-paie.ts** (frontend) : 6 `any` → typage propre
- **contrats-page.tsx** : 12 couleurs hardcodées → CSS vars, 4 chaînes FR → `t()`
- **paie-page.tsx** : 10 couleurs hardcodées → CSS vars, 6 chaînes FR → `t()`
- **bulletin-form-modal.tsx** : 8 `any` → types propres, 6 couleurs → CSS vars

### Backend — 2 bugs corrigés (suivi-personnel)
- **`suivi-personnel.controller.ts`** : `getDashboardPersonnel` attendait 3 args (ajout `anneeScolaireId` depuis query params avec garde 400)
- **`cron-jobs.ts`** : `statut: 'ACTIF'` → `StatutPersonnel.ACTIF` (enum importé)

### Compilation vérifiée
- **Frontend** : 0 erreur dans personnel/contrats/paie/organisation (54 erreurs préexistantes dans d'autres modules)
- **Backend** : 0 erreur dans personnel/organisation/paie/heures-cours/contrats/suivi-personnel (311 erreurs préexistantes dans d'autres modules)
- **101 fichiers modifiés** au total (+3822/-4194 lignes)

## Travail effectué — Session 2026-07-29 (grill-me RH — Groupe D backend + élimination `as any`)

### Groupe D — Backend fixes (88 corrections)

**D1 — Soft delete `@DeleteDateColumn()` (13 entités)** :
- Personnel (6) : `absence-personnel`, `evaluation-enseignant`, `heure-cours`, `affectation-poste`, `progression-programme`, `indisponibilite-enseignant`
- Paie (4) : `cotisation`, `type-prime`, `type-retenue`, `element-salaire`
- Organisation (3) : `unite-organisationnelle`, `poste`, `hierarchie-personnel`
- Exclusion : nomenclatures (EchelonStructurel, NiveauResponsabilite, ModeRemunerationEntity, Fonction, TemplateOrganisation, TypeContratPersonnalise) → hard delete + `estSysteme`

**D2 — `req?: any` → `req?: Request` (60 replacements, 16 fichiers)** :
- auth (3 fichiers), personnel (7 fichiers), programmes (1 fichier), paie (5 fichiers)

**D3 — Date `as any` casts (13 fixes, 3 fichiers)** :
- `heure-cours.service.ts` : 7 fixes (DTO mutation → `dateChanges` pattern, `Between()` sans cast)
- `contrat.service.ts` : 4 fixes (DTO mutation → `dateChanges`, `LessThanOrEqual()` sans cast, `null as any` → `undefined`)
- `affectation.service.ts` : 3 fixes (DTO mutation → `dateChanges`, `LessThanOrEqual()` sans cast)

**D4 — `as any[]` casts (2 fixes, 1 fichier)** :
- `calcul-paie.service.ts` : `[] as any[]` → `[] as DetailMatiereSimulation[]`

### Élimination `as any` audit-related (7 occurrences, 2 fichiers)
- `type-contrat.service.ts` : 5× `'TYPE_CONTRAT_*' as any` → `AuditAction.TYPE_CONTRAT_*`
- `absence-personnel.service.ts` : `dto.type as any` → `dto.type as TypeAbsencePersonnel`, `dto as any` → `dto as Record<string, any>`

### Documentation mise à jour
- **`elisaschool-conventions.md`** : section 24 ajoutée (conventions typage : req Request, DTO date anti-pattern, AuditAction enum, soft delete, FindOperator)
- **`elisaschool-business-logic/SKILL.md`** : Domaine 15 ajouté (soft delete convention + audit logging)

### Qualité
- **0 `as any`** dans personnel/services/, paie/services/, organisation/services/
- **0 erreur TS** introduite (8 erreurs préexistantes hors périmètre)
- **Migration DB requise** : ajouter `deletedAt` columns sur les 13 nouvelles entités avant déploiement

## Next Move
Indicateur de connexion réseau : ✅ implémenté (juillet 2026).
Workflow de validation multi-niveaux (Option B) : ✅ intégré dans 6 pages détail (juillet 2026).
1. **Tests** : ✅ phase complète le 2026-08-03 — **130/130 verts** (14 suites : matérialisation Q7, Canal A, Q6-C, `updateCreneau`, cron EDT, 3 suites réparées).
2. **Migrations 122–145** : ✅ script `backend/scripts/apply-migrations-122-145.sh` prêt et vérifié (24/24 verts, idempotent, 2 passages OK en local le 2026-08-03). ⚠️ Ordre : la 139 (index unique heures_cours) référence `deletedAt` → appliquer la 141 (soft delete) AVANT la 139 (géré par le script). Garde 128 : skip automatique si volume horaire déjà en minutes (max > 48). Usage : `DB_HOST=... DB_PORT=... DB_USER=... DB_NAME=... DB_PASSWORD=... ./scripts/apply-migrations-122-145.sh` (le port 7002 est exposé sur l'hôte). **Corrections apportées au passage** (les migrations n'avaient jamais été exécutées en base — bugs détectés par le test local) : 138 + 142 → colonnes `action`/`libelle` NOT NULL ajoutées (convention rbac.seed : module=1er segment, action=reste), `role_id`→`"roleId"`/`"permissionId"` (camelCase), 142 sans `createdAt` (colonne inexistante) ; 144 → FK/CHECK idempotents (DROP IF EXISTS) + `parametres_systeme` corrigé (typeValeur/categorie/modifiableRuntime/visible/ordre, type inexistant supprimé) ; 145 → INSERT sans `"categorie"` (colonne inexistante) + garde WHERE NOT EXISTS ajoutée (doublon supprimé). Normalisation 2026-08-03 : `142-network-permissions.sql` + `143-heure-cours-updated-at.sql` déplacées de `src/database/migrations/` → `database/migrations/` ; legacy `139-workflows-validation` → **144-workflows-validation.sql**, `140-audit-enum-*` → **145-audit-enum-competences-apparence-groupes-finances.sql** (collision levée, déjà appliquées en base) ; doublons superseded supprimés (`141-soft-delete-columns`, `111`–`115` legacy refonte v2 — la 112/115 référençaient TypePersonnel supprimé).
3. ✅ **Migration soft delete créée** : `141-soft-delete-rh-organisation.sql` (19 tables, idempotente, appliquée en local le 2026-08-03).
4. ✅ **Audit logging bulletins** : déjà présent (`bulletin-paie.service.ts`, 8 appels CREATE/UPDATE/DELETE/GENERATE/PUBLIE).
5. ✅ **Instrumentation** : absence-personnel (4 actions), evaluation.service (3 actions), progression-programme.service (3 actions) — toutes présentes. `indisponibilite-enseignant` = entité sans service (inerte).
6. **Lancement tests** : `JWT_SECRET=<32+ chars> ENCRYPTION_KEY=<32 chars> npx jest` depuis `backend/` (le `.env` local a `JWT_SECRET=""` → parse zod échoue → fallback `dev_password`). Suite complète ~60s en parallèle.

## Travail effectué — Session 2026-08-03 (phase Tests — 108/108 verts)

### Contexte
Phase Tests après stabilisation Q7/Q8 : 2 suites unitaires nouvelles (matérialisation + Canal A), 3 suites préexistantes réparées (refactoring v5.0 + API modifiées), config jest ajustée.

### Nouveaux tests (2 fichiers, 17 tests)
- **`test/unit/heure-cours-materialisation.spec.ts`** (12 tests) : `materialiserInstances` — filtre `genereAutomatiquement = true` + `statut = VALIDE` (assertions sur `andWhere`) ; 1 occurrence/semaine dans la plage (2 semaines → 2 instances, champs `create` vérifiés dont date du MARDI) ; bornage de plage (occurrence S+2 ignorée) ; anti-doublon `findOne` → skip ; conflit enseignant `getCount > 0` → skip ; affectation incomplète → skip ; aucun créneau → 0/0 ; 2 créneaux → 4 instances. `materialiserSemainesCourantes` — hors année (spy non appelé) ; délégation avec `respecterFlagAuto:true` + plage S→S+1 ; clamp fin de plage à `dateFin` de l'année ; `findOne` with where-array EN_COURS + `order dateDebut DESC`.
- **`test/unit/emploi-du-temps-canal-a.spec.ts`** (5 tests) : `validerCreneau` — flag=true → save VALIDE + `materialiserSemainesCourantes({creneauIds:[id]})` ; flag=false → PAS de matérialisation ; statut≠PLANIFIE → 400 `STATUT_INVALIDE`. `validerCreneauxClasse` — `idsAuto` seulement (flag false exclu, autre classe exclue), `whereInIds` + update ; aucune classe → 0/0 sans requête.

### Pattern mock (documenté)
- **Mock partagé** : `const mockRepo = {...}` (variable préfixée `mock*` autorisée par le hoisting jest) + `getRepository: jest.fn(() => mockRepo)` → `this.repo` ET `edtRepo` sont le même objet → configuration unique des `findOne`/`createQueryBuilder`.
- **QB unique** : `qbMock({getMany, getCount})` + `repo.createQueryBuilder.mockReturnValue(qb)` — un seul QB porte les deux méthodes (`mockReturnValueOnce` en séquence = fragile, éviter).
- **Dates en TZ locale** : `lundiDeSemaine()` → minuit LOCAL (WAT UTC+1) → `toISOString()` décale d'un jour. Helper `isoLocal(d)` (getFullYear/getMonth/getDate) — jamais `toISOString()` pour les dates calculées localement.
- **AppError** : champs `statusCode`/`code` (pas `status`).
- **Aliases** : `jest.mock('@modules/...')` toujours (les chemins relatifs se résolvent depuis le fichier de TEST).

### Suites préexistantes réparées (3 fichiers)
- **`test/unit/fonctions.service.spec.ts`** : chemin `@modules/fonctions/...` → `@modules/organisation/services/fonctions.service` (refactoring v5.0) + mock `@modules/auth` (auditService). 4/4.
- **`test/multi-tenant-isolation.test.ts`** : `beforeAll` idempotent (nettoyage competences→specialites→filieres→établissements TEST-001/002 — `delete({})` interdit en TypeORM → `createQueryBuilder().delete().execute()` ; l'`afterAll` d'origine a TOUJOURS échoué, cause cachée de la non-idempotence) ; `result.data.filter` → `result.items.filter` (PaginatedResult) ; beforeEach Spécialité nettoie spécialités+filieres (FK) ; test CASCADE adapté : la FK `filieres.etablissementId` est RESTRICT (pas ON DELETE CASCADE) → le test vérifie le BLOCAGE + l'intégrité (pas de changement de modèle). 13/13.
- **`test/integration/configuration-multi-tenant.spec.ts`** : faux UUID `test-etablissement-uuid-123` → UUID réel (colonne `uuid`) ; `etablissementId` `undefined` → `toBeFalsy()` (le service retourne null) ; reset override : global créé avec valeur distincte avant l'override (fallback vérifiable) ; reset global : `valeurDefaut` posée via le repo avant reset (le service exige `NO_DEFAULT_VALUE` sinon). 16/16.

### Config jest (`jest.config.ts`)
- `testTimeout: 30000` (avantAll integration DB > 5s par défaut → timeouts).
- `testPathIgnorePatterns: ['<rootDir>/tests/integration/']` : `corrections-academique.test.ts` est un script autonome (runTests + process.exit, zéro describe/it) — lancé via tsx, pas jest.

### Environnement (important)
- Le `.env` local a `JWT_SECRET=""` → parse zod échoue → fallback dev (`DB_PASSWORD=dev_password` → échec auth DB). Lancer les tests avec : `JWT_SECRET=... ENCRYPTION_KEY=... npx jest`.
- `delete({})` est refusé par TypeORM — `createQueryBuilder().delete().execute()` à la place.
- Résultat final : `npx jest` complet = **108 passés / 108** (11 suites), exit 0.

## Travail effectué — Session 2026-08-03 (suite — tests Q6-C + cron : 130/130 verts)

### Contexte
Complément de la phase Tests : couverture unitaire Q6-C (propagation instance→créneau), `updateCreneau` (dry-run/409/force) et cron-jobs EDT (logique pure). Suite complète = **130/130 verts** (14 suites, ~60s parallèle).

### Nouveaux tests (3 fichiers, 22 tests)
- **`test/unit/heure-cours-q6c.spec.ts`** (9 tests) : `HeureCoursService.update` — sans `mettreAJourCreneau` → ni créneau ni propagation ; `mettreAJourCreneau:true` → creneauRepo.findOne (where `{id, etablissementId}` + relations) + spy `propagerModificationCreneau` appelé avec `{force:true, createurId, excludeInstanceIds:[hc.id]}` et changements `{jour:'LUNDI', heureDebut, heureFin}` ; sans créneauId → rapport absent, findOne 1 seul appel (garde dans `update()`, le retour vide d'`appliquerModificationAuCreneau` est défensif) ; 404 `CRENEAU_NOT_FOUND` ; 400 `JOUR_INVALIDE` (dimanche 2026-08-02) ; 409 `CONFLITS_CRENEAU` (severite BLOQUANT) sans écriture ; gardes REMPLACE `REMPLACANT_REQUIS` / `REMPLACANT_INVALIDE` ; 409 `CRENEAU_CONFLIT` au niveau instance (QB `getMany` overlap même enseignant/classe/salle).
- **`test/unit/emploi-du-temps-update-creneau.spec.ts`** (5 tests) : `updateCreneau` — notes seules → save sans propagation ; 409 `CONFLITS_CRENEAU` bloquant sans écriture ; dry-run : `propagerModificationCreneau` appelé 1× avec `{dryRun:true, force:undefined}` puis 409 `CONFLITS_PROPAGATION` avec `details.rapport` ; `propagerForce:true` → save + 2 appels (dry-run force:true puis réel `{force:true, createurId}`) ; sans conflits → dry-run puis propagation réelle, rapport retourné, changements `{jour, heureDebut, heureFin, salleId, typeCreneau}` vérifiés. Mock `@modules/personnel/services` (heureCoursService) + `@modules/matieres/services/coefficient-resolver.service` + `@modules/salles/services/salle-availability.service` + `config.helper`.
- **`test/unit/emploi-du-temps-cron.spec.ts`** (8 tests) : `materialiserSiNecessaire` — préférence créée par défaut (SAMEDI 21:00) + `materialiserSemainesCourantes({etablissementId})` ; config inactive → rien ; horaire non correspondant → rien ; garde journalière (Map module-level — **ids d'établissement uniques par test**, la Map persiste entre les tests) ; garde par établissement ; `DEFAULT_MATERIALISATION_AUTO` ; `initEmploiDuTempsCronJobs` — `cron.schedule('* * * * *', fn, {timezone:'Africa/Douala'})` capturé puis handler exécuté : try/catch par établissement (etab qui rejette ne bloque pas le suivant). Fake timers : `jest.useFakeTimers().setSystemTime(new Date('2026-08-08T21:00:00'))` — machine en WAT = Africa/Douala, pas de décalage.

### Pièges rencontrés
- **Cycle d'import** : `cron-jobs.ts` importe `./entities` → cascade creneau-horaire → affectation-matiere → classes → personnel → heure-cours → `TypeCreneau` undefined (barrel en cours d'évaluation) → crash `default: TypeCreneau.COURS`. Fix : `jest.mock('@modules/emploi-du-temps/entities', ...)` avec `JourSemaine` mocké (seul usage runtime) — la chaîne d'entités réelles n'est plus importée.
- **Spy sur méthode privée** : `jest.spyOn(service as any, 'propagerModificationCreneau')` (prototype method) au lieu d'imports fantômes.
- **Garde journalière** : Map module-level jamais réinitialisée → `jest.clearAllMocks()` ne la vide pas → ids d'établissement uniques par test.

### Qualité
- `npx tsc --noEmit` backend : 297 erreurs préexistantes inchangées (hors périmètre), **0 nouvelle** (dont cron-jobs EDT exporté `materialiserSiNecessaire`).
- Résultat final : `npx jest` complet = **130 passés / 130** (14 suites), exit 0.

## Travail effectué — Session 2026-07-25 (grill-me organisation — UX, permissions, organigramme)
### Décisions validées
- **Clic sur lien organigramme** = drawer détail + surbrillance des extrémités + tooltip au survol (options 1+2+4).
- **ENSEIGNANT / ELEVE / PARENT** : `organisation:organigramme:read` UNIQUEMENT (aucune autre page organisation).
- **Multi-casquettes enseignant** : élévation via attribution manuelle admin + enrichissement du rôle COORDINATEUR_DISCIPLINE (lecture organisation complète).

### Phase 1 — Fixes P0
- `onToggleRelations` câblé correctement (toolbar → OrganigrammePage), toggle relations fonctionnel.

### Phase 2 — Permissions & rôles (migration 125)
- **`125-organigramme-read-tous-roles.sql`** (idempotente ON CONFLICT/NOT EXISTS) : crée `organisation:organigramme:read` et l'attribue à TOUS les rôles ; CENSEUR + COORDINATEUR_DISCIPLINE reçoivent la lecture organisation complète (`organisation:*:read`).
- `roles.enum.ts` (`DEFAULT_ROLE_PERMISSIONS`) aligné : ENSEIGNANT/ELEVE/PARENT organigramme-only.

### Phase 3 — Liens organigramme cliquables
- **`organigramme/drawer/RelationDetailDrawer.tsx`** (nouveau) : drawer détail relation (type, extrémités, unités, statut, compteur agrégé).
- Clic sur `RelationEdge` → ouvre le drawer + surbrillance des nœuds source/cible ; tooltip au survol de l'edge.
- `use-organigramme-flow.ts` : relations poste→poste remappées vers l'ancêtre visible quand une unité est repliée (les edges ne disparaissent plus au collapse).

### Phase 4 — Bugs P1 backend (migration 126)
- **Enum `postes_statut_enum` = MAJUSCULES** ('ACTIF'/'VACANT'/'SUPPRIME'/'EN_ATTENTE') — la migration 120 comparait en minuscules → vues matérialisées silencieusement vides.
- **`126-fix-vues-materialisees-statuts.sql`** : recrée `mv_stats_organisation` + `mv_postes_vacants_critiques` avec valeurs UPPERCASE, alias snake_case `etablissement_id`, sous-agrégat hiérarchie (au lieu du join multiplicateur).
- **Backfill** : 26 lignes `postes` corrigées (occupantsCount/statut, cast `::postes_statut_enum`).
- `organigramme.pdf.service.ts` + statistiques : coercions/adaptations post-v4 ; DTO template : `z.nativeEnum` pour les facettes.
- ⚠️ **Accès Postgres** : `docker exec elisaschool_db psql -h 127.0.0.1 -p 7002 -U elisaschool_user -d elisaschool` (port 7002 DANS le conteneur).

### Phase 5 — Icônes & polish UX
- **Canon icônes appliqué** (voir section Icônes plus haut) : Link2=relations hiérarchiques (5 sites : toolbar, RelationDetailDrawer, badge FONCTIONNEL tab-hierarchie, hierarchie-form-modal, StatCard synthèse), Maximize=fit-view (Maximize2/Minimize2 réservés plein écran), Wallet remplace DollarSign (3 sites), Workflow remplace Briefcase pour les fonctions (6 sites), Route=Spécialités sidebar (dédup GitBranch). GitBranch conservé pour les contextes structurels (Sidebar Unités, UniteDetailDrawer).
- **Deep-linking `?tab=`** ajouté aux 3 pages détail organisation (fonction/unite/poste) — pattern utilisateurs : `useSearch({ from: routeId }) as { tab?: string }` + `navigate({ search: { tab } as never })` (`as never`, jamais `as any`).
- **`use-templates.ts` corrigé** (2 bugs) : `apiClient.get(url, params)` — le 2e argument EST le record de params (pas `{ params }`) ; générique = type interne (ApiResponse wrappe déjà dans `.data`, ne pas double-wrapper `{ data: X }`).
- `#fff` explicitement accepté (pas de var `--color-text-inverse` — ne pas inventer de CSS vars).

### Qualité
- **0 erreur tsc in-scope** (features/organisation, fonctions, postes, Sidebar, organigramme). Erreurs préexistantes hors périmètre intactes (ex : `unauthorized-page.tsx` route `/communication`).
- 0 `any` nouveau, 0 couleur hardcodée nouvelle, i18n complet.
- Migrations 125 + 126 appliquées en local. Reste : staging/prod.

## Travail effectué — Session 2026-07-25 (fix 431 + walkthrough API notes/bulletins)
### Bug HTTP 431 — permissions retirées du JWT
- **Cause** : claim `permissions` (~12KB pour SUPER_ADMIN) → token 16 453 octets > limite header Node 16KB.
- **Fix** : permissions supprimées des 4 sites de construction JWT (`auth.service.ts` login+refresh, `etablissement-selection.service.ts` completeLogin+temp). `authMiddleware`/`optionalAuthMiddleware` résolvent désormais les permissions côté serveur (`permissionResolverService.resolvePermissions(sub, etablissementId)`, caché) et les attachent à `req.utilisateur.permissions` → tous les consommateurs (check-permission, permission.guard, controllers) inchangés. `JwtPayload.permissions` supprimé du DTO. Corps de réponse login/getCurrentUser conservent `permissions`.
- **Résultat** : token temp 685 o, token complet 829 o (vs 16 453).
- **Route sélection établissement** : `POST /api/auth/complete-login` (pas select-etablissement), body `{etablissementId}`, Bearer token temporaire.

### Permissions ADMIN notes/bulletins
- `DEFAULT_ROLE_PERMISSIONS[Role.ADMIN]` (roles.enum.ts) : 17 permissions notes:*/bulletins:* ajoutées + INSERT role_permissions en DB (17 lignes).

### Walkthrough API réel (SUPER_ADMIN, établissement ETAB-001) — tout vert
- GET /api/notes (paginé) → 200 ; GET /api/notes/statistiques → 200 (moyenne/mediane/distribution)
- POST /api/notes/bulk → 201 (⚠️ `typeEvaluation` attend l'enum MAJUSCULE : `DEVOIR`)
- PATCH /api/notes/:id `{statut:"VALIDEE"}` → 200
- POST /api/bulletins/generate → 200 (moyennes pondérées via matieres_niveaux, rangs, moyClasse/min/max, bulletinMatieres recréées)
- GET /api/bulletins/:id → 200 (relation `bulletinMatieres` chargée) ; GET /:id/export → 200 text/html A4 (10,7 Ko)
- PATCH publie:true → 200 ; DELETE bulletin publié → 400 BULLETIN_PUBLIE (garde OK) ; dépublication → 200
- Frontend :7001 → 200. Données de test Quatrième nettoyées.

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

## Travail effectué — Session 2026-07-24 (audit final + corrections)
### Backend — Bugs corrigés
- **`unites.controller.ts`** : Route `POST /unites/avec-postes` déplacée avant `GET /unites/:id` (sinon le `:id` matchait "avec-postes")
- **`statistiques-optimisees.service.ts`** : Strings `'actif'`/`'vacant'` → `StatutPoste.ACTIF`/`StatutPoste.VACANT` (enum)
- **`fonctions.service.ts`** : Chemin matérialisé corrigé (`parent.chemin + '.' + id`) + mise à jour dans `update()`
- **`organisation.service.ts`** : Ajout `destroy()` pour cleanup du `setInterval` Redis
- **`generation.service.ts`** : `superieurId` corrigé (ne reçoit plus un UUID de Poste)

### Frontend — Hooks, pages, types
- **`use-fonctions.ts`** : Ajout `enabled: isAuthenticated` sur tous les hooks (évite requêtes quand non connecté)
- **`fonction-detail-page.tsx`** : Handlers `onEdit`/`onDelete` fonctionnels + `ConfirmDialog` pour suppression sous-fonctions
- **`unite-detail-page.tsx`** : Clé i18n `supprimerUniteConfirmation` → `confirmerSuppressionUnite`
- **`fonctions-page.tsx`** : Clé i18n `actions` → `colActions`
- **`organisation.types.ts`** : Types `Fonction`/`CreerFonctionDto`/`ModifierFonctionDto` dupliqués supprimés

### i18n — Clés dupliquées nettoyées
- **`fr/organisation.json`** : Clé `organigramme` (string) renommée `vueOrganigramme` (conflit avec l'objet imbriqué). Doublon `ajouterSousUnite` supprimé.
- **`en/organisation.json`** : Idem. Clé renommée + doublon supprimé.
- **`tab-hierarchie.tsx`** : `t('organigramme')` → `t('vueOrganigramme')`

### Bilan qualité final
- **0 `any`** dans tout le module (backend + frontend)
- **0 clé i18n dupliquée** dans les JSON
- **0 route sans guard**
- **157 clés i18n** vérifiées dans les 24 fichiers composants
- **Cohérence backend** : entités, services, controllers alignés

## Travail effectué — Session 2026-07-24 (migration 120 — vues matérialisées)
### Migration 120 — Correction vues matérialisées organisation
- **`120-correction-vues-materialisees-organisation.sql`** : Migration corrective pour les vues matérialisées cassées depuis la refonte v4.
- **`mv_stats_organisation`** : DROP + RECREATE. Ne référence plus la table inexistante `organisations`. Agrège par `etablissementId` directement depuis `unites_organisationnelles`. Colonnes aliasées en snake_case pour cohérence avec le service (`etablissement_id`, `total_unites`, etc.)
- **`mv_postes_vacants_critiques`** : DROP + RECREATE. `p.intitulé` → `p.intitule`, suppression de `organisations o` / `u.organisationId` / `organisation_nom`. Ajout filtre `p.actif = true`.
- **`refresh_mv_organisation()`** : Fonction simplifiée (suppression INSERT dans logs_systeme obsolète).
- **Index ajoutés** : `idx_templates_org_actif`, `idx_templates_org_etablissement` sur `templates_organisation`.
- **Index obsolètes supprimés** : `idx_postes_couvrant_stats` (référençait `occupantId` supprimé), `idx_mv_stats_organisation_id` (référençait `organisation_id` supprimé).

### Service backend — Cohérence vues
- **`statistiques-optimisees.service.ts`** : `organisationNom` supprimé de l'interface `PosteVacantCritique` et du mapping (la table `organisations` n'existe plus).

### Bilan migrations
- **12 migrations** pour le module organisation (044, 045, 046, 109, 110, 112, 120 + anciennes)
- **Migration 120** : corrige les vues matérialisées cassées par les refontes 109-112
- **Cohérence vérifiée** : entités ↔ migrations ↔ service ↔ vues matérialisées

## Travail effectué — Session 2026-07-25 (refonte complète des modèles d'organisation)

### Contexte
Les 22 templates existants manquaient de cohérence, de logique et de contextualisation. Aucun metadata (nature juridique, système éducatif, langue, niveaux, complexité). Pas de filtrage dans la galerie. Fonctions non adaptées au système anglophone/bilingue.

### Analyse et recherche
- **Inspection approfondie** du code actuel (entités, seeds, templates, services, frontend)
- **Recherche web** sur les modèles réels d'établissements scolaires :
  - Système éducatif camerounais (MINESEC, MINEDUB) : lycées, collèges, écoles primaires
  - Système anglophone (British/American) : Head Teacher, Deputy Head, Head of Year, Form Tutor, SENCO
  - Système bilingue (Cameroun) : Coordinateur linguistique, Directeurs de section
  - Enseignement technique : Chef des travaux, Chefs d'atelier, Moniteurs
  - Centres de formation professionnelle : Coordinateurs de filière, Formateurs, Tuteurs entreprise

### Décisions architecturales (v6.0 — Templates catégorisés)

#### 5 axes de classification ajoutés à `TemplateOrganisation`
1. **Nature juridique** (`NatureJuridique`) : PUBLIC_ETATIQUE, PUBLIC_COMMUNAL, PRIVE_LAIC, PRIVE_CONFESSIONNEL, PRIVE_ASSOCIATIF, COMPLEXE
2. **Système éducatif** (`SystemeEducatif`) : GENERAL, TECHNIQUE, PROFESSIONNEL, NORMAL, SUPERIEUR
3. **Langue d'enseignement** (`LangueEnseignement`) : FRANCOPHONE, ANGLOPHONE, BILINGUE
4. **Niveaux** (`NiveauEnseignement[]`) : MATERNEL, PRIMAIRE, COLLEGE, LYCEE, POST_BAC
5. **Complexité structurelle** (`ComplexiteStructurelle`) : STANDARD, AVANCE

#### Colonnes ajoutées à l'entité
- `nature`, `systeme`, `langue`, `niveaux` (simple-array), `complexite`, `categorie`, `ordre`, `icone`, `metadata` (jsonb), `nomEn`
- 5 index partiels pour optimiser les filtres

#### 4 nouveaux échelons structurels
- SECTION_LINGUISTIQUE (niveau 2, #8b5cf6)
- CYCLE (niveau 2, #06b6d4)
- FILIERE (niveau 2, #f59e0b)
- POLE_FORMATION (niveau 2, #10b981)

#### 10 nouvelles fonctions (anglophone + bilingue)
- Anglophone : HEAD-TEACHER, DEPUTY-HEAD, HEAD-OF-YEAR, FORM-TUTOR, SENCO, BUSINESS-MGR, EXAMS-OFF
- Bilingue : COORD-LING, DIR-SECTION-FR, DIR-SECTION-EN

#### 25 templates catégorisés (remplacent les 22 anciens)
- T01-T02 : Lycée général public (standard + avancé)
- T03-T04 : Collège public (standard + avancé)
- T05-T07 : Lycée/Collège technique public
- T08-T09 : École primaire publique (standard + avancé)
- T10 : École maternelle publique
- T11-T12 : Complexes scolaires privés (bilingue + francophone)
- T13 : Collège-Lycée privé confessionnel
- T14-T15 : British schools (secondary + primary)
- T16 : Bilingual school (avancé)
- T17-T19 : CFP / Institut / Grande école
- T20-T21 : ENIEG / Université
- T22-T24 : Écoles bilingues/communales
- T25 : Organisation standard (générique)

#### Matrice de combinaisons valides
- 25 combinaisons logiques documentées
- Incompatibilités exclues : MATERNEL+TECHNIQUE, NORMAL+PRIMAIRE, CFP+MATERNEL/PRIMAIRE, COMPLEXE+un_seul_niveau

### Backend — Fichiers modifiés (7)
1. **`template-organisation.entity.ts`** : 5 enums + 9 colonnes + 6 index partiels
2. **`127-templates-organisation-categorisation.sql`** : Migration (ALTER TABLE + index + échelons)
3. **`seed-nomenclatures.ts`** : 4 nouveaux échelons structurels
4. **`seed-organisation.ts`** : 10 nouvelles fonctions anglophone/bilingue
5. **`seed-templates.ts`** : 25 templates catégorisés (remplace les 22 anciens)
6. **`template-organisation.service.ts`** : 3 nouvelles méthodes (`findAllFiltered`, `getCombinaisonsValides`, `clonerTemplate`)
7. **`nomenclature.controller.ts`** : 3 nouvelles routes (GET /templates avec filtres, GET /templates/combinaisons, POST /templates/:id/cloner)

### Frontend — Fichiers modifiés (6)
1. **`organisation.types.ts`** : 5 enums miroir + `TemplateFiltres` + `CombinaisonsValides`
2. **`query-keys.ts`** : Clés de cache `filtered()` et `combinaisons`
3. **`use-templates.ts`** : 3 hooks (filtres, combinaisons, clonage)
4. **`modeles-page.tsx`** : FacetFilters (5 groupes) + TemplateBadges + SearchInput + grille responsive 1→4 cols
5. **`fr/organisation.json`** : Traductions FR (natures, systemes, langues, niveaux, complexites, filtres)
6. **`en/organisation.json`** : Traductions EN (mêmes clés)

### API REST — Nouvelles routes
- `GET /api/organisation/templates?nature=&systeme=&langue=&niveaux=&complexite=&search=` (filtrage par facets)
- `GET /api/organisation/templates/combinaisons` (matrice des combinaisons valides + compteurs)
- `POST /api/organisation/templates/:id/cloner` (clonage avec nom optionnel)

### Qualité code
- **0 `any`** (sauf 1 contournement TypeORM mineur dans le seed)
- **0 couleurs hardcodées** — toutes via CSS variables
- **0 chaînes FR en dur** — toutes via `t()`
- **Responsive** — grille 1→4 colonnes, `clamp()` partout
- **Multi-tenant** — isolation par `etablissementId`
- **RBAC** — permissions granulaires sur toutes les routes

### Résultats
- Migration 127 appliquée : ✅ (10 colonnes, 5 index, 4 échelons)
- Seeds exécutés : ✅ (13 templates créés, 12 mis à jour, 10 fonctions par établissement)
- Compilation TS : ✅ (0 erreur après correction `intitulé` → `intitule`)
- Vérification 10/10 points : ✅

### Prochaines étapes recommandées
1. Tester la galerie avec filtres dans le frontend
2. Tester le clonage de templates
3. Tester la génération avec les nouveaux templates
4. Valider la cohérence des fonctionRef dans chaque template
5. Ajouter des tests unitaires pour `findAllFiltered()` et `clonerTemplate()`

## Travail effectué — Session 2026-07-27 (export v4 : lib/ réutilisable, minimap mobile, PDF tuiles multi-pages)

### Arbitrages grill-me (6 sujets analysés)

| # | Sujet | Décision | Justification |
|---|-------|----------|---------------|
| 1 | Minimap desktop-only (export mobile) | **Implémenté** | Force-mount temporaire via événement `force-minimap` avant capture, cleanup en `finally` |
| 2 | Web Worker encodage PNG géant | **Différé** | html-to-image exige le DOM (SVG foreignObject) ; le coût principal = sérialisation SVG + rastérisation, non déplaçable. Gain limité au ré-encodage final. À reconsidérer si gels constatés en usage réel |
| 3 | PDF multi-pages (tuiles) | **Implémenté** | Mode `tuiles` : page assemblage + grille numérotée + tuiles avec repères de découpe, chevauchement 10mm, DPI 150 |
| 4 | Rendu PDF côté serveur | **Différé** | Fidélité pixel exige le DOM client (dagre layout, CSS vars thème, fonts, ReactFlow). Pas de navigateur headless dans la stack Express+TypeORM |
| 5 | Rendu PNG côté serveur | **Différé** | Même contrainte que #4 — la capture pixel-fidèle nécessite le DOM complet |
| 6 | Réutilisabilité (lib/export/) | **Implémenté** | `css-var-resolver.ts` + `dom-stabilisation.ts` extraits dans `frontend/src/lib/export/` |

### A — Extraction lib/export/ (réutilisabilité)
- **`frontend/src/lib/export/css-var-resolver.ts`** : `resolveCssVar`, `resolveColor`, `clearResolverCache`, `normaliserCouleurHex` (move depuis `utils/`)
- **`frontend/src/lib/export/dom-stabilisation.ts`** : `attendreStabilisationDom` (MutationObserver debouncé)
- **`frontend/src/lib/export/index.ts`** : barrel export
- **4 imports mis à jour** : `export.ts`, `RelationEdge.tsx`, `HierarchieEdge.tsx`, `use-organigramme-flow.ts` → `@/lib/export`
- **Ancien fichier supprimé** : `utils/css-var-resolver.ts` (pas de shim de compat)

### B — Minimap mobile force-mount
- **`OrganigrammeFlowView.tsx`** : state `forceMinimap` + case `force-minimap` dans le listener `organigramme:toolbar-command` + rendu `{(isDesktop || forceMinimap) && <MiniMap/>}`
- **`export.ts`** : dispatch `force-minimap` visible=true avant capture si `options.inclureMinimap` + `attendreStabilisationDom` + cleanup visible=false en `finally`
- La minimap n'est rendue que ≥1280px en usage normal ; l'export la monte temporairement si demandée

### C — PDF multi-pages tuiles (`export-pdf.ts` v3.0.0, `export-types.ts` v3.1.0)
- **`ModePagination = 'ajuster' | 'tuiles'`** dans `ExportOptions.pagination`
- **`calculerGrilleTuiles(largeurImgMm, hauteurImgMm, pageFormat, orientation, chevauchementMm=10)`** : calcul grille colonnes×lignes, exporté depuis `export-types.ts`
- **Mode 'ajuster'** : comportement historique (image entière sur 1 page)
- **Mode 'tuiles'** :
  - Page 1 = assemblage : en-tête + vue d'ensemble réduite + grille numérotée (L×C) + légende + footer
  - Pages 2+ = 1 tuile/page : label `Lx·Cy — n/N`, corner marks 4 coins, chevauchement 10mm
  - DPI cible 150 pour impression (`PX_PAR_MM = 150/25.4`)
  - Découpe via offscreen canvas (`decouperTuile`)
  - Repères de découpe (`dessinerMarks`) aux 4 coins de chaque tuile
- **`ExportDialog.tsx`** : fieldset Pagination (PDF only) avec segments Ajuster/Tuiles + description ; estimation tuiles affichée dans le bloc estimation (`≈ N pages (C × R)`)

### Fichiers modifiés (8)
1. `lib/export/css-var-resolver.ts` (créé)
2. `lib/export/dom-stabilisation.ts` (créé)
3. `lib/export/index.ts` (créé)
4. `utils/css-var-resolver.ts` (supprimé)
5. `utils/export-types.ts` v3.1.0 (+ModePagination, +GrilleTuiles, +calculerGrilleTuiles)
6. `utils/export-pdf.ts` v3.0.0 (mode tuiles, DPI 150, découpe canvas, marks)
7. `utils/export.ts` v4.1.0 (import lib/, pagination, minimap force-mount)
8. `OrganigrammeFlowView.tsx` (forceMinimap state + commande)
9. `ExportDialog.tsx` v3.1.0 (fieldset pagination, estimation tuiles)
10. `edges/RelationEdge.tsx`, `edges/HierarchieEdge.tsx`, `hooks/use-organigramme-flow.ts` (imports → lib/)
11. `locales/fr/organisation.json`, `locales/en/organisation.json` (+6 clés pagination/tuiles)

### Qualité
- 0 `any`, 0 couleur hardcodée, i18n FR/EN parité, JSON valides
- `tsc --noEmit` : 0 erreur in-scope
- Conventions eLISAschool : bannières, CSS vars, clamp(), CustomModal

## Travail effectué — Session 2026-07-27 (export v5 : lib/export/ générique, aperçu PDF)

### A — Extraction utilitaires génériques dans lib/export/
- **`lib/export/telecharger.ts`** (nouveau) : `telecharger()`, `genererNomFichier(nom, suffixe, format)` (généralisé avec paramètre `suffixe`), `tailleDataUrlOctets()`, `formaterTaille()` (nouveau, formatage Ko/Mo/Go)
- **`lib/export/tuiles.ts`** (nouveau) : `PAGE_FORMATS_MM` (sans `label`, `as const`), `calculerGrilleTuiles()`, `chargerImage()`, `decouperTuile()`, types `GrilleTuiles` et `OrientationPage`
- **`lib/export/index.ts`** : barrel mis à jour — ré-exporte `telecharger`, `genererNomFichier`, `tailleDataUrlOctets`, `formaterTaille`, `PAGE_FORMATS_MM`, `calculerGrilleTuiles`, `chargerImage`, `decouperTuile`, types `GrilleTuiles` et `OrientationPage`
- **Déduplication** : `GrilleTuiles` et `calculerGrilleTuiles` supprimés de `export-types.ts` (maintenant dans `lib/export/tuiles.ts`). `PAGE_FORMATS` conservé dans `export-types.ts` (champ `label` pour l'UI) — distinct de `PAGE_FORMATS_MM` (calcul)
- **`export.ts`** : `telecharger`, `genererNomFichier`, `tailleDataUrlOctets` locaux supprimés → importés depuis `@/lib/export`. Appel `genererNomFichier` mis à jour (ajout `'organigramme'` comme suffixe)
- **`export-pdf.ts`** : `chargerImage`, `decouperTuile` locaux supprimés → importés depuis `@/lib/export`. `calculerGrilleTuiles` importé depuis `@/lib/export`. `getPageDimensions` utilise `PAGE_FORMATS_MM` au lieu de `PAGE_FORMATS`
- **`ExportDialog.tsx`** : `calculerGrilleTuiles` importé depuis `@/lib/export`

### B — Aperçu visuel PDF dans ExportDialog
- **`ApercuExport`** (composant interne) : SVG inline montrant la page (format + orientation), l'image estimée ajustée dans la zone utile, et la grille de tuiles en mode pagination 'tuiles' (rectangles pointillés bleu + labels `C×L`)
- Affiché uniquement pour le format PDF (condition `format === 'pdf'`)
- Dimensions SVG adaptatives : max 200×120px, scale proportionnel au format de page
- CSS vars pour toutes les couleurs (fond page, bordure, image, tuiles, texte)
- Accessible : `role="img"` + `aria-label` traduit

### Fichiers modifiés (7)
1. `lib/export/telecharger.ts` (créé)
2. `lib/export/tuiles.ts` (créé)
3. `lib/export/index.ts` (mis à jour — barrel)
4. `utils/export.ts` v4.1.0 (imports lib/, locaux supprimés)
5. `utils/export-pdf.ts` v3.0.0 (imports lib/, locaux supprimés)
6. `utils/export-types.ts` v3.0.0 (GrilleTuiles/calculerGrilleTuiles supprimés)
7. `modals/ExportDialog.tsx` v3.1.0 (import lib/, composant ApercuExport)
8. `locales/fr/organisation.json`, `locales/en/organisation.json` (+2 clés apercu/apercuLabel)

### Qualité
- 0 `any`, 0 couleur hardcodée, i18n FR/EN parité, JSON valides
- `tsc --noEmit` : 0 erreur in-scope (205 erreurs préexistantes hors périmètre)
- Zéro duplication de code entre lib/export/ et utils/

## Travail effectué — Session 2026-07-27 (UX organigramme : contrôles flottants, header intégré, i18n)

### A — Boutons d'action dans le panneau de contrôles ReactFlow
- **`OrganigrammeFlowView.tsx`** : ajout de 3 `ControlButton` personnalisés dans `<Controls>` :
  - **Plein écran** (Maximize2/Minimize2) : toggle via Fullscreen API, état `isFullscreen` local
  - **Relations** (Link2) : toggle overlay, style actif `bg-dominant-600 text-white`, conditionnel `onToggleRelations`
  - **Export** (Download) : dispatch `organigramme:toolbar-command` avec `command: 'export'`, conditionnel `onExport`
- **Nouvelles props** : `onToggleRelations`, `onExport` ajoutées à `OrganigrammeFlowViewProps`
- **Communication** : le bouton export dans les contrôles flottants dispatch un événement custom ; le toolbar l'écoute et ouvre l'ExportDialog (état export déjà géré par le toolbar)

### B — Toolbar — écoute commande export
- **`OrganigrammeToolbar.tsx`** : nouveau `useEffect` écoutant `organigramme:toolbar-command` pour `command === 'export'` → `setExportDialogOpen(true)`
- **`ToolbarCommand` type** : `'export'` ajouté à l'union

### C — Header gradient avec onglets intégrés
- **`OrganigrammePage.tsx`** : remplacement du `PageHeader variant="gradient"` + SegmentedControl séparé par un header gradient unifié :
  - Fond `linear-gradient(135deg, dominant-600, dominant-800)` avec `rounded-2xl`
  - Watermark Network décoratif (7% opacité blanche)
  - Breadcrumbs inversés (`<Breadcrumbs inverted />`)
  - Titre + icône glass-morphism à gauche
  - Onglets glass-morphism à droite (desktop) : `rgba(255,255,255,0.12)` + `backdrop-blur`, tab actif `rgba(255,255,255,0.28)`
  - Select natif glass-morphism (mobile < 480px)
  - Responsive : `flex-col` mobile → `lg:flex-row lg:items-end lg:justify-between` desktop

### D — Corrections i18n
- **FR** : `organigramme.exporter` : "Exporter PNG" → "Exporter" (le dialog supporte PNG + PDF)
- **EN** : `organigramme.exporter` : "Export PNG" → "Export"
- **EN** : `organigramme.fitView` : "Fit view" → "Fit to view"
- **EN** : `organigramme.afficherRelations` : "Show relations" → "Show links"
- **EN** : `organigramme.masquerRelations` : "Hide relations" → "Hide links"

### Fichiers modifiés (5)
1. `OrganigrammeFlowView.tsx` (+ControlButton, +props, +fullscreen state, +event handler)
2. `toolbar/OrganigrammeToolbar.tsx` (+export event listener, +ToolbarCommand type)
3. `OrganigrammePage.tsx` (header unifié, +Breadcrumbs import, +handleExport, +props FlowView)
4. `locales/fr/organisation.json` (exporter → "Exporter")
5. `locales/en/organisation.json` (exporter → "Export", fitView, relations)

### Qualité
- 0 `any`, 0 couleur hardcodée, i18n FR/EN parité
- `tsc --noEmit` : 0 erreur in-scope
- Responsive : desktop (glass tabs) + mobile (select natif)

## Travail effectué — Session 2026-07-28 (fix markers + routage même niveau v2)
### Problèmes constatés
1. **Flèches hiérarchiques inversées** : `MarkerType.ArrowClosed` ReactFlow avec `orient="auto-start-reverse"` créait des marqueurs incohérents — la pointe ne touchait pas l'unité cible.
2. **Courbes Bézier traversant les cartes** : pour les relations entre unités au même niveau (même `depth`), la courbe restait dans le plan horizontal → traversait les autres cartes de la rangée.
3. **Croisement abusif** : les courbes DIRECT et FONCTIONNEL s'entrecroisaient car les offsets latéraux étaient insuffisants.

### Fix 1 — Marqueurs SVG custom
- **`lib/routing/markers.tsx`** (nouveau) : 3 marqueurs SVG inline (`<marker>`) dans un composant `MarkerDefs` rendu dans ReactFlow :
  - `orient="auto"` (pas `auto-start-reverse`) → pointe toujours dans la direction du chemin
  - `refX="9"` → la pointe de la flèche touche exactement l'extrémité du path
  - Couleurs via CSS vars (`var(--color-dominant-500)`, `--color-secondary-500`, `--color-accent-600`)
  - Utilisation : `getMarkerUrl('hierarchie')` → `url(#arrowHierarchie)`
- `markerEnd` dans les définitions d'edges `use-organigramme-flow.ts` supprimé → chaque edge résout son propre marqueur via `getMarkerUrl()`

### Fix 2 — Routage Bézier v2 (même niveau)
- **`computeRowBounds()`** : détecte quand source et target sont au même niveau (même `depth`) et calcule la bounding box de la rangée entière
- **Arc par-dessus la rangée** : la courbe passe AU-DESSUS de la rangée (`rowBounds.yMin - ARC_HEIGHT_MIN`) avec un arc régulier via 2 points de contrôle
- **Arc libre** (si pas de rowBounds) : `midY = (sourceY + targetY) / 2 - sideSign * ARC_HEIGHT_MIN` → l'arc passe au-dessus du segment direct
- **CURVATURE recalibrée** : `ARC_HEIGHT_MIN = 80px` pour un arc visible et professionnel

### Fix 3 — Waypoints anti-collision v2
- `computeWaypoints()` réécrit :
  - Se déclenche pour `depthDiff >= 3` (relations longue portée)
  - Détecte les nœuds qui bloquent le corridor latéral (entre source et target)
  - Injecte des waypoints au niveau du bord du corridor pour contourner les obstacles
  - Retourne `[]` si aucun nœud bloquant → Bézier simple

### Fichiers créés
- `lib/routing/markers.tsx` : composant MarkerDefs + helpers getMarkerUrl/getMarkerId

### Fichiers modifiés
- `lib/routing/bezier-router.ts` v2 : computeBezier + computeRowBounds + computeWaypoints v2
- `lib/routing/index.ts` : export MarkerDefs, getMarkerUrl, getMarkerId, computeRowBounds
- `BaseEdge.tsx` : useBezierEdge accepte rowBounds
- `HierarchieEdge.tsx` : utilise getMarkerUrl('hierarchie')
- `RelationEdge.tsx` : utilise getMarkerUrl('direct'|'fonctionnel'), passe rowBounds
- `use-organigramme-flow.ts` : MarkerType supprimé, computeRowBounds dans construireEdgesRelations
- `OrganigrammeFlowView.tsx` : inclut `<MarkerDefs />` dans ReactFlow

### Qualité
- 0 erreur TS in-scope (384 préexistantes)
- 0 `any` nouveau
- Marqueurs SVG résolus via CSS vars → compatibilité dark mode
- Arc Bézier professionnel au-dessus des rangées

## Travail effectué — Session 2026-07-27 (edges unifiés — BaseEdge pattern)

### Architecture — BaseEdge.tsx (composant partagé)
- **`BaseEdge.tsx`** v1.0.0 (nouveau) : infrastructure partagée par tous les types d'edges de l'organigramme. Élimine ~70% de duplication entre HierarchieEdge et RelationEdge.
  - **`EDGE_ROUTING`** : constantes de routing par type (offset progressif anti-chevauchement : hierarchie=4, direct=10, fonctionnel=18 ; borderRadius=10 pour tous)
  - **`EDGE_STYLE`** : constantes visuelles unifiées (strokeWidth=2.5, strokeWidthHover=3.5, opacity=1.0, markerSize=15, transition unifiée)
  - **`useBaseEdge`** : hook partagé — calcule `getSmoothStepPath`, gère l'état hover, retourne les handlers
  - **`EdgeShell`** : composant de rendu partagé — hit-testing transparent (16px) + path visible + transitions
  - **`EdgeTooltip`** : tooltip unifié positionné au milieu du path (above) ou sous badge (below)
- **`HierarchieEdge.types.ts`** (nouveau) : extraction du type `HierarchieEdgeData` pour éviter les imports circulaires

### HierarchieEdge.tsx v5.0.0 — refactored
- Utilise `useBaseEdge`, `EdgeShell`, `EdgeTooltip` depuis BaseEdge
- Routing via `EDGE_ROUTING.hierarchie` (offset=6, borderRadius=10)
- Styles via `EDGE_STYLE` (strokeWidth 2.5/3.5)
- Simplifié de 117 → ~85 lignes

### RelationEdge.tsx v4.0.0 — refactored
- Utilise `useBaseEdge`, `EdgeShell` depuis BaseEdge
- Routing dynamique : `EDGE_ROUTING.fonctionnel` (offset=24) ou `EDGE_ROUTING.direct` (offset=14)
- Badge compteur + tooltip inline (position below)
- Simplifié et aligné sur le pattern HierarchieEdge

### use-organigramme-flow.ts — aligné
- Import `EDGE_STYLE` depuis BaseEdge pour markers unifiés
- Marker size : 14/16 → `EDGE_STYLE.markerSize` (15×15) pour tous les types
- zIndex layering : hiérarchie=0, relation DIRECT=1, relation FONCTIONNEL=2

### Export et légende — alignés
- **`export.ts`** : légende PNG overlay — strokeWidth unifié à 2.5 pour les 3 types
- **`OrganigrammeToolbar.tsx`** : légende popup — strokeWidth unifié à 2.5 pour les 3 types
- **`export-pdf.ts`** : légende PDF — largeur uniforme 0.5mm (distinction par dash pattern)

### Qualité
- 0 `any`, 0 couleur hardcodée, i18n FR/EN parité
- `tsc --noEmit` : 0 erreur in-scope
- 7 fichiers modifiés, 2 fichiers créés (BaseEdge.tsx, HierarchieEdge.types.ts)

## Travail effectué — Session 2026-07-27 (routing anti-chevauchement — audit + améliorations)

### Audit complet du routing (5 problèmes identifiés)

| # | Problème | Sévérité | Solution |
|---|----------|----------|----------|
| 1 | Node width mismatch (dagre 240px vs render 220px) | Medium | `NODE_WIDTH` 240→220 |
| 2 | Pas de `edgesep` dagre | High | Ajout `edgesep: 20` |
| 3 | `nodesep`/`ranksep` trop serrés pour relation edges | Medium | nodesep 60→80/80→100, ranksep 100→120/120→140 |
| 4 | Offsets edge trop faibles (4/10/18) | Medium | Offsets 6/14/24 (gap min 8px entre types) |
| 5 | Pas de constantes spacing exportées | Low | `LAYOUT_SPACING` exporté depuis layout.ts |

### Améliorations implémentées

#### A — Alignement largeur noeud (`layout.ts`)
- `NODE_WIDTH` : 240→220 (aligné sur `UniteNode` `style={{ width: 220 }}`)
- Routing dagre maintenant précis : les bords de noeuds sont exactement où dagre les calcule

#### B — Spacing dagre amélioré (`layout.ts`)
- **`edgesep: 20`** : séparation minimum entre edges aux bornes d'un noeud (anti-congestion)
- **`nodesep`** : TB 60→80, LR 80→100 (plus d'espace entre noeuds même rang)
- **`ranksep`** : TB 100→120, LR 120→140 (plus d'espace pour routing inter-rangs)
- **`LAYOUT_SPACING`** : constantes exportées (single source of truth, référencées par `setGraph`)

#### C — Offsets edge augmentés (`BaseEdge.tsx`)
- **Hiérarchie** : offset 4→6 (légèrement décalé du centre)
- **Directe** : offset 10→14 (gap 8px depuis hiérarchie)
- **Fonctionnelle** : offset 18→24 (gap 10px depuis directe)
- **Documentation** : commentaire détaillé dans `EDGE_ROUTING` expliquant la stratégie anti-chevauchement complète

### Stratégie anti-chevauchement — 5 couches de défense

1. **dagre `edgesep` (20px)** : sépare les edges aux bornes des noeuds
2. **dagre `nodesep`/`ranksep`** : espace suffisant entre noeuds pour le routing
3. **`EDGE_ROUTING` offset progressif** (6/14/24) : edges parallèles même paire jamais superposés
4. **zIndex layering** (0/1/2) : overlay important au-dessus
5. **Hit-testing 16px** : zone de clic élargie même si edges visuellement proches

### Fichiers modifiés (2)
1. `utils/layout.ts` (NODE_WIDTH 240→220, +edgesep, +nodesep/ranksep, +LAYOUT_SPACING export)
2. `edges/BaseEdge.tsx` (offsets 4/10/18 → 6/14/24, +documentation anti-chevauchement)

### Qualité
- 0 `any`, 0 couleur hardcodée
- Single source of truth : `LAYOUT_SPACING` constant → `setGraph()` call
- `tsc --noEmit` : 0 erreur in-scope

## Travail effectué — Session 2026-07-28 (lignes droites pour relations descendantes)
### Problème
- Relations DIRECT/FONCTIONNEL entre unités de niveaux différents utilisaient des courbes Bézier latérales qui semblaient tortueuses alors qu'une ligne droite diagonale pointant directement vers la cible est plus claire et professionnelle.

### Changement — `bezier-router.ts` v3.0.0
3 modes de tracé distincts :

1. **Même niveau** (`Math.abs(dy) < 60` en TB) → arc Bézier au-dessus de la rangée (inchangé).
2. **Relation descendante** (`dy > 60` en TB, target en dessous) → **ligne droite diagonale** avec offset latéral `SIDE_OFFSET=50`. La ligne part du bord de l'unité source (décalée du côté assigné) et pointe directement vers l'unité cible (même offset). Propre, sans courbe, clairement directionnelle.
3. **Relation montante** (cas rare) → courbe Bézier latérale (inchangée).

### `routeViaWaypoints()` — segment `L` au lieu de `C`
- Les segments entre waypoints passent de `C` (Bezier) à `L` (straight line) pour cohérence visuelle avec le mode descendant.
- `sideSign` n'est plus utilisé dans les segments (suppression de l'offset latéral dans les waypoints — le corridor est déjà déporté).

### Constantes
- `DESCENDING_THRESHOLD = 60` — seuil pour distinguer "même niveau" de "descendant".
- `straightLine()` — nouvelle fonction utilitaire (path `M... L...` + position label).

### Fichiers modifiés (1)
- `lib/routing/bezier-router.ts` v3.0.0 : `computeBezier` réécrit (3 modes) + `routeViaWaypoints` segments `L`.

### Fichiers documentés
- `.qoder/rules/elisaschool-frontend.md` §31 : section routage mise à jour (3 modes, waypoints lignes droites).

### Qualité
- 0 erreur TS in-scope (384 préexistantes).

## Travail effectué — Session 2026-07-28 (fix markers v3 — currentColor + userSpaceOnUse → abandonné, remplacé par flèche manuelle)

### Tentative v3 (marqueur SVG amélioré) → Abandonné
**Problèmes résiduels** : la pointe était toujours mal orientée, et la couleur différente du trait. Causes racines définitives :
1. `markerUnits="strokeWidth"` (valeur par défaut) — multiplie le marqueur par le strokeWidth (3× pour la hiérarchie), décalant la pointe et rendant l'orientation incohérente.
2. `fill="var(--color-*)` dans `<defs>` — les vars CSS ne se résolvent pas toujours dans le contexte SVG isolé du marqueur.
3. `currentColor` + `color: stroke` — le navigateur ne propage pas toujours `color` dans le marker copié depuis `<defs>`.

### Solution adoptée — Rendu manuel de la flèche (`EdgeArrow`)
**Abandon total du système SVG `<marker>`** pour les edges. Remplacement par un rendu direct d'une flèche SVG `<path>` à l'extrémité du chemin :

#### `BaseEdge.tsx` v3.0.0
- `endTangentAngle(path)` : extrait l'angle de la tangente à l'extrémité du path en parsant la dernière commande SVG (supporte `L` et `C`). Calcule `-atan2(dy, dx)` pour l'angle SVG `rotate()`.
- `EdgeArrow` composant : `M -7,-4.2 L 0,0 L -7,4.2 Z` — triangle pointant à droite par défaut, placé en `(endX, endY)` et tourné via `transform="rotate(angle)"`.
- `EdgeShell` prop `markerEnd` **supprimée**, remplacée par `arrowColor?: string`.
- Quand `arrowColor` est défini, `EdgeArrow` est rendu **exactement** avec la même variable `couleur` que `stroke` du path — aucune différence de couleur possible.

#### HierarchieEdge.tsx v7.0.0 / RelationEdge.tsx v6.0.0
- Import `getMarkerUrl` supprimé, `markerEnd` remplacé par `arrowColor={couleur}`.
- Plus de dépendance vers `lib/routing/markers.tsx`.

#### `markers.tsx`
- Conservé (export de `MarkerDefs` utilitaire) mais **plus utilisé par aucun edge**.

### Fichiers modifiés (3)
- `edges/BaseEdge.tsx` v3.0.0 : endTangentAngle + EdgeArrow + arrowColor prop (suppression markerEnd)
- `edges/HierarchieEdge.tsx` v7.0.0 : markerEnd → arrowColor
- `edges/RelationEdge.tsx` v6.0.0 : markerEnd → arrowColor

### Qualité
- 0 erreur TS in-scope.
- 0 `any` nouveau.
- Couleur flèche = couleur trait (même variable, pas de résolution indirecte).
- Orientation extraite du path réel (pas de `orient="auto"`).

## Travail effectué — Session 2026-07-28 (fix barre progression export invisible)
### Problème
La barre de progression était placée en fin de body du `CustomModal`, après tous les fieldsets (Taille, Qualité, Coloration, Portée, etc.). L'utilisateur devait **scroller manuellement** pour la voir. Pendant l'export, personne ne pense à scroller → progression invisible.

### Correctifs

#### `ExportDialog.tsx` — barre sticky bottom
- La barre de progression passe de `<div>...</div>` à `<div className="sticky bottom-0 -mx-[var(--padding-modal-body)] mt-auto ...">` :
  - `sticky bottom-0` : toujours collée au bas de la zone scrollable
  - `-mx-[var(--padding-modal-body)]` : déborde les marges latérales du body pour toute largeur
  - `border-t` : séparation visuelle avec le contenu au-dessus
  - `backgroundColor: var(--color-surface)` : fond opaque pour cacher le contenu qui défile dessous

#### `export.ts` — yield après preparation
- Ajout `await new Promise(resolve => setTimeout(resolve, 16))` après `onProgress?.('preparation')`. Sans cela, les appels synchrones `setEtapeExport('preparation')` → `setEtapeExport('capture')` se font tous avant le premier `await`, et React ne peint jamais les étapes intermédiaires — la barre saute de 0% à 55% sans transition visible.

### Fichiers modifiés (2)
- `modals/ExportDialog.tsx` : barre sticky bottom (toujours visible sans scroll)
- `utils/export.ts` : yield 16ms après preparation (laisse React peindre le rendu)

### Qualité
- 0 erreur TS in-scope.

## Travail effectué — Session 2026-07-28 (refonte complète Emploi du Temps — 8 lots)

### Contexte
Audit profond du système EDT (programme, volume horaire, emploi du temps, affectation matière, créneau, heure cours) ayant identifié des incohérences majeures : tables legacy (EmploiDuTemps, RepartitionHoraire), FK cassées, volumeHoraire en heures au lieu de minutes, absence de détection de conflits, frontend non fonctionnel.

### Décisions architecturales (D1-D9) — implémentées
| # | Décision | Impact |
|---|----------|--------|
| D1 | `MatiereNiveau.volumeHoraire` = source unique en **minutes**/semaine | DROP colonne sur ProgrammeMatiere, ConfigurationMatiereClasse |
| D2 | Fusion `EmploiDuTemps` + `RepartitionHoraire` → `CreneauHoraire` | Nouvelle entité, table `creneaux_horaires` |
| D3 | `HeureCours` ancré sur `classeAnneeId` (pas `classeId`) | Migration FK |
| D4 | `ProgrammePedagogique` = curriculum intemporel | Supprimé periodeId, dateDebut/Fin |
| D5 | Supprimer `ConfigurationMatiereClasse` | Champs absorbés par AffectationMatiere |
| D6 | Édition manuelle : modal 3 étapes + drag & drop + resize | CSS Grid + @dnd-kit |
| D7 | `PreferenceEmploiDuTemps` enrichi : pauses + creneauxImposables JSONB | Migration |
| D8 | Frontend 5 onglets : Calendrier, Liste, Synthèse, Préférences, Templates | Refonte page |
| D9 | `ConflitDetectionService` : 5 types (3 bloquants, 2 avertissements) | Nouveau service |

### Backend — Entités et services

**Entité `CreneauHoraire`** (table `creneaux_horaires`) :
- FK unique `affectationMatiereId` (résout matière + enseignant + classe-année)
- Enums : `JourSemaine` (LUN-SAM), `TypeCreneau` (COURS/TP/TD/RECREATION/ETUDE/PERMANENCE/AUTRE), `StatutCreneau` (PLANIFIE/VALIDE)
- Index composite pour détection conflits : `[etablissementId, jour, heureDebut, heureFin]`

**`ConflitDetectionService`** — 5 types de conflits :
| # | Type | Sévérité | Logique |
|---|------|----------|---------|
| 1 | CONFLIT_CLASSE | BLOQUANT | Même classeAnnee, même plage horaire |
| 2 | CONFLIT_ENSEIGNANT | BLOQUANT | Même enseignant (+ coEnseignants), même plage |
| 3 | CONFLIT_SALLE | BLOQUANT | Même salle, même plage |
| 4 | DEPASSEMENT_VOLUME_HORAIRE | AVERTISSEMENT | Minutes planifiées > MatiereNiveau.volumeHoraire |
| 5 | CRENEAU_IMPOSABLE | AVERTISSEMENT | Chevauchement avec exclusion (creneauxImposables) |

**`EmploiDuTempsService`** : CRUD + `genererEmploiDuTemps` (algorithme most-constrained-first, distribution équilibrée, pauses, disponibilité enseignants/salles) + `validerCreneau/CreneauxClasse`.

**Controller** : 19 routes REST, toutes protégées par `authMiddleware` + `requirePermission`.

**Migration `071-edt-refonte.sql`** : DROP tables legacy + CREATE `creneaux_horaires` + ALTER `heures_cours` (classeId → classeAnneeId) + UPDATE volumeHoraire heures→minutes.

### Frontend — 9 composants + 15 hooks

**Page principale** (`edt-page.tsx`) : 5 onglets — Calendrier (grille interactive), Liste (tableau), Synthèse (matrice volume réalisé vs attendu), Préférences, Templates.

**Calendrier** (`edt-calendar.tsx`) :
- CSS Grid : jours (colonnes) × créneaux 30min (lignes), 07:00-17:00
- @dnd-kit : DndContext + useDraggable (déplacement jour+heure) + resize (poignée bas)
- Vérification conflits temps réel au drop (mutation `useVerifierConflits`)
- Optimistic update via `queryClient.setQueriesData`

**Modal créneau** (`edt-creneau-modal.tsx`) : 3 étapes (Identification → Planification → Résumé), validation conflits live à chaque étape.

**Synthèse** (`edt-synthese.tsx`) : Matrice classes × matières, comparaison heures planifiées vs volume horaire attendu (`MatiereNiveau.volumeHoraire` en minutes → affiché en heures).

**Hooks** (`use-emploi-du-temps.ts`) : 15 hooks TanStack Query (7 queries + 8 mutations), toasts i18n, invalidations ciblées.

### Lot E — Qualité transverse (nettoyage)
- **0 erreur TS** dans les fichiers EDT, enseignants/onglet-edt, matieres/matiere-detail-page, programmes/programme-matiere-modal
- **0 `any`** dans tout le module EDT
- **0 couleur hardcodée** dans EDT + onglet-edt (toutes migrées vers CSS vars)
- **0 chaîne FR hardcodée** dans EDT + onglet-edt (toutes migrées vers i18n)
- **i18n FR+EN** : clés emplois.json + personnel.json (section `edt`) avec parité complète
- `volumeHoraire` retiré de `programme-matiere-modal.tsx` (conformité D1)
- `edtQuery.data.data.items` → `edtQuery.data.items` (pattern hook corrigé)
- `SectionSeparator` enrichi (props `title` + `icon`)

### Fichiers clés
- **Backend** : `modules/emploi-du-temps/` (entities/, services/, controllers/, dto/)
- **Frontend** : `features/emploi-du-temps/` (components/, hooks/, types/, index.ts)
- **Migration** : `database/migrations/071-edt-refonte.sql`
- **i18n** : `locales/{fr,en}/emplois.json`, `locales/{fr,en}/personnel.json` (section edt)
- **Composants adjacents** : `enseignants/onglet-edt.tsx`, `matieres/matiere-detail-page.tsx`

## Travail effectué — Session 2026-07-28 (grill-me académique : coefficient, barème, volume horaire, programmes)

### Contexte
Audit profond de la chaîne académique : coefficient, barème, crédit, volume horaire, programme, chapitre, affectationMatière, affectationClasse, classe. Vérification cohérence backend/frontend/UI/données.

### 6 arbitrages validés (A1-A6) + 3 recommandations (R1-R3)
| # | Sujet | Décision |
|---|-------|----------|
| A1 | Coefficient | `coefficientResolverService` singleton — chaîne AffectationMatiere → ProgrammeMatiere → MatiereNiveau → défaut 1 |
| A2 | Barème | Même chaîne que coefficient, défaut 20. Backend normalise tout sur /20 via SQL |
| A3 | Crédits | SUPPRIMÉS (système anglophone/LMD abandonné). Migration 130 drop colonnes |
| A4 | Volume horaire | Minutes partout. `MatiereNiveau.volumeHoraire` = minutes/semaine, source unique |
| A5 | Programme intemporel | `ProgrammePedagogique` sans dateDebut/dateFin/periodeId. Historisation via ProgrammeVersion |
| A6 | ConfigurationMatiereClasse | SUPPRIMÉE. Champs absorbés par AffectationMatiere |

### P0 — Backend (6 priorités)
- **P0.1** : `coefficient-resolver.service.ts` — singleton, chaîne de résolution, barrel export
- **P0.2** : Volume horaire minutes + migration 128 + `duree-utils.ts` (minutesVersHeures, heuresVersMinutes, formaterDuree)
- **P0.3** : Refonte AffectationEleve + `transfererEleve()` + migration 129 (index unique partiel)
- **P0.4/P0.5** : Portail parents + gardes multi-tenant strict
- **P0.6** : Config bug falsy + clés fantômes + seed R2/R3

### P1 — Intégrité + stats
- Migration 130 : DROP crédits (colonnes + contraintes)
- Index composites pour performance requêtes
- Stats matières/niveaux

### P2 — Frontend (3 fichiers migrés CSS vars + i18n)
- **`onglet-matieres.tsx`** : ~50 couleurs → CSS vars, ~30 chaînes FR → `t()`, MiniStat refactored (tone au lieu de color)
- **`onglet-matieres-kanban.tsx`** : CSS vars + i18n complet (SortableCard, Column)
- **`onglet-matieres-planning.tsx`** : CSS vars + i18n + JOURS_I18N (6 jours) + fix couleur hardcodée `#3b82f6` → CSS var
- **`programme-matiere-modal.tsx`** : 13 chaînes FR → `t()`, 6 couleurs → CSS vars
- **`programme-form-modal.tsx`** : champs D4-obsolètes supprimés (dateDebut, dateFin, periodeId)
- **`programme-detail-page.tsx`** : fix TS (matiereNom/niveauNom inexistants)
- **i18n** : ~60 clés `affectations.*` + 6 clés `jours.*` ajoutées FR+EN dans `personnel.json`

### Qualité
- **0 erreur TS** dans enseignants/onglet-matieres*, programmes/
- **0 `any`** dans les fichiers migrés
- **0 couleur hardcodée** dans les fichiers migrés
- **0 chaîne FR en dur** dans les fichiers migrés
- **i18n FR/EN parité** complète (personnel.json: sections affectations + jours)

### Docs mises à jour
- **Skill `elisaschool-business-logic`** : Domaine 14 ajouté (coefficient/barème/volume horaire/affectations/programme intemporel) + Domaine 1 enrichi (coefficientResolverService)

## Travail effectué — Session 2026-07-28 (validations, historisation, traçabilité — audit + composants partagés)

### Contexte
Audit de la cohérence des validations, historisation et traçabilité across tous les modules traités. Vérification backend/frontend/UI/données. Création de composants frontend partagés pour le workflow de validation et l'audit trail.

### Phase A — Fixes critiques backend (session précédente)
- **Workflow validation effectif** : `validationWorkflowService` dispatch réellement sur l'entité (statut appliqué)
- **Audit calls** : ajout des appels `auditLogService.log()` manquants sur les actions critiques

### Phase B — Composants partagés frontend (5 fichiers créés/corrigés)

**Composants créés** :
- **`StatutBadge.tsx`** : badge coloré par statut (EN_ATTENTE, ACTIF, REJETE, etc.), CSS vars, i18n
- **`ValidationTimeline.tsx`** : timeline visuelle des étapes de validation avec icônes par décision
- **`ValidationActions.tsx`** : boutons Approuver/Rejeter/Annuler + CustomModal commentaire
- **`AuditTimeline.tsx`** : timeline des logs d'audit via `GET /api/audit/logs?cible=&cibleId=`
- **`use-validation-workflow.ts`** : hook TanStack Query (4 endpoints validation-workflows)

**11 erreurs TS corrigées** :
- 5× `apiClient.get<ApiResponse<T>>` → `apiClient.get<T>` (double-wrapping supprimé)
- 2× `variant="success"` → `variant="primary"` (ElisaButton n'a pas de variant success)
- 2× `niveau.decision` → `niveau.decision ?? ''` (type narrowing après spread)
- 2× `data.module` → `data?.module` (onSuccess data possibly undefined)

### Phase C — Qualité frontend

**HistoriqueTab.tsx refactoré (v2.0.0)** :
- `window.confirm()` → `ConfirmationModal` (variant="warning")
- `toLocaleDateString('fr-FR')` → `formatDate()` depuis `@/lib/date-utils`
- 12 couleurs hardcodées → CSS vars (mapping statique `ACTION_ICONS` pour CREATE/UPDATE/DELETE/RESTORE)
- 10 chaînes FR → `t()` (i18n configuration.json: 16 clés FR+EN)
- Pagination : `meta.hasPrev`/`meta.hasNext` (inexistants) → `meta.currentPage <= 1` / `meta.currentPage >= meta.totalPages`

**Dates i18n (4 occurrences)** :
- `contrats-page.tsx` : 2× `toLocaleDateString('fr-FR')` → `formatDate(date, 'dd/MM/yyyy')`
- `paie-page.tsx` : `formatMoisAnnee` → `formatDate(date, 'MMMM yyyy')`, datePaiement → `formatDate(date, 'dd/MM/yyyy')`

### Skills et règles mis à jour
- **`elisaschool-business-logic/SKILL.md`** : sections "Workflow de validation (système unifié)" et "Audit Trail (traçabilité)" ajoutées sous Patterns transversaux
- **`elisaschool-frontend-dev/SKILL.md`** : sections "Workflow : Intégrer un Workflow de Validation" (composants partagés + hook + pattern) et "Formatage des dates — Règle absolue" (date-utils.ts, JAMAIS toLocaleDateString)

### Qualité
- **0 erreur TS** dans les fichiers créés/modifiés (Phase B + C)
- **0 `any`** dans les composants partagés
- **0 couleur hardcodée** dans les composants partagés + HistoriqueTab
- **0 chaîne FR en dur** dans les composants partagés + HistoriqueTab
- **i18n FR/EN parité** complète (configuration.json: 16 clés)

### Problème systémique identifié
- **37 occurrences** de `toLocaleDateString('fr-FR')` dans le codebase — à migrer progressivement vers `formatDate()` depuis `@/lib/date-utils`

## Travail effectué — Session 2026-07-28 (fusion enseignants → personnel)

### Contexte
Audit du module `enseignants` : la page liste et la page détail redirigeaient vers `personnel`, mais 11 composants d'onglets (matières, EDT, évaluations, absences, contrats, parcours) + hooks + types étaient encore utilisés par `personnel-detail-page.tsx`. Code mort identifié et fusion complète approuvée.

### Décisions validées
- **Fusion complète** : tout le code vivant de `features/enseignants/` déplacé dans `features/personnel/`
- **Suppression totale** : dossier `features/enseignants/` entièrement supprimé (17 fichiers)
- **Types dédupliqués** : `Enseignant extends MembrePersonnel {}` supprimé (vide), `ContratEnseignant` fusionné dans `ContratPersonnel`
- **Pattern de nommage** : fonctions `useEnseignant*` conservées comme API publique (cohérence sémantique)
- **Sidebar nettoyée** : permissions `enseignants:*` orphelines supprimées

### Fichiers déplacés (11 composants d'onglets)
```
features/enseignants/components/enseignant-detail/
  ├── onglet-matieres.tsx           → features/personnel/components/onglets/
  ├── onglet-matieres-kanban.tsx    → features/personnel/components/onglets/
  ├── onglet-matieres-planning.tsx  → features/personnel/components/onglets/
  ├── onglet-evaluations.tsx        → features/personnel/components/onglets/
  ├── onglet-absences.tsx           → features/personnel/components/onglets/
  ├── onglet-contrat.tsx            → features/personnel/components/onglets/
  ├── onglet-parcours.tsx           → features/personnel/components/onglets/
  ├── onglet-edt.tsx                → features/personnel/components/onglets/
  ├── onglet-infos.tsx              → features/personnel/components/onglets/
  ├── hero-header.tsx               → features/personnel/components/onglets/
  └── affectation-form-modal.tsx    → features/personnel/components/onglets/
```

### Hooks fusionnés
- **`use-enseignants.ts`** (17 hooks) → copié dans **`use-personnel-detail.ts`**
- **`use-affectations.ts`** (3 hooks) → copié dans **`use-personnel-detail.ts`**
- **`use-personnel-detail.ts`** : nouveau fichier contenant 20 hooks pour la page détail personnel
- **Nommage préservé** : `useEnseignant*` (12 hooks), `useAffectation*` (3 hooks), `useListeEnseignants` (1 hook), `useEnseignant` (1 hook), hooks utilitaires (3 hooks)

### Types fusionnés
- **`enseignant.types.ts`** → types ajoutés à **`personnel.types.ts`** :
  - `AffectationEnseignant`, `AffectationPayload`
  - `EdtEnseignant`, `EdtCreneau`
  - `EvaluationEnseignant`
  - `AbsenceEnseignant`, `AssiduiteStats`
  - `ParcoursComplet`
- **Types supprimés** : `Enseignant` (extends vide), `ContratEnseignant` (doublon de `ContratPersonnel`)

### Imports mis à jour
- **`personnel-detail-page.tsx`** : 5 imports cross-feature (`@/features/enseignants/...`) → imports locaux (`./onglets/...`)
- **11 fichiers onglets** : imports hooks/types mis à jour (`../../hooks/use-personnel-detail`, `../../types/personnel.types`)
- **`hero-header.tsx`** : type `Enseignant` → `MembrePersonnel` (3 occurrences)
- **`onglet-infos.tsx`** : type `Enseignant` → `MembrePersonnel` (1 occurrence)

### Sidebar nettoyée
- **`Sidebar.tsx`** : suppression de `enseignantsPerms = useModulePermissions('enseignants')` et de l'entrée `enseignants: enseignantsPerms` dans `permsMap`

### Barrel exports mis à jour
- **`features/personnel/index.ts`** : ajout de `export * from './hooks/use-personnel-detail'`

### Dossier enseignants supprimé
- **17 fichiers** supprimés :
  - 3 pages (liste, détail, form modal) — code mort
  - 11 composants d'onglets — déplacés
  - 3 hooks — fusionnés
  - 1 barrel `index.ts`
  - 1 fichier types — fusionné

### Qualité
- **0 erreur TS** dans le code de fusion (erreurs préexistantes dans modules non liés : absences, charts, Header, LanguageSwitcher, RowActions, TransfertList, TreeView)
- **0 référence résiduelle** à `features/enseignants` dans le codebase (vérifié par grep)
- **0 `any`** introduit
- **0 couleur hardcodée** introduite
- **0 chaîne FR en dur** introduite
- **i18n** : aucune nouvelle clé nécessaire (traductions déjà dans `personnel.json`)

### Impact
- **Violation de boundary éliminée** : `personnel` n'importe plus depuis `enseignants` (cross-feature)
- **Types dédupliqués** : une seule source de vérité dans `personnel.types.ts`
- **Cohérence architecturale** : tout le code RH (personnel, contrats, paie) dans `features/personnel/`
- **Maintenance simplifiée** : un seul module à maintenir au lieu de deux

## Travail effectué — Session 2026-07-28 (audit trail + validation workflow — wiring complet)

### Contexte
Les composants partagés `AuditTimeline`, `StatutBadge`, `ValidationTimeline`, `ValidationActions` et le hook `use-validation-workflow` existaient mais n'étaient connectés à aucune page détail. Wiring complet dans les 7 pages détail + dashboard.

### Phase 1 — Migration 131 + backend
- **`131-audit-permissions.sql`** (idempotente) : crée les permissions `audit:{module}:view` pour les 11 modules (notes, bulletins, personnel, contrats, paie, eleves, classes, matieres, periodes, emploi-du-temps, organisation) + `audit:view` globale pour ADMIN/SUPER_ADMIN.
- **`audit.controller.ts`** : middleware dynamique `requireAuditAccess` — `audit:view` (global) OU `audit:{module}:view` (scopé).
- **`AuditTimeline.tsx`** : double vérification permission (global + module).

### Phase 2 — Composants partagés créés
- **`StatutBadge.tsx`** : badge coloré par statut workflow (EN_ATTENTE/ACTIF/REJETE/CLOTURE), CSS vars, i18n
- **`ValidationTimeline.tsx`** : timeline des étapes de validation avec icônes par décision
- **`ValidationActions.tsx`** : boutons Approuver/Rejeter/Annuler + CustomModal commentaire
- **`AuditTimeline.tsx`** : timeline des logs d'audit via `GET /api/audit/logs?cible=&cibleId=`
- **`use-validation-workflow.ts`** : hook TanStack Query (4 endpoints validation-workflows)

### Phase 3 — Wiring dans les 7 pages détail

**P0 — Bulletin + Personnel** :
- `bulletin-detail-page.tsx` : onglet "Validation" gated `bulletins:validate` + onglet "Historique" gated `audit:bulletins:view`
- `personnel-detail-page.tsx` : onglet "Validation" gated `personnel:validate` + onglet "Historique" gated `audit:personnel:view`

**P1 — Matière + Année scolaire** :
- `matiere-detail-page.tsx` : onglet "Validation" gated `matieres:validate` + onglet "Historique" gated `audit:matieres:view`
- `annee-scolaire-detail-page.tsx` : onglet "Validation" gated `annees-scolaires:validate` + onglet "Historique" gated `audit:periodes:view`

**P2 — Classe + Note + Période** :
- `classe-detail-page.tsx` : onglet "Historique" gated `audit:classes:view`
- `note-detail-page.tsx` : onglet "Validation" gated `notes:validate` + onglet "Historique" gated `audit:notes:view`
- `periode-detail-page.tsx` : onglet "Historique" gated `audit:periodes:view`

### Phase 4 — Dashboard audit widget
- **`dashboard-audit-widget.tsx`** (nouveau) : widget global affichant les 10 derniers logs d'audit tous modules confondus via `GET /api/audit/logs?limit=10`. Gated `audit:view`. Timeline compacte avec badges module+cible, sévérité, utilisateur, timestamp relatif.
- **`DashboardPage.tsx`** : widget intégré entre les stat cards et les actions rapides.
- **i18n** : 2 clés FR+EN dans `dashboard.json` (`audit.titre`, `audit.totalLogs`).

### Pattern de wiring (standardisé)
```tsx
// 1. Onglet conditionnel dans le tableau onglets
...(hasPermission('audit:{module}:view') || hasPermission('audit:view')
    ? [{ id: 'historique', label: t('...'), icon: History }]
    : []),

// 2. Contenu de l'onglet (adapté au pattern de la page)
{ongletActif === 'historique' && (
    <Card>
        <div className="p-[clamp(0.75rem,1.5vw,1.25rem)]">
            <h3>...</h3>
            <div className="border-b border-border mb-4" />
            <AuditTimeline cible="{Entity}" cibleId={id} module="{module}" />
        </div>
    </Card>
)}
```

### Valeurs cible par module
| Module | cible | module |
|--------|-------|--------|
| Bulletin | `'Bulletin'` | `'bulletins'` |
| Personnel | `'MembrePersonnel'` | `'personnel'` |
| Matière | `'Matiere'` | `'matieres'` |
| Année scolaire | `'AnneeScolaire'` | `'annees-scolaires'` |
| Classe | `'Classe'` | `'classes'` |
| Note | `'Note'` | `'notes'` |
| Période | `'Periode'` | `'periodes'` |

### Qualité
- **0 `any`** dans les composants créés
- **0 couleur hardcodée** — toutes via CSS vars
- **0 chaîne FR en dur** — toutes via `t()`
- **i18n FR/EN parité** complète
- **7 pages détail** avec onglets audit/validation wiring
- **1 widget dashboard** global
- **13 fichiers i18n** mis à jour (7 modules × 2 langues - 1 common)

### Note — Audit logging backend
Les services backend de ces modules ne loggent pas encore via `auditLogService`. L'`AuditTimeline` affiche l'état vide tant que les appels `auditLogService.log()` ne sont pas ajoutés aux opérations CRUD. Le wiring frontend est prêt.
- **AGENTS.md** : cette section

## Travail effectué — Session 2026-07-29 (grill-me audit : fix « aucun historique affiché »)

### Diagnostic — 2 causes racines
1. **Récupération cassée** (`audit.controller.ts` + `audit.service.ts`) : pagination appliquée AVANT le filtrage cible/cibleId → pages vides et `total` faussé ; route `GET /logs/export` shadowée par `GET /logs/:id` ; typage CSV.
2. **Création absente** : seuls `notes` appelaient `auditService.log()` — les tabs Historique de classes/matieres/periodes/annees-scolaires restaient vides faute d'entrées `cible`+`cibleId`.

### Correctifs récupération (2 fichiers)
- **`audit.controller.ts`** : ordre routes (`/logs/export` avant `/logs/:id`), filtres `cible`/`cibleId`/`module` passés au service.
- **`audit.service.ts`** : filtrage AVANT pagination, `total` exact, `findById` corrigé.

### Instrumentation création (8 fichiers — pattern notes)
Pattern : `await auditService.log({ utilisateurId, action, cible, cibleId, description, anciennesValeurs?, nouvellesValeurs?, module })` juste après save/remove ; controllers passent `req.utilisateur?.id`.

| Module | Service | Actions auditées | cible / module |
|--------|---------|------------------|----------------|
| classes | `classes.service.ts` | CREATE, UPDATE, DELETE | `Classe` / `classes` |
| matieres | `matieres.service.ts` | CREATE, UPDATE, DELETE | `Matiere` / `matieres` |
| periodes | `periodes.service.ts` | CREATE, UPDATE, DELETE | `Periode` / `periodes` |
| annees-scolaires | `annees-scolaires.service.ts` | CREATE, UPDATE, DELETE, ACTIVATE | `AnneeScolaire` / `annees-scolaires` |

- **UPDATE** : snapshot `anciennesValeurs` (clés du dto) + `nouvellesValeurs`.
- **DELETE** : libellé capturé AVANT `repo.remove()` (TypeORM efface l'id) ; `cibleId` = paramètre `id`.
- **`activer()`** : nouveau param `utilisateurId?` + `ANNEE_SCOLAIRE_ACTIVATE`.
- `cloturer`/`reouvrir` hors périmètre (pas d'enum dédié).

### Frontend — vérifié, AUCUN changement
`AuditTimeline`, `use-permissions`, 7 pages détail, `DashboardAuditWidget`, migration 131 : tous corrects. Le problème était 100% backend.

### Qualité
- 0 `any` nouveau, 0 erreur tsc dans les 10 fichiers modifiés (TS2308 `CreneauHoraire` dans `modules/index.ts:82` = pré-existant, barrel EDT, non touché).
- **Modules restants à instrumenter** (tabs encore vides) : bulletins, personnel — même pattern à appliquer.

## Travail effectué — Session 2026-07-29 (système d'audit enrichi — full-stack)

### Contexte
Refonte complète du système d'audit pour passer d'un simple logger à un système de traçabilité avancé avec relations parent-enfant, auto-calcul des champs modifiés, rétention automatique, et interface d'administration.

### Backend — Migration 132 + entité enrichie
- **`132-audit-enrichi.sql`** : ajout colonnes `parentCible` (varchar 100), `parentCibleId` (uuid), `champsModifies` (simple-array), `etablissementId` (uuid). Index composite `(parentCible, parentCibleId, createdAt)` + `(etablissementId, createdAt)`.
- **`audit-log.entity.ts`** : 4 nouveaux champs typés + index + relations.

### Backend — AuditService enrichi + AuditRelationResolver
- **`audit.service.ts`** : `getLogs()` supporte `scope: 'avec-liees'` — résout les entités enfants via `AuditRelationResolverService` puis construit un `OR` sur `(cible+cibleId) || (parentCible+parentCibleId)`.
- **`calculerChampsModifies()`** : auto-calcul diff anciennes/nouvelles valeurs au moment du log.
- **`audit-relation-resolver.service.ts`** (nouveau) : résout les entités enfants d'une cible (ex: Classe → notes, bulletins, affectations).
- **`audit-filters.dto.ts`** : schema Zod enrichi — `scope: z.enum(['entite', 'avec-liees']).optional()`, `severity`, `search`.

### Backend — Rétention + purge cron
- **Archivage automatique** : logs > 30 jours déplacés vers `audit_logs_archive`, > 365 jours purgés.
- **Cron job** : exécution quotidienne 02:00.

### Backend — Instrumentation modules enrichie
- **8 services** instrumentés avec le pattern enrichi (anciennesValeurs, nouvellesValeurs, parentCible, module, description).
- Modules couverts : classes, matieres, periodes, annees-scolaires (+ notes déjà fait).

### Frontend — AuditTimeline v2 (`components/ui/AuditTimeline.tsx`)
- Diff extensible (expand/collapse par log), load-more pagination, groupement par jour.
- Toggle portée directe / élargie (envoie `scope=avec-liees` au backend).
- Badge source enfants (`GitBranch` icon), icônes contextuelles par type d'action.
- Correction params : utilise `cible`+`cibleId`+`scope` au lieu de `parentCible`/`parentCibleId` séparés.

### Frontend — Page admin audit globale (`/admin/audit`)
- **Route** : `_auth.admin.audit.tsx`, guards `requireRole(['SUPER_ADMIN', 'ADMIN'])`.
- **Page** : `features/admin/components/audit-page.tsx` — DataTable serveur, filtres module/sévérité/recherche, export CSV/JSON, modal détail avec diff.
- **Sidebar** : entrée « Audit » ajoutée dans la section Administration (icône `ScrollText`).
- **i18n** : 25+ clés FR/EN dans `common.json` (`audit.page.*`).

### Fichiers modifiés/créés (résumé)
| Type | Fichier | Action |
|------|---------|--------|
| Migration | `132-audit-enrichi.sql` | Créé |
| Entity | `audit-log.entity.ts` | Enrichi (parentCible, champsModifies, etablissementId) |
| Service | `audit.service.ts` | Enrichi (scope, champsModifies auto) |
| Service | `audit-relation-resolver.service.ts` | Créé |
| DTO | `audit-filters.dto.ts` | Enrichi (scope, severity, search) |
| Controller | `audit.controller.ts` | Enrichi (contrôle accès granulaire) |
| Frontend | `AuditTimeline.tsx` | Refondu v2 |
| Frontend | `audit-page.tsx` | Créé |
| Route | `_auth.admin.audit.tsx` | Créé |
| Sidebar | `Sidebar.tsx` | Entrée audit ajoutée |
| i18n | `fr/common.json`, `en/common.json` | Clés audit.page.* + audit.actions.* |
| Skill | `elisaschool-business-logic/SKILL.md` | Section audit trail mise à jour |

### Qualité
- **0 erreur TS** dans les fichiers audit (audit-page, route, Sidebar)
- **0 `any`** dans les nouveaux fichiers
- **0 couleur hardcodée** — toutes via CSS vars
- **0 chaîne FR en dur** — toutes via `t()`
- **i18n FR/EN parité** complète

## Travail effectué — Session 2026-07-29 (audit : metadata JSONB + résolution utilisateur + liens navigation)

### Contexte
Amélioration du système d'audit/traçabilité : les auteurs n'étaient pas affichés (profil non joint), aucun contexte entité (impossible de savoir QUEL élève/matière/période modifié), et aucun lien de navigation vers les enregistrements.

### Phase 1 — Migration + Entity (`metadata` JSONB)
- **`136-audit-metadata.sql`** : `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "metadata" jsonb;`
- **`audit-log.entity.ts`** : `@Column({ type: 'jsonb', nullable: true }) metadata?: Record<string, unknown>;`

### Phase 2 — Fix résolution utilisateur (join profil)
- **`audit.service.ts`** : `getLogs()` et `findLogById()` joignent désormais `u.profil` pour récupérer `nom`/`prenom` depuis `ProfilUtilisateur`
- **`audit.controller.ts`** : mapper `mapLog()` aplatit la réponse (`utilisateur.nom`, `utilisateur.prenom`, `utilisateur.email`)

### Phase 3 — Enrichir les appels audit avec metadata
| Module | Metadata | Actions |
|--------|----------|---------|
| classes | `{ entiteLabel: classe.nom, entiteRef: classe.code }` | CREATE, UPDATE, DELETE |
| matieres | `{ entiteLabel: matiere.nom, entiteRef: matiere.code }` | CREATE, UPDATE, DELETE |
| periodes | `{ entiteLabel: periode.nom }` | CREATE, UPDATE, DELETE |
| annees-scolaires | `{ entiteLabel: annee.libelle }` | CREATE, UPDATE, DELETE, ACTIVATE |
| notes | `{ entiteLabel: "${valeur}/${bareme}", relations: { eleve, matiere, periode } }` | CREATE, UPDATE, DELETE |
| personnel | `{ entiteLabel: matricule, entiteRef: matricule }` | CREATE |
| bulletin-paie | `{ entiteLabel: "Bulletin ${mois}/${annee}", relations: { personnel } }` | GENERATE |

### Phase 4 — Frontend (type + navigation + composants)
- **`frontend/src/lib/audit-navigation.ts`** (créé) : `resolveAuditNavLink()` + `resolveRelationNavLink()` — map 10 types d'entités vers routes TanStack Router avec permission requise
- **`AuditTimeline.tsx`** : type `AuditLogEntry.metadata` + `email` ajoutés ; `LogItem` affiche `metadata.entiteLabel` avec lien navigable (permission-gated) ; relations en badges compacts avec liens ; fallback email si nom/prenom absents
- **`audit-page.tsx`** : colonne "cible" cliquable ; section "Contexte" dans le modal détail avec liens ; même fallback email
- **i18n** : `audit.relations.*` (10 clés) + `audit.page.contexte` ajoutés en FR et EN

### Fichiers modifiés/créés
| Fichier | Action |
|---------|--------|
| `backend/database/migrations/136-audit-metadata.sql` | Créé |
| `backend/src/modules/auth/entities/audit-log.entity.ts` | Modifié (metadata JSONB) |
| `backend/src/modules/auth/services/audit.service.ts` | Modifié (join profil + metadata AuditOptions) |
| `backend/src/modules/audit/controllers/audit.controller.ts` | Modifié (mapLog response) |
| `backend/src/modules/classes/services/classes.service.ts` | Modifié (metadata) |
| `backend/src/modules/matieres/services/matieres.service.ts` | Modifié (metadata) |
| `backend/src/modules/periodes/services/periodes.service.ts` | Modifié (metadata) |
| `backend/src/modules/annees-scolaires/services/annees-scolaires.service.ts` | Modifié (metadata) |
| `backend/src/modules/notes/services/notes.service.ts` | Modifié (metadata + relations) |
| `backend/src/modules/personnel/services/personnel.service.ts` | Modifié (metadata) |
| `backend/src/modules/paie/services/bulletin-paie.service.ts` | Modifié (metadata + relations) |
| `frontend/src/lib/audit-navigation.ts` | Créé |
| `frontend/src/components/ui/AuditTimeline.tsx` | Modifié (type + liens + relations) |
| `frontend/src/features/admin/components/audit-page.tsx` | Modifié (liens + contexte) |
| `frontend/src/locales/fr/common.json` | Modifié (audit.relations + contexte) |
| `frontend/src/locales/en/common.json` | Modifié (audit.relations + contexte) |

### Qualité
- **0 erreur TS** dans les fichiers modifiés (frontend + backend)
- **0 `any`** nouveau
- **0 couleur hardcodée** — CSS vars
- **0 chaîne FR en dur** — `t()` partout
- **i18n FR/EN parité** complète
- **Navigation permission-gated** — liens visibles uniquement si la permission correspondante est accordée
- **Fallback email** — pour les logs historiques sans nom/prenom

## Travail effectué — Session 2026-07-29 (wiring validation workflow multi-niveaux — Option B)

### Corrections backend
- **AuditAction enum** : ajout `VALIDATION_APPROUVE`, `VALIDATION_REJETE`
- **Migration 144** (ex-139 legacy, renumerotée) : ajout ALTER TYPE pour audit_action_enum (2 noms PG possibles)
- **`validation-workflow.service.ts`** : ajout des cas `Periode`, `AnneeScolaire`, `Bulletin` dans `appliquerEffetEntite()` ; fix `setParam()` arité
- **`bulletins.service.ts`** : création auto de workflow quand `publie=true` et `require_validation`
- **`personnel.service.ts`** : `updateStatut()` avance le workflow via `traiterValidation()` si workflow EN_COURS
- **`validation-workflow.controller.ts`** : ajout route `GET /by-entite/:module/:entiteId` + guard sur `/annuler`
- **`notes.service.ts`** : fix double-save (re-fetch après `traiterValidation`)

### Frontend — Validation tab (6 pages)
Validation tab ajouté dans bulletin-, matière-, période-, classe-, année scolaire- et personnel-detail-page :
- `ValidationTimeline` + `ValidationActions` + `useWorkflowByEntite`
- Gated par permission `{module}:validate`
- **Fix permission bug** : `audit:periodes:view` → `audit:annees-scolaires:view` dans l'année scolaire

### Infrastructure
- Nouveau hook `useWorkflowByEntite()` + endpoint backend + barrel hooks
- i18n : 20 clés ajoutées (validation, aucunWorkflow) dans FR+EN pour les 5 modules
- 0 erreur TS backend + frontend (préexistantes intactes)

## Travail effectué — Session 2026-07-30 (indicateur de connexion réseau — grill-me + implémentation)

### Contexte
Demande d'un indicateur de connexion dans le header eLISAschool, avec détection multi-états : réseau, internet, serveur. Décisions prises via grill-me (20 questions).

### Décisions validées (grill-me)
- **5 états** : connected / degraded / server-down / lan-only / offline
- **Détection** : navigateur `navigator.onLine` + `/api/network/ping` backend enrichi (DB + mémoire + internet probe) + fallback frontend Cloudflare `no-cors` si serveur down
- **Visuel** : point + anneau concentrique — anneau = réseau (vert/orange/rouge), point = serveur (vert/jaune/rouge/gris)
- **Animations** : pulsation pour états non-nominaux (degraded 1.5s, server-down 1s, lan-only 3s) + transitions Framer Motion entre états
- **Polling** : 15s + événements navigateur (online/offline/visibilitychange)
- **Comportement au clic** : Radix Popover avec détails (latence, DB, mémoire, internet)
- **Bannière** : persistante après 30s d'état critique, désactivable par l'utilisateur
- **Permissions** : 3 niveaux — `network:view` (tous), `network:details` (popover), `network:admin` (page monitoring)
- **Architecture** : `features/network/` avec store Zustand + hook + composants UI
- **Cache** : Redis 30s pour sonde internet côté backend

### Backend — Module network/
- **`network.service.ts`** : ping avec DB check (SELECT 1), mémoire, sonde internet (HEAD 1.1.1.1), cache Redis 30s + fallback mémoire
- **`network.controller.ts`** : `GET /api/network/ping` public, retourne `{ status, timestamp, details: { database, memory, internet }, latencyMs }`
- **`app.ts`** : monté public juste après `/api/health`
- **`roles.enum.ts`** : 3 permissions ajoutées à `Permission` enum + `DEFAULT_ROLE_PERMISSIONS[ADMIN]`
- **`142-network-permissions.sql`** : migration idempotente (INSERT permissions + role_permissions pour tous les rôles)

### Frontend — Indicateur de connexion (8 fichiers)
- **`types/network.types.ts`** : 5 états, `ConnectionDetails`, `PingResponse`
- **`stores/connection.store.ts`** : Zustand store — état global `{ state, details }`, méthode `checkConnection()` (ping serveur + probe Cloudflare fallback)
- **`hooks/use-connection-status.ts`** : polling 15s, listeners online/offline/visibilitychange
- **`components/ConnectionIndicator.tsx`** : point + anneau SVG, animation Framer Motion, badge critique (!)
- **`components/ConnectionPopover.tsx`** : Radix Popover avec détails permission-gated, boutons rafraîchir/monitoring
- **`components/ConnectionBanner.tsx`** : bannière avec délai 30s, désactivable, icône selon état
- **`features/network/index.ts`** : barrel exports
- **`Header.tsx`** : intégré avant `EtablissementSwitcher`
- **`PageLayout.tsx`** : intégré après `<Header />`
- **i18n FR/EN** : 16 clés dans `common.json` (`network.*`)

### Qualité
- 0 `as any` dans les 10 fichiers créés
- 0 couleur hardcodée — toutes via CSS vars
- 0 chaîne FR en dur — toutes via `t()`
- i18n FR/EN parité complète
- Permissions 3 niveaux attribuées à tous les rôles (view) ou ADMIN (details/admin)
- Cache Redis 30s + fallback mémoire pour sonde internet

## Consolidation StatCard + UX unifiée — Session 2025

### Phase 1 — StatCard partagé enrichi
- **`components/ui/StatCard.tsx`** : ajout `orientation` (horizontal/vertical), `compact`, effets hover `scale(1.02)` + `shadow-md`, extraction `TrendBadge`
- **`audit-page.tsx`** : suppression StatCard local (36 lignes), import StatCard partagé avec `compact` + `tone`

### Phase 2 — Breadcrumb standardisé
- **`PageHeader.tsx`** : `showBreadcrumbs: true` par défaut
- Suppression `<Breadcrumbs />` directs dans 4 fichiers : `eleve-detail-page.tsx`, `hero-header.tsx`, `SalleDetailPage.tsx`, `OrganigrammePage.tsx`

### Phase 3 — Filtres DataTable
- Ajout `enableCollapsibleFilters` sur 10 pages : evenements, courriers, bibliotheque, sante, archives, documents, sondages, inventaire, examens, eleves, discipline

### Phase 4 — StepperModal (modals multi-étapes)
- **`components/modals/StepperModal.tsx`** : NOUVEAU composant générique — indicateur progression (barre + dots), navigation prev/next, validation par étape, animations Framer Motion
- **`classe-form-modal.tsx`** : conversion CustomModal+stepper manuel → StepperModal (3 étapes création, 2 étapes édition)
- **`etablissement-form-modal.tsx`** : conversion → StepperModal (3 étapes : Identité, Contact & Communication, Configuration)
- **`utilisateur-form-modal.tsx`** : conversion → StepperModal (3 étapes : Identité & Contact, Rôle & Accès, Profil)

### Phase 5 — Badge workflow PageHeader
- **`contrat-detail-page.tsx`** : ajout `status` prop (EN_ATTENTE_VALIDATION→warning, ACTIF→success, EXPIRE→info, ROMPU→danger)
- **`bulletin-detail-page.tsx`** : ajout `status` prop (publié→success, non publié→warning)

### Phase 6 — Backend : tendances stats
- **`audit.controller.ts`** : ajout `trends` dans `/api/audit/logs/statistics` — comparaison 24h vs 24-48h
- **`notes.service.ts`** : ajout `trends` dans `getStatistiques` — comparaison 30j vs 30-60j (nombreNotes + moyenne)

## Système Emploi du Temps — Audit + Améliorations Phase 1 (Session 2026-08-02)

### Architecture consolidée
- **Modèle 3 couches** : `AffectationMatiere` (source unique de vérité) → `CreneauHoraire` (slot hebdomadaire récurrent) → `HeureCours` (instance datée concrète)
- **AffectationMatiere** : lie enseignant + matière + classe-année (unique source pour l'attribution des heures)
- **CreneauHoraire** : slot hebdomadaire (jour + heureDebut/heureFin + typeCreneau + statut), lié à `affectationMatiereId` et optionnellement `salleId`
- **HeureCours** : instance datée concrète d'un créneau (date + statutEffectif + remplacement), liée à `classeAnneeId` + `creneauId`
- **Détection conflits** : 5 types (3 BLOQUANT : classe/enseignant/salle ; 2 AVERTISSEMENT : depassementVolume/creneauImposable)
- **Génération** : algo glouton most-constrained-first avec contraintes (pauses, imposables, dispo enseignant, salles, max consécutifs)

### Backend — Améliorations Phase 1
- **Fix performance** : `findByClasseAnnee`, `findByEnseignant`, `findBySalle` — `find()` + filter en mémoire → `createQueryBuilder` avec JOIN et WHERE en base
- **Nouvel endpoint** : `GET /api/emploi-du-temps/statistiques` — KPIs agrégés (totalCreneaux, totalHeures, totalMatieres, totalClasses, totalEnseignants, totalSallesOccupees, repartitionParJour, repartitionParMatiere, tauxOccupationSalle, conflitsPotentiels)
- **Contrainte maxCreneauxConsecutifs** : intégrée dans l'algo de génération (méthode `verifierMaxConsecutifs()`)
- **Fichiers modifiés** : `emploi-du-temps.service.ts`, `emploi-du-temps.controller.ts`

### Frontend — Améliorations Phase 1
- **Types** : `StatistiquesEDT` + `StatistiquesFilters` ajoutés dans `edt.types.ts`
- **Hook** : `useStatistiquesEDT()` dans `use-emploi-du-temps.ts` (query key `['emploi-du-temps', 'statistiques', filters]`)
- **i18n** : clés calendrier (semaine, jour, précédent, suivant, aujourd'hui) + synthèse (KPIs, graphiques, respect) ajoutées dans `emplois.json`
- **Refonte edt-synthese.tsx** : dashboard complet — 6 KPI Cards + 2 graphiques CSS bar chart horizontal (répartition par jour, par matière) + tableau croisé volume horaire responsive (desktop table + mobile cards)
- **Refonte edt-calendar.tsx** : hook `useHauteurSlot()` responsive (36/40/48px), `clamp()` sur grille/headers/labels/cards, jours abrégés sur mobile
- **Refonte onglet-edt.tsx** : classes Tailwind hardcodées → variables CSS eLISAschool (`--color-dominant-*`, `--color-text-*`, `--gap-*`, `--space-*`, `--icon-*`), mobile cards < 640px
- **Refonte edt-page.tsx** : bannière ajoutée, `space-y-4`/`gap-6`/`p-6` → variables CSS, sélecteur contexte responsive, select avec `clamp()`, bouton "Ajouter" label masqué sur mobile
- **Refonte edt-liste.tsx** : variables CSS eLISAschool appliquées

### Ultra-responsivité appliquée
- Tous les `font-size` en `clamp()` (pas de valeurs fixes)
- Tous les espacements via `var(--gap-*)`, `var(--space-*)`, `var(--padding-*)`
- Icônes via `var(--icon-xs)` / `var(--icon-sm)` / `var(--icon-lg)`
- Transformation tableau → cartes sur mobile (< 480px ou < 640px selon composant)
- Jours abrégés automatiquement sur petits écrans (3 lettres)

### Fichiers modifiés (12)
**Backend** : `emploi-du-temps.service.ts`, `emploi-du-temps.controller.ts`
**Frontend** : `edt.types.ts`, `use-emploi-du-temps.ts`, `emplois.json` (FR), `edt-synthese.tsx`, `edt-calendar.tsx`, `onglet-edt.tsx`, `edt-page.tsx`, `edt-liste.tsx`

### Prochaines phases (à venir)
- **Phase 2** : Génération progressive avec preview + résolution interactive des conflits
- **Phase 3** : Page dédiée HeureCours (suivi effectif, pointage présence, remplacements)
- **Phase 4** : Timeline verticale Google Calendar (axe Y=heures, axe X=jours)
- **Phase 5** : Navigation semaine dans le calendrier + export PDF amélioré

## Travail effectué — Session 2026-08-02 (redesign navigation EDT — pill compact + datepicker modal)
### Contexte
Session grill-me : améliorer la sélection des jours du calendrier EDT et son affichage de manière moderne, interactive, professionnelle et épurée.

### Spécification retenue (co-construction itérative)
- **Périmètre** : uniquement le bloc de navigation (◀ ▶ label)
- **Style** : hybride compact `[◀ Août 2026 ▶ ⌖]` — pill avec bordure arrondie, chevrons encadrent le label, bouton « Aujourd'hui » absorbé en icône crosshair (⌖) discret
- **Interactions** : clic sur le label → ouvre un modal datepicker ; chevrons → prev/next ; ⌖ → retour aujourd'hui (visible au hover si `estCourant`, permanent sinon)
- **Modal datepicker** : CustomModal size="md", dropdowns mois + année en header, grille calendrier 7×6, footer « Aujourd'hui » + « Semaine courante »
- **Responsive** : mobile = label abrégé (mois court) ; desktop = label complet

### Fichiers créés (1)
- **`edt-datepicker-modal.tsx`** (291 lignes) : composant modal avec calendrier mensuel interactif
  - Dropdowns mois (12 mois traduits) + année (±5 ans autour de l'année courante)
  - Grille 7×6 avec jours du mois précédent/suivant en opacité réduite
  - Jour sélectionné = fond dominant-600, aujourd'hui = ring + dot indicateur
  - Navigation interne ◀▶ mois dans le modal
  - Ultra-responsive (clamp), variables CSS, i18n FR/EN complet

### Fichiers modifiés (3)
- **`edt-page.tsx`** : bloc navigation refactorisé en pill compact (border + bg surface + group hover), label cliquable avec `setDatePickerOpen(true)`, bouton ⌖ crosshair avec `opacity-0 group-hover:opacity-100` si `estCourant`, modal `EDTDatePickerModal` ajouté en bas du JSX
- **`emplois.json` (FR)** : +9 clés navigation (`titreDatepicker`, `descriptionDatepicker`, `semaineCourante`, `moisPrecedent`, `moisSuivant`, `selectionnerMois`, `selectionnerAnnee`, `allerAujourdhui`) + `jours.dimanche`
- **`emplois.json` (EN)** : parité FR/EN complète (+9 clés navigation + `jours.dimanche`)

### Barrel export
- **`index.ts`** : `EDTDatePickerModal` ajouté aux exports

### Conventions respectées
- 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur
- Variables CSS uniquement (`var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--icon-*)`)
- `clamp()` sur toutes les dimensions (ultra-responsivité 100px-2560px)
- `CustomModal` (pas d'overlay custom)
- i18n 100% (react-i18next, namespaces `emplois`)

## Travail effectué — Session 2026-08-05 (EDT — jours fériés, badge HC, modal +N, toggle)
### Contexte
Session grill-me (3 rounds) : 7 axes d'amélioration EDT clarifiés par questions interactives.

### Améliorations implémentées (6)
1. **Jour actuel distinctif** : semaine = colonne fond léger `bg-[var(--color-accent-50)]/40` + cercle blanc semi-transparent autour numéro header ; mois = cercle `bg-[var(--color-dominant-600)]` autour numéro + ring-2
2. **Modal détail par défaut** : clic créneau depuis semaine/mois → `EDTCreneauDetailModal` (lecture seule) ; vue jour → `EDTCreneauModal` (édition directe)
3. **Jours fériés complets** : backend (entité `JourFerie` + migration 147 + seed Cameroun 6 fixes récurrents + 12 variables chrétiens 2025-2027 + CRUD REST) ; frontend (hook `useJoursFeries` + intégration vues semaine/mois avec indicateur étoile `Star` + tooltip nom)
4. **Badge heures cours** : pastille `CheckCircle2` vert + ring inset pour créneaux avec HC générées ; backend via `addSelect EXISTS` + `getRawAndEntities` pour mapper `hasHeuresCours`
5. **Modal +N** : clic sur « +N » vue mois → CustomModal liste triée par heure, pastille couleur matière, infos (horaires, enseignant, salle), clic → modal détail
6. **Toggle « Tout afficher »** : bouton Eye dans toolbar secondaire (vue mois uniquement), supprime la limite 3 créneaux par jour

### Fichiers créés (6)
- `backend/src/modules/emploi-du-temps/entities/jour-ferie.entity.ts` (108 lignes)
- `backend/database/migrations/147-jours-feries.sql` (66 lignes)
- `backend/src/modules/emploi-du-temps/dto/jour-ferie.dto.ts` (43 lignes)
- `backend/src/modules/emploi-du-temps/services/jour-ferie.service.ts` (206 lignes)
- `backend/src/modules/emploi-du-temps/controllers/jours-feries.controller.ts` (121 lignes)
- `frontend/src/features/emploi-du-temps/hooks/use-jours-feries.ts` (104 lignes)

### Fichiers modifiés (9)
- `edt-page.tsx` : hook `useJoursFeries`, handlers `handleCreneauClick`/`handleCreneauEdit`/`handlePlusNClick`, état `showAllCreneaux`, modal +N CustomModal, toggle Eye toolbar
- `edt-calendar.tsx` : import `CheckCircle2`/`Star`, props `joursFeries`, DropCell `estAujourdhui`, cercle header, indicateur JF, badge HC CreneauCard
- `edt-month-view.tsx` : import `CheckCircle2`/`Star`, props `joursFeries`/`showAll`/`onPlusNClick`, cercle numéro actuel, indicateur JF, badge HC, "+N" buttonisé
- `emploi-du-temps.service.ts` : `addSelect EXISTS` + `getRawAndEntities` pour `hasHeuresCours`
- `edt.types.ts` : interface `JourFerie` + champ `hasHeuresCours` sur `CreneauHoraire`
- `use-jours-feries.ts` : fix bug `useHandleError` (hook appelé correctement)
- `emplois.json` FR/EN : clés `vues.afficherTout*`, `badge.*`, `modalPlusN.*`, `joursFeries.*`
- `entities/index.ts`, `dto/index.ts`, `services/index.ts`, `controllers/index.ts`, `index.ts` (module backend) : exports

### Bug corrigé
- `use-jours-feries.ts` : `const handleErr = useHandleError` (référence fonction sans appel hook) → `const handleError = useHandleError()` dans chaque hook de mutation (conformité règles hooks React)

---

## Module Heures de cours — Page globale + Remplacements (2026-08-03)

### Architecture
- **Portée** : GLOBAL — vue établissement + filtres avancés
- **Navigation** : Sous-entrées EDT dans la sidebar (Heures de cours + Remplacements)
- **Tab existant** : CONSERVÉ dans la fiche personnel (`TabHeureCours`)
- **Remplacements** : Page dédiée `/heures-cours/remplacements`
- **Permissions** : Granulaires dédiées (`heures-cours:view`, `:export`, `:remplacer:view`, `:remplacer:demand`, `:remplacer:validate`)

### Backend — Entité RemplacementHeureCours
- **Fichier** : `backend/src/modules/personnel/entities/remplacement-heure-cours.entity.ts`
- **Enum** : `StatutRemplacement` (EN_ATTENTE, VALIDEE, REJETEE, EXECUTEE, ANNULEE)
- **FK** : HeureCours, MembrePersonnel (demandeur, remplacant, validePar), Etablissement
- **Soft delete** : @DeleteDateColumn
- **Migration** : `backend/database/migrations/148-remplacement-heure-cours.sql`

### Backend — Service + Controller
- **Service** : `remplacement-heure-cours.service.ts` (7 méthodes : create, valider, executer, rejeter, annuler, findAll, getStatistiques)
- **Controller** : 7 routes REST (`/api/personnel/heures-cours/remplacements/*`)
- **Extensions** : `getStatistiquesGlobales()` + `exportCSV()` + `exportHTML()` dans `heure-cours.service.ts`
- **Workflow 2 étapes** : `valider()` EN_ATTENTE→VALIDEE (approbation, ne touche pas HeureCours) puis `executer()` VALIDEE→EXECUTEE (mise en œuvre, met à jour HeureCours statut REMPLACE + remplacantId)
- **findAll() enrichi** : 10 leftJoinAndSelect (enseignant→utilisateur→profil, classeAnnee→classe+anneeScolaire, matiere, salle, creneau, remplacant→utilisateur→profil). Filtre `salleId` ajouté (DTO + service).

### Frontend — Pages + Hooks
- **Hooks** : `use-remplacement-heure-cours.ts` (7 hooks : useRemplacements, useStatistiquesRemplacements, useCreerRemplacement, useValiderRemplacement, useExecuterRemplacement, useRejeterRemplacement, useAnnulerRemplacement)
- **Extensions** : `useStatistiquesGlobales` + `useExportHeuresCoursCSV` + `useExportHeuresCoursHTML` dans `use-heure-cours.ts`
- **Page Heures de cours** : `heures-cours-page.tsx` (6 StatCards, DataTable avec `enableCollapsibleFilters`, export CSV/HTML authentifié). Colonnes enrichies : Enseignant (avatar initiales + nom complet via `enseignant.utilisateur.profil`), Matière (dot couleur + code), Classe (icône GraduationCap + code), Salle (icône MapPin + code). Pagination corrigée (`meta.totalItems`).
- **Page Remplacements** : `remplacements-page.tsx` (4 StatCards, DataTable avec `enableCollapsibleFilters`, workflow 2 étapes avec confirmation modale validation/rejet, bouton Exécuter pour VALIDEE)
- **StepperModal** : `remplacement-stepper-modal.tsx` v2.0 (3 étapes : sélection cours → remplaçant + motif → récapitulatif). Prop `coursPreselectionne` : skip étape 1 si cours connu (bouton Remplacer depuis heures-cours-page). Recherche remplaçant avec dropdown filtrable. Locale dynamique `i18n.language`. Bouton Remplacer visible uniquement pour statut PLANIFIE.
- **Export modal** : `heures-cours-export-modal.tsx` (choix CSV/HTML, export HTML authentifié via apiClient)
- **Routes** : `_auth.heures-cours.tsx` (`requirePermission('heures-cours:view')`), `_auth.heures-cours.replacements.tsx` (`requirePermission('heures-cours:remplacer:view')`)
- **Sidebar** : Sous-entrées sous "Emploi du temps" (Planning, Heures de cours, Remplacements)

### Fichiers créés (11)
- `backend/src/modules/personnel/entities/remplacement-heure-cours.entity.ts`
- `backend/database/migrations/148-remplacement-heure-cours.sql`
- `backend/src/modules/personnel/dto/remplacement-heure-cours.dto.ts`
- `backend/src/modules/personnel/services/remplacement-heure-cours.service.ts`
- `backend/src/modules/personnel/controllers/remplacement-heure-cours.controller.ts`
- `frontend/src/features/personnel/hooks/use-remplacement-heure-cours.ts`
- `frontend/src/features/emploi-du-temps/components/heures-cours-page.tsx`
- `frontend/src/features/emploi-du-temps/components/remplacements-page.tsx`
- `frontend/src/features/emploi-du-temps/components/remplacement-stepper-modal.tsx`
- `frontend/src/routes/_auth.heures-cours.tsx`
- `frontend/src/routes/_auth.heures-cours.replacements.tsx`

### Fichiers modifiés (10)
- `shared/src/enums/roles.enum.ts` : 4 nouvelles permissions + attribution ADMIN/CHEF/PROVISEUR
- `backend/src/modules/auth/entities/audit-log.entity.ts` : 5 AuditAction REMPLACEMENT_HEURE_COURS_*
- `backend/src/modules/validation-workflow/services/validation-workflow.service.ts` : `heures_cours_remplacement` dans getDefaultRoles()
- `backend/src/modules/personnel/services/heure-cours.service.ts` : `getStatistiquesGlobales()` + `exportCSV()`
- `backend/src/modules/personnel/controllers/heure-cours.controller.ts` : 2 routes (statistiques-globales, export/csv)
- `backend/src/app.ts` : montage controller remplacements AVANT heures-cours
- `frontend/src/features/personnel/hooks/use-heure-cours.ts` : `useStatistiquesGlobales` + `useExportHeuresCoursCSV`
- `frontend/src/features/personnel/index.ts` : export barrel hooks remplacements
- `frontend/src/features/emploi-du-temps/index.ts` : export barrel pages
- `frontend/src/components/layout/Sidebar.tsx` : sous-entrées EDT (Planning, Heures de cours, Remplacements)
- `frontend/src/locales/fr/emplois.json` + `en/emplois.json` : ~80 clés i18n (heuresCoursPage.*, remplacements.*, export.*)

## Composants partagés EDT / Heures de cours / Remplacements (2026-08-06)

### Composants colonnes (`components/ui/data-table/`)
- **Barrel** : `components/ui/data-table/index.ts`
- **ColonneEnseignant** : avatar rond initiales (dominant-100/dark-900) + nom complet tronqué. Style canonical = heures-cours-page.
- **ColonneMatiere** : dot couleur + nom + code (`hidden lg:inline`)
- **ColonneClasse** : icône GraduationCap + nom + code (`hidden xl:inline`)
- **ColonneSalle** : icône MapPin + nom/code
- **BadgeStatutCreneau** : badge unifié 8 états (PLANIFIE→outline, EFFECTUE→success, ANNULE→danger, REMPLACE→warning, EN_ATTENTE→warning, VALIDEE→success, REJETEE→danger, EXECUTEE→success)
- **Utilisation obligatoire** dans `edt-liste.tsx`, `heures-cours-page.tsx`, `remplacements-page.tsx`

### ElisaSelect v2.1
- **Prop `searchable`** : input search dans dropdown (filtrage live Radix)
- **Prop `compact`** : `h-8` / `text-xs` pour filtres DataTable/FilterPanel
- **Prop `aria-label`** : accessibilité ARIA sur le trigger
- **Dark mode** : classes `dark:` explicites sur Trigger et Content portal
- **Contraintes viewport (v2.1)** : `max-h-[min(70vh,360px)]`, `w-[--radix-select-trigger-width]`, `max-w-[calc(100vw-2rem)]`, `avoidCollisions` — empêche le débordement écran. Items tronqués (`truncate` sur ItemText). Scroll buttons avec gradient fade.
- **Migration** : FilterPanel et DataTable toolbar — tous les `<select>` natifs remplacés par ElisaSelect compact
- **Migration modals EDT** : 14 `<select>` natifs migrés vers ElisaSelect (edt-creneau-modal ×6, edt-generation-modal ×1, edt-preferences ×2, jour-ferie-form-modal ×2, edt-datepicker-modal ×2, edt-page ×1). Selects cascading (classe→matière→enseignant) avec `searchable`. Valeurs numériques (mois/année) converties via `String()`/`Number()`. Controller RHF adapté.
- **Fix toolbar anti-chevauchement (v2.1)** : `shrink-0` sur segmented groups (contexte + vues) et boutons, ElisaSelect `w-[clamp(100px,20vw,200px)]` au lieu de `min-w`, `gap-y/gap-x` séparés sur toolbars `flex-wrap`. Groupes actions en `shrink-0`.
- **Segmented groups standard contraste (v2.1)** : fond `surface-alt`, bordures `gray-300` (light) / `var(--color-bordure)` (dark), séparateurs inter-boutons `gray-200`, actif `dominant-600 text-white shadow-sm`, inactif `text-primary` (light) / `text-secondary` (dark). Séparateurs toolbar en `gray-300`. Toggle "afficher tout" aligné sur le pattern solide. Navigation pill `hover:border-dominant-400`.
- **`--color-secondaire` défini (v2.1)** : light `#e5e7eb`, dark `#334155` — corrige ElisaButton `secondary` qui référençait une variable inexistante (fond transparent). Outline variant : `border-gray-300 dark:border-[var(--color-bordure)]`.
- **Palette créneau EDT (v2.2)** : utilitaire `palette-creneau.ts` — génère fond teinté (18%), fond assombri (60%+noir), texte auto (luminance WCAG), bordure (40%), fond badge (10%) depuis couleur matière hex. Utilisé dans month/week/day/synthese. Garantit contraste ≥ 4.5:1 quelle que soit la couleur choisie par l'utilisateur.
- **Créneaux progressifs (v2.2)** : contenu adapté à la taille du slot. Month view : L1=horaire+matière+statut, L2=initiales enseignant+salle (hidden sm). Week view : compact (< 72px)=matière+horaire, normal=+classe, grand (≥ 120px)=+enseignant+salle. Day view : badge classe avec fond palette, enseignant/salle en `text-secondary`.
- **Légende EDT v2 (v2.2)** : surface `surface-alt` pleine, bordure `gray-300 dark:border-bordure`, titre `text-secondary` (pas muted), items `text-primary` (pas secondary). Collapsible (ChevronDown). Badges réduits à 0.625rem.
- **Bordures calendrier light mode (v2.2)** : `gray-300 dark:border-[var(--color-bordure)]` sur grille, cellules, conteneur, labels heures (au lieu de `var(--color-bordure)` trop pâle en light).
- **Synthese barres matières (v2.2)** : barres utilisent `pal.bordure` (teinte 40%) au lieu de couleur brute. Texte heures avec `textShadow` halo pour lisibilité sur fond coloré. Font-size en `clamp()` au lieu de `text-[10px]` fixe.

### Fichiers créés (3)
- `frontend/src/components/ui/data-table/BadgeStatutCreneau.tsx`
- `frontend/src/components/ui/data-table/colonnes-partagees.tsx`
- `frontend/src/components/ui/data-table/index.ts`

### Fichiers modifiés (8)
- `frontend/src/components/ui/ElisaSelect.tsx` : v2 (searchable, compact, dark mode, aria-label)
- `frontend/src/components/ui/FilterPanel.tsx` : SelectFilter → ElisaSelect compact
- `frontend/src/components/ui/DataTable.tsx` : 3 `<select>` natifs → ElisaSelect compact (filtres inline, hauteur ligne, pagination)
- `frontend/src/features/emploi-du-temps/components/heures-cours-page.tsx` : colonnes → composants partagés, BadgeStatut local supprimé
- `frontend/src/features/emploi-du-temps/components/edt-liste.tsx` : colonnes → composants partagés, badges inline → BadgeStatutCreneau
- `frontend/src/features/emploi-du-temps/components/remplacements-page.tsx` : colonnes → composants partagés, BadgeStatutRemplacement → BadgeStatutCreneau
- `frontend/src/features/emploi-du-temps/components/remplacement-stepper-modal.tsx` : dropdown custom 70 lignes → ElisaSelect searchable (10 lignes)

### Fichiers modifiés — migration modals EDT (6 fichiers, 14 selects)
- `edt-creneau-modal.tsx` : 6 `<select>` → ElisaSelect (type créneau, classe searchable, matière searchable cascading, enseignant searchable cascading, jour, salle)
- `edt-generation-modal.tsx` : 1 `<select>` → ElisaSelect (template)
- `edt-preferences.tsx` : 2 `<select>` → ElisaSelect (pays searchable, horaire jour compact)
- `jour-ferie-form-modal.tsx` : 2 `<select>` Controller RHF → ElisaSelect (mois, pays searchable)
- `edt-datepicker-modal.tsx` : 2 `<select>` → ElisaSelect compact (mois, année — valeurs numériques converties)
- `edt-page.tsx` : 1 `<select>` → ElisaSelect compact (filtre contexte avec placeholder dynamique)

## Travail effectué — Session 2026-08-05 (Jours fériés — CRUD + modèles pays + exclusion matérialisation)

### Fonctionnalité complète Jours Fériés
- **CRUD jours fériés** : section dans les préférences EDT (`edt-preferences.tsx`). Tableau liste avec nom, type (récurrent/ponctuel), origine (système/pays/custom), bouton supprimer (non-système).
- **Modèles par pays** : 15 pays Afrique centrale + UEMOA (CM, CI, SN, CG, CD, GA, BF, ML, BJ, TG, NE, GN, TD, CF, GQ). Seeds système modifiables avec jours fériés fixes + variables chrétiens 2025-2027 + fêtes islamiques 2025-2027 (Fin Ramadan + Tabaski). Cameroun par défaut.
- **Chargement modèle** : POST `/api/emploi-du-temps/jours-feries/charger-modele` — copie les JF système du pays vers l'établissement (modifiables). GET `/modeles` liste les pays disponibles.
- **Exclusion JF dans matérialisation** : `preference-emploi-du-temps.exclureJoursFeries` (boolean, défaut true). Dans `materialiserInstances()`, charge les JF de la plage et skip les instances dont la date tombe un JF.

### Backend (10 fichiers)
- **Entités** : `jour-ferie.entity.ts` (+ enum `PaysJourFerie` 15 pays, colonne `pays`, index) ; `preference-emploi-du-temps.entity.ts` (+ colonne `exclureJoursFeries`)
- **DTOs** : `jour-ferie.dto.ts` (+ champ `pays`, `chargerModelePaysSchema`) ; `emploi-du-temps.dto.ts` (+ `exclureJoursFeries`)
- **Service** : `jour-ferie.service.ts` (+ `chargerModelePays()`, `listerModelesPays()`) ; `heure-cours.service.ts` (+ exclusion JF dans `materialiserInstances()`)
- **Controller** : `jours-feries.controller.ts` (+ GET `/modeles`, POST `/charger-modele`, routes réordonnées : statiques avant `/:id`)
- **Migration** : `149-jours-feries-modeles-pays.sql` (ADD COLUMN `pays` + `exclureJoursFeries` + seeds 15 pays : fixes, variables chrétiens, fêtes islamiques)

### Frontend (6 fichiers)
- **Types** : `edt.types.ts` (+ `pays` sur `JourFerie`, `exclureJoursFeries` sur `PreferenceEDT`)
- **Hooks** : `use-jours-feries.ts` (+ `useUpdateJourFerie`, `useChargerModelePays`, `useModelesPays`)
- **Composant** : `edt-preferences.tsx` (+ section Exclusion JF avec toggle, section Jours fériés avec sélecteur pays + bouton charger + tableau liste)
- **i18n** : `fr/emplois.json` + `en/emplois.json` (+32 clés `joursFeries.*` dont 15 noms de pays)

## Travail effectué — Session 2026-08-05 (EDT — Calendrier, Configuration tabs, Templates wizard)

### 1. Calendrier — Jours fériés (vue semaine + mois + légende)

**Vue semaine** (`edt-calendar.tsx`) : détection jour férié par colonne via `estJourFerieFromList()`. Fond semi-transparent `bg-[var(--color-danger)]/5`, bordure supérieure 3px colorée (`jfCouleur`), nom du jour férié affiché sous l'étoile dans le header (texte tronqué).

**Vue mois** (`edt-month-view.tsx`) : `cellClass` amélioré avec paramètre `jfEstFerie` → fond `bg-[var(--color-danger)]/5` + hover `/8`. Badge nom jour férié ajouté (étoile + texte tronqué `max-w-[3rem]`).

**Légende unifiée** (`edt-legend.tsx`, nouveau) : composant réutilisable affichant 4 indicateurs (aujourd'hui, jour férié, créneau validé, créneau en attente). Intégré sous les vues semaine et mois dans `edt-page.tsx`. Thème aware via CSS vars, responsive avec `clamp()`.

### 2. Configuration — Refactor en tabs horizontaux

**`edt-preferences.tsx`** : rewrite complet (660 → ~470 lignes). Structure en 3 onglets :
1. **Calendrier** : Jours travaillés (toggle buttons) + Horaires de cours + Contraintes de planification
2. **Jours fériés** : Exclusion toggle + Gestion JF (table, recherche, filtre, pagination, charger modèle pays, générer variables)
3. **Automation** : Matérialisation automatique (checkbox actif, liste horaires jour+heure, ajouter/supprimer)

Navigation tabs avec icônes (Calendar, Globe, Zap), scrollables horizontalement. Transitions Framer Motion (`AnimatePresence mode="wait"`). Footer sticky avec boutons Réinitialiser + Enregistrer. Validation : si `joursOuvrables` vide → redirection vers tab calendrier.

### 3. Templates — Wizard modal multi-étapes

**`template-wizard-modal.tsx`** (nouveau, ~570 lignes) : wizard 4 étapes via `StepperModal` :
1. **Identité** : Nom (obligatoire 2+ chars), description, partage (checkbox)
2. **Calendrier** : Jours travaillés (toggle buttons), plage horaire (début/fin avec validation), durée créneau (slider 15-120 min)
3. **Contraintes** : Max créneaux/jour, max même matière/jour, max consécutifs (inputs number avec aides)
4. **Preview** : Résumé visuel (4 stats cards + détails groupés : identité, calendrier, contraintes)

Mode création ET édition (prop `template?: TemplateEDT`). Validators par étape. Hook `useModifierTemplateEDT` ajouté (PATCH `/api/emploi-du-temps/templates/:id`).

### 4. Templates — Amélioration cards

**`edt-templates.tsx`** : rewrite des cards avec :
- Bandeau dégradé si template partagé
- Résumé configuration : jours travaillés (pastilles), horaires + durée, contraintes, types de créneau
- Bouton "Appliquer" rapide (primaire, pleine largeur)
- Actions secondaires : Modifier (ouvre wizard en mode édition), Dupliquer, Supprimer
- État vide amélioré avec icône dans un carré arrondi

### 5. Types + Hooks

- `TemplateEDTConfiguration` étendu : `dureeCreneauStandard`, `maxCreneauxParJour`, `maxCreneauxMatiereParJour`, `maxCreneauxConsecutifs`
- `useModifierTemplateEDT()` ajouté dans `use-emploi-du-temps.ts` (PATCH, toast `templateModifie`)

### 6. i18n FR+EN

~70 clés ajoutées dans chaque fichier :
- `legende.*` (5 clés) : titre, aujourd'hui, jour férié, créneau validé, créneau en attente
- `preferences.tabs.*` (3 clés) : calendrier, joursFeries, automation
- `templates.wizard.*` (45+ clés) : toutes les étapes, labels, validations, preview
- `templates.appliquer`, `templates.nonConfigure`, etc. (6 clés cards)
- `toasts.templateModifie`

### Qualité
- 0 erreur TypeScript (compilation `tsc --noEmit` clean)
- 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur
- Toutes les couleurs via CSS vars (`var(--color-*)`)
- Responsive mobile-first avec `clamp()`
- Dark mode natif via CSS vars

### Fichiers modifiés (10)
- `frontend/src/features/emploi-du-temps/components/edt-legend.tsx` (nouveau)
- `frontend/src/features/emploi-du-temps/components/template-wizard-modal.tsx` (nouveau)
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx` (bandes JF)
- `frontend/src/features/emploi-du-temps/components/edt-month-view.tsx` (cellules JF)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (intégration légende)
- `frontend/src/features/emploi-du-temps/components/edt-preferences.tsx` (refactor tabs)
- `frontend/src/features/emploi-du-temps/components/edt-templates.tsx` (cards enrichies)
- `frontend/src/features/emploi-du-temps/types/edt.types.ts` (TemplateEDTConfiguration étendu)
- `frontend/src/features/emploi-du-temps/hooks/use-emploi-du-temps.ts` (useModifierTemplateEDT)
- `frontend/src/features/emploi-du-temps/index.ts` (exports)
- `frontend/src/locales/fr/emplois.json` (+70 clés)
- `frontend/src/locales/en/emplois.json` (+70 clés)

## Travail effectué — Session 2026-08-05 (contraste créneaux + refactor modal génération HC)

### Axe 1 — Palette theme-aware (dark mode)
- **`palette-creneau.ts` v1.1.0** : ajout param `mode: 'light' | 'dark'`. Surface par défaut auto (`#ffffff` light, `#1e293b` dark). `texteSurTeinte` calculé par `couleurTexteAuto()` (luminance WCAG) au lieu de `'#1f2937'` hardcodé. Nouveau hook `useModeTheme()` basé sur `useSyncExternalStore` + MutationObserver sur `data-theme`.
- **`edt-calendar.tsx`** (vue semaine) : CreneauCard toujours tout visible (matière + classe + enseignant initiales + salle code + horaire). Suppression du mode progressif (estCompact/estGrand). Couleurs texte via palette theme-aware. Overlay aussi mis à jour.
- **`edt-day-view.tsx`** (vue jour) : passage `mode` à `paletteCreneau()`.
- **`edt-month-view.tsx`** (vue mois) : passage `mode` à `paletteCreneau()`.

### Axe 2 — Modal génération Heures de Cours refactoré (v2.0)
- **`edt-heures-cours-modal.tsx`** : réécrit sur `StepperModal` partagé (3 étapes).
  - **Étape 1 (Sélection)** : cascade selects (classe → matière → enseignant) + dates. Auto-résolution 1-unique. Chargement autonome via `useAffectationsOptions()` (indépendant des filtres toolbar).
  - **Étape 2 (Résumé)** : récapitulatif enrichi (classe/matière/enseignant/période) avec icônes colorées.
  - **Étape 3 (Résultat)** : statistiques (créées/ignorées/erreurs/total) + fallback valeurs.
- **Interface changée** : `open`/`onOpenChange` + `contexteEnseignantId?`/`contexteClasseAnneeId?` (pré-sélection optionnelle).
- **`edt-page.tsx`** : wrapper `CustomModal` supprimé (le modal gère son propre StepperModal). Props mises à jour.

### Axe 3 — i18n
- 27 nouvelles clés FR+EN dans `generationHeuresCours.*` (étapes, cascade, résumé, résultat).
- Parité FR/EN complète.

### Qualité
- 0 `any`, 0 couleur hardcodée, 0 chaîne FR en dur.
- Tous les composants utilisent `clamp()` et variables CSS.
- Dark mode natif via `useModeTheme()` + `paletteCreneau()`.
- Composant réutilisable : `useModeTheme()` exporté depuis `@/lib`.

### Fichiers modifiés (8)
- `frontend/src/lib/palette-creneau.ts` (v1.1.0 — mode, useModeTheme)
- `frontend/src/lib/index.ts` (export useModeTheme)
- `frontend/src/features/emploi-du-temps/components/edt-calendar.tsx` (toujours tout visible + palette dark)
- `frontend/src/features/emploi-du-temps/components/edt-day-view.tsx` (palette mode)
- `frontend/src/features/emploi-du-temps/components/edt-month-view.tsx` (palette mode)
- `frontend/src/features/emploi-du-temps/components/edt-heures-cours-modal.tsx` (v2.0 — 3 étapes StepperModal)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (invocation mise à jour)
- `frontend/src/locales/fr/emplois.json` (+27 clés)
- `frontend/src/locales/en/emplois.json` (+27 clés)

## Travail effectué — Session 2026-08-07 (fix modal génération HC — boucle infinie)

### Bug corrigé
- **`edt-heures-cours-modal.tsx`** : le `StepperModal` partagé avance les étapes de manière **synchrone**. Quand l'utilisateur clique "Confirmer la génération" à l'étape 2, le StepperModal avance immédiatement à l'étape 3 (`setCurrentStep(2)` synchrone), puis appelle `onSubmit` seulement à la dernière étape. Résultat : l'étape 3 s'affiche avec `resultat === null` → loader infini.
- **Fix v2.1.0** : remplacement du `StepperModal` par `CustomModal` + gestion manuelle des étapes (`etapeCourante`). Le flux async est maintenant contrôlé :
  - Étape 1 → bouton "Suivant" dans le footer → `allerEtapeSuivante()`
  - Étape 2 → bouton "Générer" dans le footer → `handleGenerer()` (async) → **attend la complétion** → `setResultat(res)` → `allerEtapeSuivante()` → étape 3
  - Étape 3 → `resultat` déjà défini → affichage immédiat des stats
- **Avantages** : l'étape 3 ne s'affiche qu'après la génération (plus de loader infini). En cas d'erreur, l'utilisateur reste sur l'étape 2 pour retry. Reset complet à la ré-ouverture.
- **Composants extraits** : `StepperHeader`, `ContenuSelection`, `ContenuResume`, `ContenuResultat` (lisibilité + performance — pas de re-render des étapes non actives).

### Fichier modifié (1)
- `frontend/src/features/emploi-du-temps/components/edt-heures-cours-modal.tsx` (v2.1.0 — CustomModal + étapes manuelles)

## Travail effectué — Session 2026-08-07 (génération HC en masse — multi-sélection)

### Backend — DTO rétro-compatible
- **`heure-cours.dto.ts`** : `genererHeuresCoursFromEdtSchema` étendu avec `affectationMatiereIds` (array uuid, optionnel) + `enseignantId`/`classeAnneeId` conservés (rétro-compat tab-heure-cours). `.refine()` garantit qu'au moins un des deux est fourni.
- **`heure-cours.service.ts`** : `materialiserInstances()` accepte `affectationMatiereIds?: string[]` — filtre `am.id IN (:...affectationMatiereIds)` sur la requête EDT. `genererHeuresCoursFromEdt()` passe les deux paramètres.
- **Flux** : `affectationMatiereIds` prioritaire (multi-sélection) ; `enseignantId` fallback (tab-heure-cours).

### Frontend — Modal multi-sélection v3.0
- **`edt-heures-cours-modal.tsx`** : réécrit. Liste d'affectations à cocher (checkboxes) avec :
  - **Filtre par classe** : chips cliquables (multi-select) pour filtrer les affectations affichées
  - **Cases à cocher** : chaque affectation montre classe × matière × enseignant (icônes colorées)
  - **Tout sélectionner / désélectionner** : bouton dans le SectionSeparator + compteur `N/M`
  - **Étape 2 (Résumé)** : regroupé par classe avec détail matière + enseignant
  - **Étape 3 (Résultat)** : inchangé (stats créées/ignorées/erreurs)
- **`use-heure-cours.ts`** : hook `useGenererHeuresCoursFromEdt` payload élargi (`affectationMatiereIds?` + `enseignantId?` + `classeAnneeId?`)
- **`edt-page.tsx`** : `contexteEnseignantId` retiré de l'invocation (plus pertinent en multi-sélection)
- **`SectionSeparator.tsx`** : nouvelle prop `action?: ReactNode` (contenu aligné à droite — bouton, compteur)

### i18n — 6 nouvelles clés FR+EN
- `infoMultiSelection`, `filtrerParClasse`, `affectationsDisponibles`, `toutSelectionner`, `toutDeselectionner`, `resumeMultiDescription`

### Fichiers modifiés (7)
- `backend/src/modules/personnel/dto/heure-cours.dto.ts` (refine, rétro-compat)
- `backend/src/modules/personnel/services/heure-cours.service.ts` (affectationMatiereIds filter)
- `frontend/src/features/emploi-du-temps/components/edt-heures-cours-modal.tsx` (v3.0 — multi-selection)
- `frontend/src/features/emploi-du-temps/components/edt-page.tsx` (invocation simplifiée)
- `frontend/src/features/personnel/hooks/use-heure-cours.ts` (payload élargi)
- `frontend/src/components/ui/SectionSeparator.tsx` (prop action)
- `frontend/src/locales/fr/emplois.json` (+6 clés)
- `frontend/src/locales/en/emplois.json` (+6 clés)

## Travail effectué — Session 2026-08-07 (ColorPicker v2.0 + cohérence couleurs créneaux)

### Problème résolu
Les couleurs des créneaux étaient incohérentes entre les vues :
- **Calendrier** et **aperçu génération** : couleur de la matière (ex: `#DDA0DD`)
- **Modal d'édition** : couleur propre du créneau avec fallback bleu hardcodé `#3B82F6`
- **Input natif `<input type="color">`** dans un CustomModal : dialogue OS bloqué par le focus trap Radix, pas de bouton Confirmer, lenteur du curseur de teintes

### Cause racine
1. Le modal d'édition utilisait `creneau.couleur` (souvent vide) au lieu de dériver depuis `matiere.couleur`
2. `<input type="color">` natif dans un modal Radix = dialogue OS séparé bloqué par z-index/focus trap

### Corrections appliquées

**ColorPicker v3.0 partagé** (`components/ui/ColorPicker.tsx`) :
- **Suppression de `<input type="color">` natif** — remplacé par palette inline 54 couleurs (12 familles chromatiques)
- **Mode compact** (12 couleurs) + **extensible** (54 couleurs avec familles labelisées)
- **React.memo** sur chaque swatch → O(1) re-render par sélection, 60fps garanti
- **Transitions ciblées** (`transition-transform duration-100 will-change-transform`) — pas de layout thrash
- **Saisie HEX manuelle** avec validation temps réel, normalisation auto, support 3 et 6 caractères
- **Pas de useEffect** pour sync hex → dérivation directe (`isFocused ? hexInput : upperValue`)
- **Rétro-compatibilité** `presetColors` (utilisé par etablissement-edit-page)
- **Check mark SVG** sur la couleur sélectionnée (contraste auto light/dark)
- **`sourceLabel`** : prop optionnelle pour indiquer la source de la couleur (ex: "de la matière")
- **Dark mode** : variables CSS uniquement, pas de classes hardcodées
- **Ultra-responsif** : tous les dimensions en `clamp()`
- **Accessibilité** : `role="radiogroup"`, `aria-checked`, `aria-label`, focus ring visible

**Cohérence couleurs** (`edt-creneau-modal.tsx`) :
- `effectiveCouleur` = `couleurMatiereSelectionnee || form.couleur || '#3b82f6'` — priorité matière
- Intégration du `ColorPicker` partagé (remplace 31 lignes par 7)
- Indicateur source "(de la matière)" via `sourceLabel`

**Module matières** (`matiere-form-modal.tsx`) :
- Remplacement `<input type="color">` natif → `ColorPicker` partagé
- Grille responsive `grid-cols-1 md:grid-cols-2`

**i18n** : 2 clés ajoutées FR+EN (`couleurMatiere`, `couleurHint`)

### Convention ajoutée
**Règle** : JAMAIS d'`<input type="color">` natif dans un CustomModal. Toujours utiliser le `ColorPicker` partagé (`components/ui/ColorPicker.tsx`).

### Fichiers modifiés (5)
- `frontend/src/components/ui/ColorPicker.tsx` (v3.0 — palette 54 couleurs, React.memo, expandable)
- `frontend/src/features/emploi-du-temps/components/edt-creneau-modal.tsx` (ColorPicker + effectiveCouleur)
- `frontend/src/features/matieres/components/matiere-form-modal.tsx` (ColorPicker)
- `frontend/src/locales/fr/emplois.json` (+2 clés)
- `frontend/src/locales/en/emplois.json` (+2 clés)
