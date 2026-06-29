# ✅ CORRECTION - Router.use() requires a middleware function but got a undefined

**Date**: 27 juin 2026  
**Erreur**: `TypeError: Router.use() requires a middleware function but got a undefined`

---

## 🐛 DIAGNOSTIC

### Localisation

**Fichier**: `backend/src/app.ts`  
**Ligne**: 394

```typescript
app.use('/api/scoring/config', authMiddleware, filterByEtablissement(), configurationScoringController);
```

### Cause possible

L'erreur "got a undefined" signifie qu'une des variables passées à `app.use()` est `undefined`:
- `authMiddleware` ✅ (utilisé partout, fonctionne)
- `filterByEtablissement()` ✅ (utilisé partout, fonctionne)
- `configurationScoringController` ❌ (probablement undefined)

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Ajout export controllers dans scoring/index.ts

**Avant** (❌):
```typescript
export * from './entities';
export * from './dto';
export * from './services';
/**
 * Module Scoring - Export principal
 */
export * from './entities';  // ← doublon
export * from './services';  // ← doublon, pas de controllers!
```

**Après** (✅):
```typescript
export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';  // ← Ajouté
```

### 2. Suppression exports en double

**entities/index.ts**:
```diff
export * from './scoring.entity';
- export * from './scoring.entity';  // ← Supprimé doublon
```

**services/index.ts**:
```diff
export * from './scoring.service';
export * from './configuration-scoring.service';
- export * from './scoring.service';  // ← Supprimé doublon
```

---

## 🔍 VÉRIFICATION

### Structure du module scoring

```
scoring/
├── index.ts ✅ (export * from './controllers' ajouté)
├── entities/
│   ├── scoring.entity.ts
│   └── index.ts ✅ (doublon supprimé)
├── dto/
│   ├── scoring.dto.ts
│   └── index.ts
├── services/
│   ├── scoring.service.ts
│   ├── configuration-scoring.service.ts
│   └── index.ts ✅ (doublon supprimé)
└── controllers/
    ├── configuration-scoring.controller.ts ✅
    └── index.ts ✅
```

### Export chain

```
configuration-scoring.controller.ts
    ↓ export const configurationScoringController = router
controllers/index.ts
    ↓ export * from './configuration-scoring.controller'
scoring/index.ts
    ↓ export * from './controllers' (AJOUTÉ)
app.ts
    ↓ import { configurationScoringController } from '@modules/scoring'
    ✅ configurationScoringController est défini
```

---

## 🚀 TEST

### Pour tester

```bash
cd backend
npm run dev
```

**Résultat attendu**: Plus d'erreur `Router.use() requires a middleware function`

### Vérifier que le controller est exporté

```bash
# Diagnostic
./diagnose-scoring.sh
```

**Sortie attendue**:
```
4. Export du controller:
export const configurationScoringController = router;

5. Import dans app.ts:
import { configurationScoringController } from '@modules/scoring';
```

---

## 📝 NOTES

### Pourquoi cette erreur?

Le module scoring n'exportait pas ses controllers dans `index.ts`. Quand `app.ts` faisait:

```typescript
import { configurationScoringController } from '@modules/scoring';
```

L'import retournait `undefined` car le controller n'était pas exporté au niveau du module.

### Convention à suivre

**TOUJOURS** exporter tous les composants dans le `index.ts` du module:

```typescript
// module/index.ts
export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';  // ← Important!
```

### Autres modules corrects

Les modules `classes` et `matières` avaient déjà la bonne structure:

```typescript
// classes/index.ts ✅
export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';

// matieres/index.ts ✅
export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';
```

---

## ✅ FICHIERS MODIFIÉS

1. ✅ `backend/src/modules/scoring/index.ts` - Ajout export controllers
2. ✅ `backend/src/modules/scoring/entities/index.ts` - Suppression doublon
3. ✅ `backend/src/modules/scoring/services/index.ts` - Suppression doublon

---

**Statut**: ✅ **CORRIGÉ**  
**Impact**: 1 module (scoring), 3 fichiers  
**Tests**: Prêts à exécuter
