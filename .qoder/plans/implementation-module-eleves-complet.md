# Plan d'Implémentation - Module Élèves Complet

## Contexte

La page "Élèves" d'eLISAschool existe actuellement dans un état partiel : liste basique avec filtres incomplets, boutons sans action, pas de page détail, pas de formulaire création/édition. Le backend est complet (CRUD, préinscriptions, documents) mais il manque quelques endpoints. L'objectif est de rendre **toutes les pages liées aux élèves 100% fonctionnelles et opérationnelles**.

## Approche Recommandée

Implémentation en **10 phases séquentielles** avec dépendances claires, en commençant par les corrections backend bloquantes, puis les traductions, types, hooks, formulaires, et enfin les pages.

---

## Phase 0: Corrections Backend (Bloquant)

### 0.1 Ajouter route GET `/api/eleves/:id`
**Fichier**: `backend/src/modules/eleves/controllers/eleves.controller.ts`
- Insérer entre PATCH et DELETE
- Utiliser `service.findOne(req.params.id)`
- **Complexité**: 5 min

### 0.2 Ajouter routes import/export
**Fichiers**: 
- `backend/src/modules/eleves/controllers/eleves.controller.ts`
- `backend/src/modules/eleves/services/eleves.service.ts`
- Créer méthodes `exportEleves()` (CSV) et `importEleves()` (parsing CSV/Excel)
- **Complexité**: 2-3 heures

---

## Phase 1: Traductions i18n

### 1.1 Créer `eleves.json`
**Nouveau fichier**: `frontend/src/locales/fr/eleves.json`
- ~120 clés: formulaire, statuts, onglets, validation, import
- **Complexité**: 30 min

---

## Phase 2: Correction des Types Frontend

### 2.1 Aligner types avec backend
**Fichier**: `frontend/src/features/eleves/types/eleve.types.ts`
- Ajouter `utilisateurId`, `matricule` dans `CreerEleveDto`
- Corriger `statut`: `'ACTIF' | 'EXCLU' | 'ABANDON' | 'DIPLOME'`
- Ajouter champs parents (nomPere, nomMere, téléphones, etc.)
- Ajouter champs complémentaires (groupeSanguin, allergies, transportScolaire, cantine, etc.)
- **Complexité**: 45 min

---

## Phase 3: Hooks Complémentaires

### 3.1-3.2 Hooks dropdowns
- `useToutesClasses()` → `frontend/src/features/classes/hooks/use-toutes-classes.ts`
- `useToutesAnneesScolaires()` → `frontend/src/features/annees-scolaires/hooks/use-toutes-annees-scolaires.ts`
- **Complexité**: 30 min total

### 3.3-3.5 Hooks données élève
- `useEleveResponsables(id)` → `frontend/src/features/eleves/hooks/use-eleve-responsables.ts`
- `useEleveDocuments(id)` → `frontend/src/features/eleves/hooks/use-eleve-documents.ts`
- `useEleveSuivi(id)` → `frontend/src/features/eleves/hooks/use-eleve-suivi.ts`
- **Complexité**: 1 heure total

---

## Phase 4: Formulaire Élève

### 4.1 Schema Zod
**Nouveau fichier**: `frontend/src/features/eleves/utils/eleve.schema.ts`
- Validation multi-étapes (4 étapes)
- **Complexité**: 30 min

### 4.2 Composant `EleveForm`
**Nouveau fichier**: `frontend/src/features/eleves/components/eleve-form.tsx`
- **Étape 1 - Identité**: nom, prénom, dateNaissance, lieuNaissance, sexe, nationalité, sousSystème, photo
- **Étape 2 - Coordonnées**: adresse, ville, quartier, téléphone, email
- **Étape 3 - Parents**: père (nom, profession, tél, email), mère (idem), tuteur
- **Étape 4 - Complément**: classe (select), année scolaire (select), transport, cantine, boursier, redoublement, groupe sanguin, allergies
- Props: `mode: 'creation' | 'edition'`, `eleve?`, `onSuccess`, `onCancel`
- Validation Zod par étape, barre progression
- **Complexité**: 4-6 heures

---

## Phase 5: Modale Formulaire

### 5.1 `EleveFormModal`
**Nouveau fichier**: `frontend/src/features/eleves/components/eleve-form-modal.tsx`
- Wrapper `CustomModal` + `EleveForm`
- Titre dynamique, taille xl/2xl, confirmation fermeture
- **Complexité**: 1 heure

---

## Phase 6: Page Liste Complète

### 6.1 Compléter `eleves-page.tsx`
**Fichier**: `frontend/src/features/eleves/components/eleves-page.tsx`

**Modifications**:
1. ✅ Filtres avancés: classe, année scolaire, sexe, statut (4 selects)
2. ✅ Bouton "Nouveau" → ouvre modale création
3. ✅ Bouton "Modifier" → ouvre modale édition pré-remplie
4. ✅ Bouton "Voir" → navigation `/eleves/:id`
5. ✅ Export CSV fonctionnel avec filtres
6. ✅ Import CSV/Excel avec template
7. ✅ Sélection en masse + actions groupées
8. ✅ Correction rendu statuts (majuscules)
- **Complexité**: 4-5 heures

---

## Phase 7: Page Détail Élève

### 7.1 Créer `EleveDetailPage`
**Nouveau fichier**: `frontend/src/features/eleves/components/eleve-detail-page.tsx`

