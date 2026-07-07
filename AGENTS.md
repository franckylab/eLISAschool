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

### Pending
- Régénérer routeTree.gen.ts (tsr generate — nécessite Node.js)
- Tester les endpoints programmes avec un vrai token JWT
- Vérifier useEnseignantMoyenneEvaluations (bug backend: nombreEvaluations = 0/1)
- Ajouter page gestion chapitres dans détail programme
- Optionnel: filtre par niveau dans le select ajout matière (filtrer par programme.niveauId)

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
| `frontend/src/features/matieres/hooks/use-matieres.ts` | useTousMatieresNiveaux () |
| `frontend/src/features/matieres/types/matiere.types.ts` | MatiereNiveau type |
| `frontend/src/features/enseignants/components/enseignant-detail-page.tsx` | Page détail améliorée |
| `frontend/src/features/enseignants/components/enseignant-detail/hero-header.tsx` | onEdit callback |

## DB Connection
- Host: localhost:7002
- User: elisaschool_user
- Password: elisaschool_password
- Database: elisaschool
