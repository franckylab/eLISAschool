# eLISAschool — Session Context

## Goal
Analyse profonde et développement complet du système programmes (backend + frontend) dans eLISAschool, avec amélioration de la page détail enseignant.

## Constraints & Preferences
- Système multi-tenant avec etablissementId sur toutes les entités
- TypeORM + Express (backend), TanStack Router + React Query + Zustand (frontend)
- Synchronisation automatique en dev (synchronize: true)
- Pagination via paginateWithQueryBuilder, réponses API standardisées { success, data }
- Pattern module: entities/, dto/, services/, controllers/, index.ts
- Zod validation pour tous les DTOs, endpoints REST RESTful
- Frontend: barrel export via index.ts dans chaque feature, hooks React Query par feature

## Progress
### Done
- **BUG CRITIQUE: `response.data?.data` vide** — Tous les hooks du module organisation (et `useTousChapitres`) utilisaient `response.data?.data` alors que le backend retourne `{ success, data: [...array], pagination }`. `response.data` EST déjà l'array. Le `.data` additionnel renvoyait `undefined` → `[]` systématiquement.
  - Fix: supprimer `.data` redondant, `response.data` = array directement, `response.pagination` = meta (cast `as any` car hors type ApiResponse).
  - Hooks impactés: useOrganisations, useOrganisation, useCreerOrganisation, useModifierOrganisation, useUnites, useUnite, useCreerUnite, useModifierUnite, useArborescence, usePostes, usePoste, useCreerPoste, useModifierPoste, useAssignerOccupant, useLibererPoste, usePostesVacants, useHierarchies, useSuperieurs, useSubordonnes, useCreerHierarchie, useModifierHierarchie, useOrganigramme, useStatistiquesOrganisation, useTousChapitres
  - Add `tableId="organisations-page"` au DataTable + `onPageChange={setPage}`
- Analyse complète architecture backend (programmes, classes, cycles, niveaux, matières, personnel)
- Analyse complète architecture frontend (programmes, classes, matières, enseignants, API client, routes)
- Création entité ProgrammePedagogique (programmes_pedagogiques) avec relations Cycle, Niveau, ProgrammeMatiere
- Création entité ProgrammeMatiere (programmes_matieres, jonction programme ↔ matiere_niveau)
- Création DTOs: createProgrammeSchema, updateProgrammeSchema, queryProgrammesSchema, addMatiereProgrammeSchema
- Création service ProgrammePedagogiqueService (CRUD + matieres management avec pagination, recherche, filtres)
- Création controller programme-pedagogique.controller.ts (routes REST)
- Mise à jour index.ts du module programmes (fusion des 3 controleurs: chapitres, correlation, programmes)
- Migration SQL 070-programmes-pedagogiques.sql
- Frontend: types programme.types.ts enrichis
- Frontend: hooks use-programmes.ts rebuild (8 hooks)
- Frontend: programme-form-modal.tsx refactoré (tous champs + cycles/niveaux API)
- Frontend: programme-detail-page.tsx créée (7 tabs, cards, table matières, ajout/retrait matière)
- Frontend: route _auth/programmes.$id.tsx
- Frontend: programmes-page.tsx mise à jour (navigation détail)
- Backend: GET /api/matieres/programme (liste tous matieres-niveaux) + service getAllMatieresNiveaux
- Frontend: useTousMatieresNiveaux hook + select dropdown peuplé dans programme-detail
- enseignant-detail-page: state showEditModal + render EnseignantFormModal + query invalidation
- hero-header: prop onEdit + bouton Modifier actif
- Clarification backend: getProgrammeNiveau → getMatieresParNiveau, updateProgramme → updateMatiereNiveau, commentaires section "GRILLE MATIÈRE PAR NIVEAU"
- Déduplication types frontend: ProgrammePedagogique/ProgrammeMatiereExtended supprimés de matiere.types.ts, import unique depuis programme.types.ts

