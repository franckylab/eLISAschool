# eLISAschool — Session Context

## Goal
- Page détail enseignant fonctionnelle : 7 onglets opérationnels avec données réelles, sans erreur runtime.

## Progress

### Done
- **Architecture multi-composants** : `enseignant-detail-page.tsx` comme layout + 7 onglets dans `enseignant-detail/` (Informations, Matières & Classes, EDT, Contrat & Salaire, Évaluations, Absences, Parcours)
- **11 hooks TanStack Query** dans `use-enseignants.ts` avec chargement lazy par onglet (`enabled: tabActif === 'x'`)
- **Types frontend mis à jour** pour correspondre exactement aux entités backend (field names réels) :
  - `ContratEnseignant` : `salaireBase` (pas `salaire`), `poste?: { id; nom; code }`
  - `BulletinPaie` : `deductions` / `salaireNet` (pas `retenues` / `netAPayer`), ajout `heuresEffectuees`, `montantHeuresSup`, `contratId`
  - `AbsenceEnseignant` : `date` unique (pas `dateDebut`/`dateFin`), `type`, `statutJustification` (enum), `heureDebut`, `heureFin`
  - `ParcoursComplet` : `statistiquesAbsences` (pas `absences`), `evolutionSalariale` (pas `salaireEvolution`), `anciennete: { annees, mois, jours }`
  - `AssiduiteStats` : ajout `periode`, transformation `tauxPresence` → `tauxAbsenteisme`
- **Hooks corrigés** pour dépaqueter les réponses paginées (`response.data.items` au lieu de `response.data`)
- **Composants mis à jour** pour utiliser les bons field names partout
- **Backend redémarré** : 2 endpoints qui retournaient 404 (`/api/matieres/enseignants/:id/affectations`, `/api/personnel/heures-cours/enseignants/:id/edt`) répondent maintenant 401 (auth required, route existe)
- `dateNaissance`, `sexe`, `departement` ajoutés à l'entité `MembrePersonnel`, DTO, et frontend

### Pending
- Test fonctionnel complet : naviguer les 7 onglets avec un vrai token JWT
- Vérifier que `useEnseignantMoyenneEvaluations` marche (le backend a un bug : `nombreEvaluations` vaut 0 ou 1, pas le vrai compte)

## Key Decisions
- Multi-composants (option B)
- Endpoint matières dans le module matieres (option A)
- Chargement hybride header + lazy tabs
- EDT grille + liste (option C)
- Retour hook = `response.data` (pattern projet)
- Types frontend calqués sur les entités backend (pas d'abstraction supplémentaire)

## Références
| Fichier | Rôle |
|---------|------|
| `frontend/src/features/enseignants/hooks/use-enseignants.ts` | 11 hooks avec transformations API |
| `frontend/src/features/enseignants/types/enseignant.types.ts` | Types alignés sur le backend |
| `frontend/src/features/enseignants/components/enseignant-detail/*.tsx` | 7 onglets |
| `backend/src/app.ts:421-431` | Montage des routes personnel |
| `backend/src/modules/personnel/controllers/*.ts` | Controllers backend |

## DB Connection
- Host: localhost:7002
- User: elisaschool_user
- Password: elisaschool_password
- Database: elisaschool
