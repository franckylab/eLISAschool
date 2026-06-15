# Guide de Diagnostic - Problème d'Autorisation après Sélection d'Établissement

## 🎯 Objectif

Identifier précisément pourquoi les pages ne sont pas autorisées après la sélection d'établissement via le modal.

## 📋 Étapes de diagnostic

### 1. **Reproduire le problème**

1. Se connecter avec un utilisateur **multi-établissements** (ex: SUPER_ADMIN avec plusieurs établissements)
2. Modal de sélection s'affiche automatiquement
3. Sélectionner un établissement (ex: "Lycée Bilingue eLISAschool")
4. Observer le comportement

### 2. **Ouvrir DevTools → Console**

### 3. **Vérifier les logs dans l'ordre**

Après la sélection, vous devriez voir ces logs **dans cet ordre** :

```
[Auth Store] completeLogin - Données reçues: {userId: "...", role: "SUPER_ADMIN", ...}
[Auth Store] ÉTAPE 1 terminée - Store mis à jour
[Auth Store] Chargement profil complet...
[Auth Store] Réponse /api/auth/me: {success: true, hasData: true, permissionsCount: 45, role: "SUPER_ADMIN"}
[Auth Store] ÉTAPE 2 terminée - Permissions chargées: 45 permissions
[Auth Store] État final après completeLogin: {isAuthenticated: true, etablissementId: "...", hasPermissions: true, permissionsCount: 45, role: "SUPER_ADMIN"}
[AuthGuard] Vérification: {isAuthenticated: true, hasAccessToken: true, hasUser: true, role: "SUPER_ADMIN", permissionsCount: 45}
[AuthGuard] Accès autorisé
```

### 4. **Identifier le problème selon les logs**

#### Scénario A : Permissions non chargées

**Logs observés** :
```
[Auth Store] ÉTAPE 1 terminée - Store mis à jour
[Auth Store] Chargement profil complet...
[Auth Store] Échec chargement profil après completeLogin (non bloquant): Error: ...
[AuthGuard] Vérification: {isAuthenticated: true, hasAccessToken: true, hasUser: true, role: "SUPER_ADMIN", permissionsCount: 0}
```

**Cause** : `/api/auth/me` a échoué  
**Solution** : Vérifier le backend

---

#### Scénario B : Permissions vides malgré le chargement

**Logs observés** :
```
[Auth Store] Réponse /api/auth/me: {success: true, hasData: true, permissionsCount: 0, role: "SUPER_ADMIN"}
[AuthGuard] Vérification: {isAuthenticated: true, hasAccessToken: true, hasUser: true, role: "SUPER_ADMIN", permissionsCount: 0}
```

**Cause** : Le backend ne retourne pas les permissions pour les SUPER_ADMIN  
**Solution** : Le hook `usePermissions` a une logique spéciale pour SUPER_ADMIN :

```typescript
if (isSuperAdmin) {
    return ['*']; // Wildcard pour indiquer toutes les permissions
}
```

**Action** : Vérifier que `role === 'SUPER_ADMIN'` est bien défini.

---

#### Scénario C : Garde refuse l'accès

**Logs observés** :
```
[Auth Store] État final après completeLogin: {isAuthenticated: true, etablissementId: "...", hasPermissions: true, permissionsCount: 45, role: "SUPER_ADMIN"}
[AuthGuard] Vérification: {isAuthenticated: false, hasAccessToken: true, hasUser: true, ...}
[AuthGuard] Accès refusé - non authentifié
```

**Cause** : `isAuthenticated = false` malgré les données  
**Solution** : Problème de persistance Zustand

---

#### Scénario D : Rôle incorrect

**Logs observés** :
```
[Auth Store] Réponse /api/auth/me: {success: true, hasData: true, permissionsCount: 45, role: "ADMIN"}
[AuthGuard] Vérification: {isAuthenticated: true, hasAccessToken: true, hasUser: true, role: "ADMIN", permissionsCount: 45}
```

**Cause** : L'utilisateur n'est pas SUPER_ADMIN mais ADMIN, et certaines pages requièrent SUPER_ADMIN  
**Solution** : Vérifier les permissions requises par chaque page

---

## 🔍 Commandes de diagnostic manuel

### Vérifier l'état du store

```javascript
// Dans Console DevTools
const state = window.__ZUSTAND_DEVTOOLS__.elisaschoolAuth?.state;
console.log('État complet:', state);
```

OU

```javascript
// Via import dynamique
const { useAuthStore } = await import('/src/stores/auth.store.ts');
const state = useAuthStore.getState();
console.log('isAuthenticated:', state.isAuthenticated);
console.log('accessToken:', state.accessToken?.substring(0, 20) + '...');
console.log('utilisateur:', state.utilisateur);
console.log('permissions:', state.utilisateur?.permissions);
console.log('etablissementId:', state.etablissementId);
```

### Vérifier le localStorage