## Modèle mental — Grille matière vs Programme pédagogique
- **MatiereNiveau** (grille matière-niveau) = source de vérité pour coefficient, barème, volumeHoraire, credits, obligatoire. Définit les matières enseignées dans chaque niveau.
- **ProgrammePedagogique** (programme pédagogique) = agrégat nommé qui référence des matières via ProgrammeMatiere. Les valeurs coefficient/volumeHoraire sur ProgrammeMatiere sont des surcharges optionnelles ("Hérité" = valeur de MatiereNiveau utilisée).
- **ConfigurationMatiereClasse** = surcharge par classe réelle (valeurs effectives = cascade MatiereNiveau → ProgrammeMatiere → ConfigurationMatiereClasse).
- Voir JSDoc dans `matiere-niveau.entity.ts` et `programme-matiere.entity.ts` pour la chaîne de résolution complète.

### Done (this session)
- **BUG: PUT /configuration/:cle 400 MISSING_VALUE** — `tab-configuration.tsx` avait 3 bugs :
  1. `onChange={(v) => ...}` → `v` est `ChangeEvent`, pas la string → stockait l'objet event dans le state
  2. `valeur: values[key] || undefined` → quand `values[key] = ''` ou `undefined`, JSON supprime la clé → body `{}` → 400
  3. State `values` jamais initialisé → `values[item.key] = undefined` même si l'input affichait la valeur par défaut via `?? item.defaultValue`
  - Fix: initialiser state avec les defaults, `onChange={(e) => e.target.value}`, envoyer `values[key]` directement
- **BUG: PUT /configuration/:cle 400 INVALID_TYPE** — La `validerType` attend un `number` (param défini `type: 'number'`), mais le frontend envoie `"300"` (string) depuis l'input HTML. `typeof "300" !== 'number'` → 400.
  - Fix backend `setParametre` : coerce `string` → `number`/`boolean` selon `param.type` avant la validation. `parsed = Number(valeur)` avec garde `isNaN`.
