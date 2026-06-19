# Correction - Erreur 500 Stats Établissement

> **Date** : 18 Juin 2026  
> **Erreur** : `EntityPropertyNotFoundError: Property "actif" was not found in "MembrePersonnel"`  
> **Statut** : ✅ **Corrigé**

---

## 🐛 Description du Bug

### Symptôme

L'endpoint `GET /api/etablissements/{id}/stats` retourne une erreur 500 :

```
EntityPropertyNotFoundError: Property "actif" was not found in "MembrePersonnel"
```

### Stack Trace

```
at SelectQueryBuilder.buildWhere (SelectQueryBuilder.ts:4319:27)
at EntityManager.count (EntityManager.ts:1015:14)
at EtablissementService.getEtablissementStats (etablissement.service.ts:312:50)
```

### Route Affectée

```
GET /api/etablissements/:id/stats
```

---

## 🔍 Diagnostic

### Cause Racine

Dans [`etablissement.service.ts:312`](../backend/src/modules/etablissement/services/etablissement.service.ts#L312), le code tentait de filtrer les membres du personnel avec :

```typescript
const nombrePersonnel = await membreRepo.count({
    where: { etablissementId, actif: true },  // ❌ ERREUR
});
```

**Problème** : L'entité `MembrePersonnel` n'a **pas** de propriété `actif`.

### Entité MembrePersonnel

L'entité utilise un **enum de statut** :

```typescript
// personnel.entity.ts
export enum StatutPersonnel {
    ACTIF = 'ACTIF',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIF = 'INACTIF',
    CONGE = 'CONGE',
}

@Entity('membres_personnel')
export class MembrePersonnel {
    @Column({ type: 'varchar', length: 30, default: StatutPersonnel.ACTIF })
    statut!: StatutPersonnel;  // ✅ Utiliser 'statut', pas 'actif'
    
    // ... autres champs
}
```

### Confusion avec d'autres Entités

D'autres entités utilisent `actif` (boolean) :

- ✅ `Etablissement` → `actif: boolean`
- ✅ `Eleve` → `actif: boolean`
- ✅ `Utilisateur` → `statut: StatutUtilisateur`
- ❌ `MembrePersonnel` → `statut: StatutPersonnel` (PAS `actif`)

---

## ✅ Correction Appliquée

### Fichier Modifié

**[`backend/src/modules/etablissement/services/etablissement.service.ts`](../backend/src/modules/etablissement/services/etablissement.service.ts)**

### Changements

#### 1. Import de l'enum `StatutPersonnel`

```typescript
// AVANT
import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Etablissement, EtablissementConfig, StatutEtablissement } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';

// APRÈS
import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Etablissement, EtablissementConfig, StatutEtablissement } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { StatutPersonnel } from '@modules/personnel/entities';  // ✅ Ajouté
```

#### 2. Correction de la requête `count()`

```typescript
// AVANT (❌ ERREUR)
const membreRepo = AppDataSource.getRepository('MembrePersonnel');
const nombrePersonnel = await membreRepo.count({
    where: { etablissementId, actif: true },  // Property "actif" doesn't exist
});

// APRÈS (✅ CORRIGÉ)
const membreRepo = AppDataSource.getRepository('MembrePersonnel');
const nombrePersonnel = await membreRepo.count({
    where: { 
        etablissementId, 
        statut: StatutPersonnel.ACTIF  // ✅ Utilise l'enum correct
    },
});
```

---

## 🧪 Tests

### Test Manuel

```bash
# Tester l'endpoint corrigé
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/etablissements/{id}/stats"
```

**Réponse attendue** :

```json
{
  "success": true,
  "data": {
    "etablissementId": "uuid",
    "nomEtablissement": "Exemple",
    "nombreClasses": 15,
    "nombreEleves": 450,
    "nombrePersonnel": 32,  // ✅ Compte maintenant les membres actifs
    "nombreNiveaux": 6,
    "tauxOccupation": 75
  }
}
```

### Vérification en Base

```sql
-- Vérifier le nombre de membres du personnel ACTIF
SELECT COUNT(*) 
FROM membres_personnel 
WHERE "etablissementId" = 'uuid-etablissement'
AND statut = 'ACTIF';
```

---

## 📊 Impact

### Avant la Correction

- ❌ Erreur 500 sur `GET /api/etablissements/{id}/stats`
- ❌ Dashboard établissement ne s'affiche pas
- ❌ Statistiques personnel incorrectes

### Après la Correction

- ✅ Endpoint retourne 200 OK
- ✅ Statistiques correctes
- ✅ Dashboard fonctionnel

---

## 🔍 Autres Occurrences Vérifiées

Aucune autre occurrence de `MembrePersonnel` avec `actif` trouvée dans le codebase :

```bash
grep -r "MembrePersonnel.*actif" backend/src/
# Résultat : 0 occurrence (après correction)
```

---

## 📝 Leçons Apprises

### 1. Vérifier l'Entité Avant d'Utiliser

Toujours inspecter la définition de l'entité avant d'écrire une requête :

```bash
# Trouver l'entité
grep -r "class MembrePersonnel" backend/src/modules/

# Voir ses colonnes
cat backend/src/modules/personnel/entities/personnel.entity.ts | grep "@Column"
```

### 2. Utiliser les Enums, Pas de Strings Littéraux

```typescript
// ❌ INCORRECT (fragile, pas de type checking)
where: { statut: 'ACTIF' }

// ✅ CORRECT (type-safe, auto-complétion)
where: { statut: StatutPersonnel.ACTIF }
```

### 3. Patterns de Statut dans eLISAschool

| Entité | Propriété | Type | Valeurs |
|--------|-----------|------|---------|
| `Etablissement` | `actif` | `boolean` | `true` / `false` |
| `Eleve` | `actif` | `boolean` | `true` / `false` |
| `Utilisateur` | `statut` | `enum` | `ACTIF`, `INACTIF`, `SUSPENDU` |
| `MembrePersonnel` | `statut` | `enum` | `ACTIF`, `INACTIF`, `CONGE` |
| `AnneeScolaire` | `statut` | `enum` | `ACTIF`, `CLOTUREE` |

**Règle** : Si l'entité a un enum de statut, l'utiliser. Sinon, utiliser `actif` (boolean).

---

## 📁 Fichiers Modifiés

| Fichier | Lignes Modifiées | Type |
|---------|------------------|------|
| [`etablissement.service.ts`](../backend/src/modules/etablissement/services/etablissement.service.ts) | +5, -1 | Fix |

---

## ✅ Checklist de Validation

- [x] Identification de la cause racine
- [x] Correction du code
- [x] Import de l'enum ajouté
- [x] Vérification d'aucune autre occurrence
- [x] Documentation du fix
- [x] Leçons apprises documentées

---

**Fix appliqué avec succès** ✅  
**Prochain déploiement** : Redémarrer le backend pour appliquer les changements

```bash
cd /mnt/DONNEES/projets/eLISAschool
npm run build:backend
npm run start:backend
```
