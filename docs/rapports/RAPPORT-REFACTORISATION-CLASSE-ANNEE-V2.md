# 🎯 RAPPORT DE RÉFACTORISATION - Architecture Académique v2

> **Date**: 2026-06-27  
> **Auteur**: franck arlos chendjou  
> **Statut**: ✅ Backend entities + migration complétés, DTOs partiellement mis à jour  
> **Prochaine étape**: Services, Controllers, Frontend

---

## 📊 SYNTHÈSE DES MODIFICATIONS

### ✅ COMPLÉTÉ (Backend - Structure)

#### 1. **Entités TypeORM (6/6)** ✅

| Entité | Fichier | Modifications |
|--------|---------|---------------|
| **Classe** | `backend/src/modules/classes/entities/classe.entity.ts` | ❌ Supprimé: `anneeScolaireId`, `professeurPrincipalId`, `effectifMax`, `effectifActuel`<br>✅ `ClasseAnnee` = source de vérité |
| **Bulletin** | `backend/src/modules/bulletins/entities/bulletin.entity.ts` | ❌ Supprimé: `classeId`, `anneeScolaireId`<br>✅ `classeAnneeId` obligatoire |
| **Note** | `backend/src/modules/notes/entities/note.entity.ts` | ❌ Supprimé: `anneeScolaireId`<br>✅ `classeAnneeId` obligatoire |
| **EmploiDuTemps** | `backend/src/modules/emploi-du-temps/entities/emploi-du-temps.entity.ts` | ❌ Supprimé: `classeId`<br>✅ `classeAnneeId` obligatoire |
| **AffectationMatiere** | `backend/src/modules/matieres/entities/affectation-matiere.entity.ts` | ❌ Supprimé: `classeId`, `anneeScolaireId`<br>✅ `classeAnneeId` obligatoire |
| **ConfigurationMatiereClasse** | `backend/src/modules/matieres/entities/configuration-matiere-classe.entity.ts` | ❌ Supprimé: `classeId`, `anneeScolaireId`<br>✅ `classeAnneeId` obligatoire |

#### 2. **Migration SQL** ✅

- **Fichier**: `backend/database/migrations/092-refactorisation-classeAnneeId.sql`
- **Statut**: ✅ Exécutée avec succès
- **Résultat**:
  - Backup créé (5 tables)
  - Colonnes `classeAnneeId` ajoutées et rendues obligatoires
  - Anciennes colonnes supprimées
  - Index recréés
  - Tables vides (pas de données à migrer)

#### 3. **DTOs (2/6)** ✅

| Module | Fichier | Statut |
|--------|---------|--------|
| **Bulletins** | `backend/src/modules/bulletins/dto/bulletins.dto.ts` | ✅ `classeAnneeId` au lieu de `classeId` + `anneeScolaireId` |
| **Notes** | `backend/src/modules/notes/dto/note.dto.ts` | ✅ `classeAnneeId` obligatoire |
| **EmploiDuTemps** | `backend/src/modules/emploi-du-temps/dto/emploi-du-temps.dto.ts` | ⏳ À faire |
| **Matieres** | `backend/src/modules/matieres/dto/matieres.dto.ts` | ⏳ À faire |
| **Classes** | `backend/src/modules/classes/dto/classes.dto.ts` | ⏳ À faire |
| **ConfigurationMatiereClasse** | (dans matieres.dto.ts) | ⏳ À faire |

---

### ⏳ RESTE À FAIRE (Priorisé)

#### **Phase 1: Backend - Services & Controllers** (CRITIQUE)

**Fichiers à modifier** (~18 fichiers):

1. **Bulletins**:
   - `backend/src/modules/bulletins/services/bulletin.service.ts`
   - `backend/src/modules/bulletins/controllers/bulletins.controller.ts`

2. **Notes**:
   - `backend/src/modules/notes/services/note.service.ts`
   - `backend/src/modules/notes/controllers/notes.controller.ts`

3. **EmploiDuTemps**:
   - `backend/src/modules/emploi-du-temps/services/emploi-du-temps.service.ts`
   - `backend/src/modules/emploi-du-temps/controllers/emploi-du-temps.controller.ts`

4. **Matieres**:
   - `backend/src/modules/matieres/services/affectation-matiere.service.ts`
   - `backend/src/modules/matieres/services/configuration-matiere-classe.service.ts`
   - `backend/src/modules/matieres/controllers/affectation-matiere.controller.ts`
   - `backend/src/modules/matieres/controllers/configuration-matiere-classe.controller.ts`

5. **Classes**:
   - `backend/src/modules/classes/services/classes.service.ts`
   - `backend/src/modules/classes/services/classes-annees.service.ts`
   - `backend/src/modules/classes/controllers/classes.controller.ts`
   - `backend/src/modules/classes/controllers/classes-annees.controller.ts`

**Modifications type pour chaque service**:
```typescript
// ❌ AVANT
const bulletins = await repo.find({
    where: { 
        classeId, 
        anneeScolaireId,
        periodeId 
    }
});

// ✅ APRÈS
const bulletins = await repo.find({
    where: { 
        classeAnneeId,
        periodeId 
    },
    relations: ['classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire']
});
```

#### **Phase 2: Frontend - Modules Métier** (IMPORTANT)

**Modules à mettre à jour** (commencer par ordre de priorité):

1. **Module Matières** (~8 fichiers frontend):
   - `frontend/src/features/matieres/components/`
   - `frontend/src/features/matieres/hooks/`
   - Types: `frontend/src/features/matieres/types/`