- **BUG Persistant: `etablissementId` non injecté à la création** — Le controller POST `/organisations` ne remplissait pas `etablissementId` depuis le JWT. L'entité le stockait `null`. La requête LIST filtrant par `etablissementId`, les organisations créées via l'UI étaient invisibles.
  - Fix controller: `dto.etablissementId = req.utilisateur?.etablissementId` après validation Zod
  - Fix controller PATCH: `delete dto.etablissementId` (empêcher changement d'affiliation)
  - Ajout filtres `search`/`type`/`statut` au service `findAllOrganisationsPaginated` + controller (le frontend les envoyait mais le backend les ignorait)
  - Ajout `Like` à l'import TypeORM dans le service
- Fix chapitres-catalogue-page (legacy `matiereNiveauId` → `programmeMatiere.matiereNiveau`, filtre par programme, ajout d'un créateur de chapitre en 2 étapes avec sélection programme + matière)
- Ajout paramètre `programmeId` au hook `useTousChapitres` (back-end le supportait déjà)
- Vérification bug useEnseignantMoyenneEvaluations : requête OK, probablement absence de données réelles
- **Refonte page détail matières**: séparation onglets Niveaux (MatiereNiveau CRUD) et Programmes (ProgrammesPedagogiques) avec nouveau layout 6 tabs
- Backend: ajout `deleteMatiereNiveau` service + `DELETE /api/matieres/programme/:id` pour CRUD complet MatiereNiveau
- Frontend: création `tab-niveaux.tsx` — onglet Niveaux avec DataTable, ajout inline, édition inline, suppression avec confirmation, select Niveau depuis API
- Frontend: refactor `tab-programme.tsx` — ne montre plus que les programmes pédagogiques (Section 2 de l'ancien composant)
- Frontend: refactor `matiere-detail-page.tsx` — nouveau layout 6 onglets (Infos → Niveaux → Programmes → Enseignants → Configurations → EDT), stats cards à 5 colonnes
- Frontend: hooks `useAjouterMatiereNiveau`, `useModifierMatiereNiveau`, `useSupprimerMatiereNiveau` dans `use-matieres.ts`
- Nettoyage imports inutilisés (GraduationCap, Ban, ArrowUpDown)

### Pending
- Vérifier build frontend (nécessite Node.js — tsc -b pour typecheck)
- Tester les endpoints programmes avec un vrai token JWT + tester CRUD MatiereNiveau via nouveau onglet
- Ajouter plus de champs dans ChapitreFormModal (statut, période, ressources, prérequis)
- Connecter vraies données pour vérifier EDT/Affectations

## Références (ajouts)

## Key Decisions
- Multi-composants (option B pour détail enseignant)
- Endpoint matières dans le module matieres (option A)
- Chargement hybride header + lazy tabs
- EDT grille + liste (option C)
- Retour hook = `response.data` (pattern projet)
- Types frontend calqués sur les entités backend
- ProgrammePedagogique distinct de ProgrammeChapitre
- Type "CYCLE" | "NIVEAU" | "PERSONNALISE" pour flexibilité du scope du programme
- ProgrammeMatiere en jonction dédiée (coefficients/volumes surchargés)
- Permission "programmes:config:write" pour les actions d'écriture

## Références
| Fichier | Rôle |
|---------|------|
| `backend/src/modules/programmes/entities/programme-pedagogique.entity.ts` | Entité programmes_pedagogiques |
| `backend/src/modules/programmes/entities/programme-matiere.entity.ts` | Jonction programmes_matieres |
| `backend/src/modules/programmes/dto/programme-pedagogique.dto.ts` | Schémas Zod |
| `backend/src/modules/programmes/services/programme-pedagogique.service.ts` | Service CRUD |
| `backend/src/modules/programmes/controllers/programme-pedagogique.controller.ts` | Routes REST |
| `backend/src/modules/programmes/index.ts` | Barrel + fusion routers |
| `backend/src/modules/matieres/controllers/matieres.controller.ts` | Route GET /programme ajoutée |
| `backend/src/modules/matieres/services/matieres.service.ts` | getAllMatieresNiveaux() |
| `backend/src/database/migrations/070-programmes-pedagogiques.sql` | Migration production |
| `frontend/src/features/programmes/types/programme.types.ts` | Interfaces TypeScript |
| `frontend/src/features/programmes/hooks/use-programmes.ts` | Hooks React Query |
| `frontend/src/features/programmes/components/programmes-page.tsx` | Liste + DataTable |
| `frontend/src/features/programmes/components/programme-form-modal.tsx` | Modal création/édition |
| `frontend/src/features/programmes/components/programme-detail-page.tsx` | Détail tabbé |
| `frontend/src/routes/_auth/programmes.$id.tsx` | Route détail |
| `frontend/src/features/matieres/types/matiere.types.ts` | MatiereNiveau type (réexporte ProgrammePedagogique/ProgrammeMatiere depuis programme.types.ts) |
| `frontend/src/features/matieres/components/tab-programme.tsx` | Programmes pédagogiques par matière (refactoré: ne montre plus MatiereNiveau) |
| `frontend/src/features/matieres/components/tab-niveaux.tsx` | Onglet Niveaux: CRUD MatiereNiveau (ajout, édition inline, suppression) |
| `frontend/src/features/matieres/hooks/use-matieres.ts` | Hooks matières (useTousMatieresNiveaux, useMatiereProgrammesPedagogiques, etc.) + hooks CRUD MatiereNiveau |
| `frontend/src/features/enseignants/components/enseignant-detail-page.tsx` | Page détail améliorée |
| `frontend/src/features/enseignants/components/enseignant-detail/hero-header.tsx` | onEdit callback |

## DB Connection
- Host: localhost:7002
- User: elisaschool_user
- Password: elisaschool_password
- Database: elisaschool
