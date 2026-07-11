# eLISAschool — Session Context

## Objective
Finaliser le module paie RH (4 modes de rémunération, génération bulletins, HeureCours) + vue HeureCours détail personnel, dashboard paie, PDF bulletin, affectations. Audit bugs dashboard.

## Constraints & Preferences
- Système multi-tenant avec etablissementId sur toutes les entités
- TypeORM + Express (backend), TanStack Router + React Query + Zustand (frontend)
- Pagination via paginateWithQueryBuilder, réponses API standardisées { success, data }
- Pattern module: entities/, dto/, services/, controllers/, index.ts
- Zod validation pour tous les DTOs, endpoints REST RESTful
- Frontend: barrel export via index.ts dans chaque feature, hooks React Query par feature

## Progress
### Phase 2 — Contrat-centric refactor ✓
- **Migration script** — `backend/src/database/migrations/1786000000000-ContratCentricSync.ts` : ajoute colonnes `posteId`/`contratId` (idempotent), lie `AffectationPoste`/`MembreFonction` aux contrats par membre+dates, synchronise `Poste.occupantId` avec contrats, crée les `MembreFonction` manquants
- **i18n contrat** — `frontend/src/locales/fr/contrat.json` : ~60 clés pour wizard (steps, labels, récap, erreurs)
- **Wizard contrat** — `frontend/src/features/personnel/components/contrat-wizard-modal.tsx` : 5 étapes (Member&Type → Poste → Fonctions → Rémunération → Récap) avec sélecteur poste filtré (vacants + actuel membre), tags fonctions secondaires. Intégré dans `contrats-paie-page.tsx` en remplacement du formulaire plat
- **Read-only onglets** — `personnel-detail-page.tsx` : supprimé `AffecterPosteModal`, boutons "Nouvelle affectation"/"Terminer". `tab-fonctions.tsx` : read-only (plus de modal assignation/bouton retrait)
- **ContratPersonnel type** enrichi (`posteId`, `PostePartial`, `typeContratId`, `renouvellementAuto`, `clauses`)

### Phase 1 — Paie & HeureCours ✓
- **Refactor fusion paie** — `genererBulletin` délègue à `calculerBulletin`
- **Simulation paie** — `simulerPaie` retourne `detailParMatiere`
- **Frontend paie** — 7 features : Simuler, Régénérer, Masse, filtres, Marquer payé, groupement éléments, 5 stats cards
- **PDF bulletin** — endpoint HTML print-ready + bouton téléchargement
- **HeureCours** — `tab-heure-cours.tsx` (toggle mensuel/hebdo, stats, EDT 6 colonnes)
- **Bug fixes** — `classe` ReferenceError, `genre→sexe`, `'actif'→'ACTIF'`, colonne `actif`, `e.classe`, cache key userId, `Promise.race`

### Pending
- Connecter vraies données EDT/Affectations

## Modèle mental — Grille matière vs Programme pédagogique
- **MatiereNiveau** = source de vérité pour coefficient, barème, volumeHoraire, credits, obligatoire
- **ProgrammePedagogique** = agrégat nommé référençant des matières via ProgrammeMatiere (surcharges optionnelles)
- **ConfigurationMatiereClasse** = surcharge par classe réelle (cascade MatiereNiveau → ProgrammeMatiere → ConfigurationMatiereClasse)

## Key Decisions
- Multi-composants (option B pour détail enseignant)
- Retour hook = `response.data` (pattern projet)
- ProgrammePedagogique distinct de ProgrammeChapitre
- Permission "programmes:config:write" pour actions d'écriture

## Références
| Fichier | Rôle |
|---------|------|
| `backend/src/modules/personnel/services/calcul-paie.service.ts` | Refactor + audit/workflow/detailParMatiere |
| `backend/src/modules/personnel/services/bulletin-paie.service.ts` | genererBulletin délègue à calculerBulletin |
| `backend/src/modules/personnel/controllers/calcul-paie.controller.ts` | simuler + mois/annee |
| `backend/src/modules/personnel/controllers/bulletin-paie.controller.ts` | Routes génération + éléments + PATCH statut + PDF |
| `backend/src/modules/bulletins/services/bulletins.service.ts` | Fix ReferenceError classe + getGenerationStatus |
| `backend/src/modules/dashboard/services/dashboard-data.service.ts` | Fix genre/actif/e.classe/actif-column |
| `backend/src/modules/dashboard/services/data-aggregator.service.ts` | Fix cacheKey userId, Promise.race |
| `backend/src/modules/dashboard/services/dashboard-cache.service.ts` | Cache LRU + Redis + invalidation contextuelle |
| `backend/src/database/migrations/1786000000000-ContratCentricSync.ts` | Migration contrat-centric (posteId/contratId sync) |
| `backend/src/modules/personnel/services/contrat.service.ts` | Contrat CRUD + syncAffectationPoste + syncFonctions |
| `frontend/src/features/personnel/hooks/use-paie.ts` | +useSimulerPaie, useRegenererBulletin, useGenererBulletinsMasse, useRapportPaie |
| `frontend/src/features/personnel/hooks/use-heure-cours.ts` | Hook HeureCours (resume, EDT, volume) |
| `frontend/src/features/personnel/components/contrats-paie-page.tsx` | Toutes features bulletins + stats paie + wizard intégré |
| `frontend/src/features/personnel/components/personnel-detail-page.tsx` | Onglets affectations + heures-cours + PDF (read-only) |
| `frontend/src/features/personnel/components/tab-heure-cours.tsx` | Vue HeureCours mensuel/hebdo |
| `frontend/src/features/personnel/components/contrat-wizard-modal.tsx` | Wizard 5 steps contrat (poste + fonctions secondaires) |
| `frontend/src/features/personnel/components/tab-fonctions.tsx` | Read-only (fonctions gérées par contrat) |
| `frontend/src/locales/fr/contrat.json` | i18n wizard contrat |
| `frontend/src/features/personnel/types/personnel.types.ts` | +SimulationResult, DetailMatiereSimulation, RapportPaieMensuel |

## DB Connection
- Host: localhost:7002 / User: elisaschool_user / Password: elisaschool_password / Database: elisaschool
