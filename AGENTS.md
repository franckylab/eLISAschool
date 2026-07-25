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

## Next Move
Refonte v4.0 organisation : ✅ terminée. Hiérarchie v4.1 (superieurPosteId + réintégration page + overlay organigramme) : ✅ terminée.
1. ~~Exécuter la migration 122~~ ✅ appliquée en local (2026-07-25) : étape 5 ajoutée (purge des 26 relations orphelines — superieurId nullé par l'ancienne FK). État final : 26 poste→poste + 1 personne→personne, 0 orphelin, serveur OK (health 200).
2. ~~Migration DB Notes/Bulletins~~ ✅ `123-refonte-notes-bulletins.sql` appliquée en local (2026-07-25) : enseignantId nullable=YES, index unique bulletins présent, 0 remap nécessaire (UPDATE 0/DELETE 0). Reste à appliquer sur staging/prod.
3. ~~Migration 124~~ ✅ `124-fix-hierarchie-orphelins.sql` créée + appliquée en local (2026-07-25) : NULL-out idempotent des références orphelines (superieurId/superieurPosteId/personnelId/posteId) + purge des lignes sans sémantique. 0 changement (DB déjà assainie), 27 relations valides. À appliquer sur staging/prod.
4. **Tests** : phase dédiée après stabilisation (organisation + hiérarchie + notes/bulletins)
5. **Migrations 125 + 126** : ✅ appliquées en local (2026-07-25, session grill-me organisation). À appliquer sur staging/prod (avec 122/123/124).
6. ~~Data gap seeds~~ ✅ résolu (2026-07-25) : `seed-matieres-niveaux.ts` refondu — 7 profils de programme (MATERNELLE, PRIMAIRE_BAS/HAUT, COLLEGE_BAS/HAUT, LYCEE_BAS/HAUT) mappés sur les 31 niveaux FR+EN. Exécuté pour les 2 établissements : +176 associations, total 498, 0 niveau sans programme. Vérifié : génération bulletins Quatrième → moyennes pondérées correctes (2.52/1.91), rangs 1/2, 18 bulletins_matieres. Données de test nettoyées. Standalone du seed boucle désormais sur tous les établissements.

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
