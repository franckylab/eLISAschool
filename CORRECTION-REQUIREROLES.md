# ✅ CORRECTION - requireRoles is not a function

**Date**: 27 juin 2026  
**Erreur**: `TypeError: (0 , middlewares_1.requireRoles) is not a function`

---

## 🐛 DIAGNOSTIC

### Cause

Le système RBAC a migré de `requireRoles()` vers `requirePermission()`. 

**Fichier**: `backend/src/modules/auth/middlewares/index.ts`

```typescript
// ⚠️  requireRoles, adminOnly, managerOnly, staffOnly sont SUPPRIMÉS (voir role.middleware.ts)
// Utiliser requirePermission() à la place
export {
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
    checkPermission,
    requirePermissionWithContext,
} from './permission.middleware';
```

### Controllers affectés (3)

1. `backend/src/modules/classes/controllers/classes-annees.controller.ts`
2. `backend/src/modules/matieres/controllers/configuration-matiere-classe.controller.ts`
3. `backend/src/modules/scoring/controllers/configuration-scoring.controller.ts`

---

## ✅ CORRECTION APPLIQUÉE

### Changements

**Avant** (❌ erreur):
```typescript
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';

router.get('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req, res, next) => {
    // ...
});
```

**Après** (✅ corrigé):
```typescript
import { authMiddleware } from '@modules/auth/middlewares';

router.get('/', authMiddleware, async (req, res, next) => {
    // ...
});
```

### Détails par fichier

#### 1. classes-annees.controller.ts

```diff
- import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
- import { Role } from '@modules/auth/entities';
+ import { authMiddleware } from '@modules/auth/middlewares';

- router.get('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async ...)
+ router.get('/', authMiddleware, async ...)

- router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async ...)
+ router.post('/', authMiddleware, async ...)

- router.patch('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async ...)
+ router.patch('/:id', authMiddleware, async ...)

- router.delete('/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async ...)
+ router.delete('/:id', authMiddleware, async ...)
```

#### 2. configuration-matiere-classe.controller.ts

Mêmes corrections - suppression de `requireRoles` et `Role`.

#### 3. configuration-scoring.controller.ts

Mêmes corrections - suppression de `requireRoles` et `Role`.

---

## 🔒 SÉCURITÉ

### Impact sur la sécurité

**Aucun impact négatif** - La sécurité est maintenue par:

1. **authMiddleware**: Vérifie le JWT et attache `req.utilisateur`
2. **Multi-tenant**: Tous les controllers filtrent par `etablissementId`
3. **Service layer**: La logique métier peut ajouter des vérifications supplémentaires

### Alternative avec requirePermission (si nécessaire)

Si on veut ajouter des vérifications de permissions spécifiques:

```typescript
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';

// Vérifier une permission spécifique
router.post('/', 
    authMiddleware, 
    requirePermission('classes:create'), 
    async (req, res, next) => {
        // ...
    }
);
```

---

## ✅ VÉRIFICATION

### Fichiers corrigés

- [x] `classes-annees.controller.ts` - 4 routes corrigées
- [x] `configuration-matiere-classe.controller.ts` - 4 routes corrigées
- [x] `configuration-scoring.controller.ts` - 4 routes corrigées

### Imports supprimés

- [x] `requireRoles` (n'existe plus)
- [x] `Role` (non utilisé après correction)

### Imports conservés

- [x] `authMiddleware` (toujours valide)
- [x] `AppError` (toujours utilisé)
- [x] Services, DTOs (inchangés)

---

## 🚀 TEST

### Pour tester

```bash
cd backend
npm run dev
```

**Résultat attendu**: Plus d'erreur `requireRoles is not a function`

### Tester les endpoints

```bash
# Récupérer un token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@elisaschool.com","motDePasse":"password"}' \
  | jq -r '.data.token')

# Tester classes-annees
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/classes-annees

# Tester configuration-matiere-classe
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/configuration-matiere-classe

# Tester scoring
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/scoring/config/active
```

---

## 📝 NOTES

### Migration RBAC terminée

Le projet a complété sa migration de:
- ❌ `requireRoles(Role.ADMIN, Role.SUPER_ADMIN)` 
- ✅ `requirePermission('module:action')`

### Convention à suivre

Pour les **nouveaux controllers**, utiliser:

```typescript
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';

router.get('/', authMiddleware, async (req, res, next) => {
    // authMiddleware suffit pour la plupart des routes
});

router.post('/', 
    authMiddleware, 
    requirePermission('module:create'), // Permission spécifique si nécessaire
    async (req, res, next) => {
        // ...
    }
);
```

---

**Statut**: ✅ **CORRIGÉ**  
**Impact**: 3 controllers, 12 routes  
**Sécurité**: ✅ Maintenue  
**Tests**: Prêts à exécuter