```javascript
// Voir tout le localStorage
console.table(localStorage);

// Voir spécifiquement le store Zustand
const store = JSON.parse(localStorage.getItem('elisaschool-auth'));
console.log('Store Zustand:', store);
console.log('State:', store?.state);
console.log('Permissions:', store?.state?.utilisateur?.permissions);
```

### Vérifier les tokens

```javascript
// Décoder le JWT
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token payload:', payload);
console.log('etablissementId:', payload.etablissementId);
console.log('role:', payload.role);
console.log('permissions:', payload.permissions);
```

### Vérifier les permissions d'une page spécifique

```javascript
// Exemple pour la page Élèves
const { usePermissions } = await import('/src/hooks/use-permissions.ts');
const { hasPermission, permissions } = usePermissions();

console.log('Toutes les permissions:', permissions);
console.log('Accès élèves:read', hasPermission('eleves:read'));
console.log('Accès eleves:write', hasPermission('eleves:write'));
```

## 📊 Table de diagnostic

| Symptôme | Logs | Cause probable | Solution |
|----------|------|----------------|----------|
| Toutes les pages refusées | `permissionsCount: 0` | Permissions non chargées | Vérifier `/api/auth/me` backend |
| Certaines pages refusées | `role: "ADMIN"` | Permissions insuffisantes | Vérifier rôle utilisateur |
| Modal s'affiche en boucle | Voir [CORRECTION-MODAL-BOCLE-INFINIE.md](file:///mnt/DONNEES/projets/eLISAschool/CORRECTION-MODAL-BOCLE-INFINIE.md) | Événement en boucle | Vérifier les gardes |
| Déconnexion immédiate | Voir [CORRECTION-TOKEN-EXPIRE-SWITCH.md](file:///mnt/DONNEES/projets/eLISAschool/CORRECTION-TOKEN-EXPIRE-SWITCH.md) | Token incompatible | Vérifier refreshToken |
| Accès autorisé | `permissionsCount: 45` + `Accès autorisé` | ✅ Fonctionne | - |

## 🧪 Test de vérification manuelle

### Test 1 : Vérifier que SUPER_ADMIN a toutes les permissions

```javascript
const { usePermissions } = await import('/src/hooks/use-permissions.ts');
const { isSuperAdmin, permissions } = usePermissions();

console.log('isSuperAdmin:', isSuperAdmin);
console.log('permissions:', permissions); // Devrait être ['*']

// Si isSuperAdmin = true et permissions = ['*'], alors TOUTES les pages sont accessibles
```

### Test 2 : Vérifier une permission spécifique

```javascript
const { usePermissions } = await import('/src/hooks/use-permissions.ts');
const { hasPermission } = usePermissions();

// Tester différentes permissions
console.log('dashboard:view', hasPermission('dashboard:view'));
console.log('eleves:read', hasPermission('eleves:read'));
console.log('classes:read', hasPermission('classes:read'));
```

## 🎯 Actions selon le diagnostic

### Si `permissionsCount: 0` après completeLogin

1. **Vérifier le endpoint backend** :
   ```bash
   curl -X GET http://localhost:3001/api/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Vérifier la réponse** :
   ```json
   {
     "success": true,
     "data": {
       "permissions": ["permission1", "permission2", ...]  // ← Ne doit PAS être vide
     }
   }
   ```

### Si `role` n'est pas SUPER_ADMIN

1. **Vérifier le rôle de l'utilisateur** dans la base de données
2. **Vérifier les seeds** : L'utilisateur doit avoir le bon rôle
3. **Vérifier la logique de permissions** : Certaines pages requièrent SUPER_ADMIN

### Si `isAuthenticated: false` après completeLogin

1. **Problème de persistance Zustand** : Le middleware persist est asynchrone
2. **Solution** : Ajouter un délai de 50ms avant le rechargement (déjà fait)
3. **Vérifier** : `await new Promise(resolve => setTimeout(resolve, 50));`

## 📝 Template de rapport de bug

Si le problème persiste, fournissez ces informations :

```
**Logs Console** :
[Copier les logs complets ici]

**État du store** :
```javascript
{
  isAuthenticated: ...,
  accessToken: ...,
  utilisateur: {
    role: ...,
    permissions: [...],
  },
  etablissementId: ...
}
```

**Établissement sélectionné** :
- Nom: ...
- Code: ...
- Rôle dans cet établissement: ...

**Pages accessibles** :
- Dashboard: ✅/❌
- Élèves: ✅/❌
- Classes: ✅/❌

**Pages refusées** :
- [Liste des pages refusées]
```

## ✅ Checklist de vérification

- [ ] Logs `completeLogin` visibles dans la console
- [ ] `permissionsCount > 0` dans l'état final
- [ ] `isAuthenticated: true` dans l'état final
- [ ] `etablissementId` présent dans l'état final
- [ ] `role` correct (ex: SUPER_ADMIN)
- [ ] `[AuthGuard] Accès autorisé` visible dans les logs
- [ ] Pages accessibles après rechargement

---

**Prochaine étape** : Exécutez ces diagnostics et partagez les résultats pour identifier précisément le problème.