**Structure**:
- **En-tête**: Photo, nom, matricule, classe, année, statut, boutons (Modifier, Retour, Actions)
- **5 Onglets**:
  1. **Informations**: Identité, Contact, Parents (Père/Mère/Tuteur), Services
  2. **Scolarité**: Notes, Bulletins, Absences, Discipline (liens modules)
  3. **Finances**: Résumé financier, paiements, lien module finances
  4. **Documents**: Documents justificatifs, upload, téléchargement
  5. **Historique**: Timeline événements (création, modifications, changements)

- Hooks: `useEleve(id)`, `useEleveDocuments(id)`, `useEleveSuivi(id)`
- Animations Framer Motion pour transitions onglets
- **Complexité**: 6-8 heures

---

## Phase 8: Route Détail

### 8.1 Route TanStack Router
**Nouveau fichier**: `frontend/src/app/routes/_auth.eleves.$id.tsx`
```typescript
import { createFileRoute } from '@tanstack/react-router';
import { EleveDetailPage } from '@/features/eleves/components/eleve-detail-page';

export const Route = createFileRoute('/_auth/eleves/$id')({
  component: EleveDetailPage,
});
```
- **Complexité**: 5 min

---

## Phase 9: Pages Liées

### 9.1 Page Responsables Élève
**Nouveau fichier**: `frontend/src/features/responsables/components/responsables-eleve-page.tsx`
- Liste responsables liés à élève avec infos contact
- Formulaire ajout responsable
- **Complexité**: 2-3 heures

### 9.2 Page Suivi Élève (Discipline)
**Nouveau fichier**: `frontend/src/features/suivi-eleves/components/suivi-eleve-page.tsx`
- 4 onglets: Incidents, Sanctions, Félicitations, Observations
- Liste + formulaire par onglet
- **Complexité**: 4-5 heures

---

## Phase 10: Tests et Validation

### Stratégie de test
1. **Fonctionnel**: Création, modification, suppression, navigation, filtres combinés, import/export
2. **RBAC**: Vérifier permissions par rôle (ADMIN, PERSONNEL, CHEF_ETABLISSEMENT)
3. **Responsive**: Desktop, tablette, mobile
4. **Accessibilité**: Navigation clavier, aria-labels, contraste
5. **TypeScript**: `tsc --noEmit` → 0 erreur

---

## Fichiers à Créer (11)

| # | Fichier | Complexité |
|---|---------|------------|
| 1 | `frontend/src/locales/fr/eleves.json` | Faible |
| 2 | `frontend/src/features/classes/hooks/use-toutes-classes.ts` | Faible |
| 3 | `frontend/src/features/annees-scolaires/hooks/use-toutes-annees-scolaires.ts` | Faible |
| 4 | `frontend/src/features/eleves/hooks/use-eleve-documents.ts` | Faible |
| 5 | `frontend/src/features/eleves/utils/eleve.schema.ts` | Moyenne |
| 6 | `frontend/src/features/eleves/components/eleve-form.tsx` | Haute |
| 7 | `frontend/src/features/eleves/components/eleve-form-modal.tsx` | Moyenne |
| 8 | `frontend/src/features/eleves/components/eleve-detail-page.tsx` | Haute |
| 9 | `frontend/src/app/routes/_auth.eleves.$id.tsx` | Faible |
| 10 | `frontend/src/features/responsables/components/responsables-eleve-page.tsx` | Moyenne |
| 11 | `frontend/src/features/suivi-eleves/components/suivi-eleve-page.tsx` | Haute |

## Fichiers à Modifier (4)

| # | Fichier | Modifications |
|---|---------|---------------|
| 1 | `frontend/src/features/eleves/types/eleve.types.ts` | Aligner avec backend |
| 2 | `frontend/src/features/eleves/components/eleves-page.tsx` | Filtres, actions, modal, sélection |
| 3 | `frontend/src/features/eleves/hooks/use-eleves.ts` | Ajuster types |
| 4 | `backend/src/modules/eleves/controllers/eleves.controller.ts` | GET /:id, export, import |

---

## Points d'Attention Techniques

1. **Multi-tenancy**: Toutes les requêtes filtrées par `etablissementId` (injecté par middleware)
2. **Matricule auto-généré**: Vérifier si le service backend le génère automatiquement
3. **Utilisateur lié**: Le backend exige `utilisateurId` → créer compte utilisateur + élève en transaction
4. **Format dates**: `YYYY-MM-DD` obligatoire pour `dateNaissance`
5. **Upload photo**: Endpoint upload d'image retourne URL string
6. **Cache**: Invalider caches après mutations (déjà dans hooks existants)
7. **Statuts**: Backend utilise majuscules (`ACTIF`, `EXCLU`) → adapter frontend

---

## Vérification Finale

- [ ] Création élève via formulaire 4 étapes
- [ ] Modification élève (pré-remplissage correct)
- [ ] Suppression avec confirmation
- [ ] Navigation liste → détail → retour
- [ ] Filtres combinés (recherche + classe + année + sexe + statut)
- [ ] Export CSV avec filtres
- [ ] Import CSV avec rapport erreurs
- [ ] Permissions RBAC fonctionnelles
- [ ] Responsive desktop/tablette/mobile
- [ ] Accessibilité (navigation clavier, aria-labels)
- [ ] TypeScript strict sans erreurs
- [ ] Animations fluides
- [ ] Traductions complètes

**Estimation totale**: ~32 heures de développement