2. **Module Classes** (~8 fichiers frontend):
   - `frontend/src/features/classes/components/`
   - `frontend/src/features/classes/hooks/`
   - Types: `frontend/src/features/classes/types/`

3. **Module Années Scolaires** (~6 fichiers frontend):
   - `frontend/src/features/annees-scolaires/components/`
   - `frontend/src/features/annees-scolaires/hooks/`

4. **Configuration Matière-Classe** (~6 fichiers frontend):
   - `frontend/src/features/configuration-matiere-classe/`

**Modifications type pour le frontend**:
```typescript
// ❌ AVANT - Appel API
const { data } = apiClient.get('/api/bulletins', {
    params: { classeId, anneeScolaireId, periodeId }
});

// ✅ APRÈS - Appel API
const { data } = apiClient.get('/api/bulletins', {
    params: { classeAnneeId, periodeId }
});

// ❌ AVANT - Type TypeScript
interface BulletinQuery {
    classeId: string;
    anneeScolaireId: string;
    periodeId: string;
}

// ✅ APRÈS - Type TypeScript
interface BulletinQuery {
    classeAnneeId: string;
    periodeId: string;
}
```

---

## 🔍 CHECKLIST DE VALIDATION

### Backend
- [ ] DTOs restants mis à jour (4 fichiers)
- [ ] Services mis à jour (~10 fichiers)
- [ ] Controllers mis à jour (~8 fichiers)
- [ ] Compilation TypeScript sans erreur
- [ ] Tests unitaires passent
- [ ] API endpoints répondent correctement

### Frontend
- [ ] Module Matières: types, hooks, components
- [ ] Module Classes: types, hooks, components
- [ ] Module Années Scolaires: types, hooks, components
- [ ] Configuration Matière-Classe: types, hooks, components
- [ ] Build Vite sans erreur
- [ ] Tests E2E passent

### Base de données
- [x] Migration 092 exécutée
- [x] Structure validée (colonnes, index, FK)
- [ ] Données de test créées
- [ ] Requêtes SQL validées

---

## 📋 GUIDE DE MIGRATION MANUELLE

### Pour chaque Service:

```typescript
// 1. Remplacer les paramètres de méthode
// AVANT:
async findAll(classeId: string, anneeScolaireId: string, ...)

// APRÈS:
async findAll(classeAnneeId: string, ...)

// 2. Remplacer les WHERE dans les requêtes
// AVANT:
where: { classeId, anneeScolaireId }

// APRÈS:
where: { classeAnneeId }

// 3. Ajouter les relations si besoin
relations: ['classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire']

// 4. Mettre à jour les validations DTO
// Utiliser classeAnneeId au lieu de classeId + anneeScolaireId
```

### Pour chaque Controller:

```typescript
// 1. Mettre à jour les query params
const { classeAnneeId, periodeId } = req.query;

// 2. Mettre à jour les appels service
const data = await service.findAll({
    classeAnneeId,
    periodeId
});

// 3. Supprimer les imports inutilisés
// Retirer les imports de Classe, AnneeScolaire si plus utilisés
```

### Pour chaque composant Frontend:

```typescript
// 1. Mettre à jour les types
interface Props {
    classeAnneeId: string;  // au lieu de classeId + anneeScolaireId
}

// 2. Mettre à jour les hooks React Query
const { data } = useQuery({
    queryKey: ['bulletins', classeAnneeId],
    queryFn: () => api.get(`/bulletins?classeAnneeId=${classeAnneeId}`)
});

// 3. Mettre à jour les formulaires
// Retirer les champs classeId, anneeScolaireId
// Utiliser un select de classeAnnee à la place
```

---

## 🎯 PROCHAINES ÉTAPES RECOMMANDÉES

### Option A: Continuation automatique (recommandé)
1. Mettre à jour les 4 DTOs restants
2. Mettre à jour les 10 services
3. Mettre à jour les 8 controllers
4. Compiler et tester
5. Mettre à jour le frontend module par module

### Option B: Script d'automatisation
Créer un script sed/awk pour remplacer automatiquement:
- `classeId` → `classeAnneeId`
- `anneeScolaireId` → (supprimé)
- Patterns de requêtes TypeORM

### Option C: Documentation détaillée
Créer un guide étape par étape pour chaque fichier avec:
- Lignes exactes à modifier
- Code avant/après
- Tests de validation

---

## 📌 NOTES IMPORTANTES

1. **ClasseAnnee est la source de vérité**: Toutes les entités métier doivent référencer `classeAnneeId`, jamais `classeId` seul.

2. **Accès aux données déduites**: Via `classeAnnee`, on peut accéder à:
   - `classeAnnee.classe` → données permanentes de la classe
   - `classeAnnee.anneeScolaire` → contexte temporel
   - `classeAnnee.etablissement` → contexte multi-tenant

3. **Migration réversible**: Les backups sont dans:
   - `backup_bulletins_pre_092`
   - `backup_notes_pre_092`
   - `backup_emploi_du_temps_pre_092`
   - `backup_affectations_matieres_pre_092`
   - `backup_configurations_matieres_classes_pre_092`

4. **Tests recommandés**:
   - Créer une classeAnnee de test
   - Créer des bulletins/notes avec classeAnneeId
   - Vérifier les jointures fonctionnent
   - Tester les requêtes de filtrage

---

## ✅ VALIDATION FINALE (À compléter)

- [ ] Toutes les entités compilées sans erreur
- [ ] Tous les services mis à jour
- [ ] Tous les controllers mis à jour
- [ ] Frontend fonctionnel
- [ ] Tests passent
- [ ] Documentation mise à jour

---

**Fin du rapport** - Généré automatiquement lors de la session de grill du 2026-06-27
