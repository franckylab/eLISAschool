# Correction Expiration Token lors du Changement d'Établissement

## 🚨 Problème Identifié

**Symptôme** : Lorsqu'un utilisateur change d'établissement via le switcher dans le header, le token expire immédiatement, forçant une reconnexion.

**Contexte** :
1. Utilisateur connecté et authentifié
2. Ouvre le switcher d'établissement (header)
3. Sélectionne un autre établissement
4. ❌ **Token expire immédiatement** → Déconnexion forcée

## 🔍 Analyse des causes

### Cause principale : Utilisation de `completeLogin()` au lieu de `switchEtablissement()`

Dans [EtablissementSwitcher.tsx](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/components/auth/EtablissementSwitcher.tsx#L86), le changement d'établissement appelait :

```typescript
// ❌ INCORRECT
await apiClient.completeLogin(etablissementId);
```

**Problème** : `completeLogin()` est conçu pour la **première sélection** d'établissement après le login (flux multi-établissements), PAS pour le **changement** d'établissement.

### Différence critique entre les deux endpoints

#### `completeLogin()` - Première sélection
```typescript
POST /api/auth/complete-login
Body: { etablissementId }

Réponse:
{
    accessToken: "...",
    refreshToken: "...", // ← NOUVEAU refresh token
    utilisateur: { ... }
}
```

**Utilisation** : Après login multi-établissements, quand l'utilisateur n'a PAS encore d'`etablissementId` dans son token.

#### `switchEtablissement()` - Changement de contexte
```typescript
POST /api/auth/switch-etablissement
Headers: Authorization: Bearer {token}
Body: { etablissementId }

Réponse:
{
    accessToken: "...", // ← SEUL accessToken est retourné
    etablissementActif: { id, role }
    // ❌ PAS de refreshToken
}
```

**Utilisation** : Quand l'utilisateur est DÉJÀ authentifié avec un `etablissementId` et veut changer.

### Pourquoi le token expirait ?

**Flux incorrect (avant)** :
```
Utilisateur avec token A (etablissementId: ETAB-001)
    ↓
EtablissementSwitcher → completeLogin(ETAB-002)
    ↓
Backend génère token B avec NOUVEAU refreshToken
    ↓
Store Zustand met à jour accessToken MAIS PAS refreshToken
    ↓
Incompatibilité: accessToken B + ancien refreshToken A
    ↓
❌ Token rejeté au prochain refresh → Expiration immédiate
```

**Flux correct (après)** :
```
Utilisateur avec token A (etablissementId: ETAB-001)
    ↓
EtablissementSwitcher → switchEtablissement(ETAB-002)
    ↓
Backend génère token B (même refreshToken A)
    ↓
Store Zustand met à jour: accessToken B + refreshToken A
    ↓
✅ Cohérence: accessToken B + refreshToken A compatibles
    ↓
✅ Token valide → Session continue
```

## ✅ Corrections appliquées

### 1. **EtablissementSwitcher.tsx** : Utiliser `switchEtablissement()`

**Avant** :
```typescript
const handleChangeEtablissement = async (etablissementId: string) => {
    try {
        // ❌ INCORRECT - Utilise completeLogin
        await apiClient.completeLogin(etablissementId);
        
        toast.success('Établissement changé avec succès');
        window.location.reload();
    } catch (error: any) {
        toast.error(error.message || 'Erreur lors du changement');
    }
};
```

**Après** :
```typescript
const handleChangeEtablissement = async (etablissementId: string) => {
    try {
        // ✅ CORRECT - Utiliser switchEtablissement
        // completeLogin est pour la PREMIÈRE sélection après login
        // switchEtablissement est pour le CHANGEMENT d'établissement
        const response = await apiClient.switchEtablissement(etablissementId);
        
        // Mettre à jour le store Zustand
        const { switchEtablissement: switchEtabStore } = useAuthStore.getState();
        await switchEtabStore(etablissementId);
        
        // Mettre à jour l'établissement actuel
        const selected = etablissements.find(e => e.id === etablissementId);
        if (selected) {
            setEtablissementActuel(selected);
        }

        toast.success('Établissement changé avec succès');
        
        // Invalider le cache React Query
        try {
            const { queryClient } = await import('@/lib/query-client');
            queryClient.clear();
            console.log('[EtablissementSwitcher] Cache React Query invalidé');
        } catch (error) {
            console.warn('[EtablissementSwitcher] Échec invalidation cache:', error);
        }
        
        // Recharger la page pour appliquer le nouveau contexte
        window.location.reload();
    } catch (error: any) {
        toast.error(error.message || 'Erreur lors du changement');
    }
};
```

### 2. **auth.store.ts** : Charger les permissions après switch

**Avant** :
```typescript
switchEtablissement: async (etablissementId: string) => {
    const data = await apiClient.switchEtablissement(etablissementId);
    set({
        accessToken: data.accessToken,
        etablissementId: data.etablissementActif.id,
    });
    apiClient.setTokens({
        accessToken: data.accessToken,
        refreshToken: get().refreshToken!,
    });
    // ❌ PAS de chargement des permissions
};
```

**Après** :
```typescript
switchEtablissement: async (etablissementId: string) => {
    const data = await apiClient.switchEtablissement(etablissementId);
    
    // ÉTAPE 1: Mettre à jour accessToken et etablissementId
    set({
        accessToken: data.accessToken,
        etablissementId: data.etablissementActif.id,
    });
    
    // ÉTAPE 2: Mettre à jour api-client
    apiClient.setTokens({
        accessToken: data.accessToken,
        refreshToken: get().refreshToken!, // Conserver le même refreshToken
    });

    // ÉTAPE 3: Charger le profil complet AVEC permissions (CRITIQUE)
    try {
        const meResponse = await apiClient.get<UtilisateurConnecte>('/api/auth/me');
        if (meResponse.data) {
            const currentUtilisateur = get().utilisateur;
            
            set({ 
                utilisateur: {
                    ...currentUtilisateur,
                    ...meResponse.data,
                    permissions: meResponse.data.permissions || [],
                },
                etablissements: meResponse.data.etablissements || get().etablissements,
            });
            
            console.log('[Auth Store] Permissions mises à jour après switchEtablissement:', 
                meResponse.data.permissions?.length || 0, 'permissions');
        }
    } catch (error) {
        console.warn('[Auth Store] Échec chargement profil (non bloquant):', error);
    }
};
```

## 📁 Fichiers modifiés

| Fichier | Lignes | Modification |
|---------|--------|--------------|
| [EtablissementSwitcher.tsx](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/components/auth/EtablissementSwitcher.tsx) | 80-118 | Utiliser `switchEtablissement()` + invalidation cache |
| [auth.store.ts](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/stores/auth.store.ts) | 199-244 | Chargement permissions après switch |

## 🧪 Scénarios de test

### Scénario 1 : Changement d'établissement normal

1. **Se connecter** avec un utilisateur multi-établissements
2. **Ouvrir** le switcher d'établissement (header)
3. **Sélectionner** un autre établissement
4. **Vérifier** dans Console :
   ```
   [Auth Store] Permissions mises à jour après switchEtablissement: 45 permissions
   [EtablissementSwitcher] Cache React Query invalidé
   ```
5. **Naviguer** vers différentes pages
6. **Résultat attendu** : ✅ Navigation fluide, pas de déconnexion

### Scénario 2 : Changements multiples

1. **Changer** d'établissement (ETAB-001 → ETAB-002)
2. **Attendre** le rechargement
3. **Changer** encore (ETAB-002 → ETAB-003)
4. **Résultat attendu** : ✅ Chaque changement fonctionne

### Scénario 3 : Vérification des permissions

1. **Changer** d'établissement
2. **Ouvrir** DevTools → Console
3. **Exécuter** :
   ```javascript
   const state = useAuthStore.getState();
   console.log('Permissions:', state.utilisateur?.permissions?.length);
   ```
4. **Résultat attendu** : ✅ Nombre de permissions > 0

### Scénario 4 : Accès aux pages protégées

1. **Changer** d'établissement
2. **Naviguer** vers Dashboard, Élèves, Classes
3. **Résultat attendu** : ✅ Toutes les pages accessibles (selon rôle)

## 🔍 Explication technique

### Comparaison des deux flux

| Aspect | `completeLogin()` | `switchEtablissement()` |
|--------|------------------|------------------------|
| **Usage** | Première sélection | Changement de contexte |
| **Auth requise** | Non (token temporaire) | Oui (token valide) |
| **Retourne** | accessToken + refreshToken | accessToken uniquement |
| **RefreshToken** | Nouveau | Conserve l'ancien |
| **Endpoint** | `/api/auth/complete-login` | `/api/auth/switch-etablissement` |
| **Middleware** | Aucun | authMiddleware |

### Pourquoi conserver le même refreshToken ?

Le refreshToken est lié à la **session utilisateur**, pas à l'établissement. Quand on change d'établissement :

1. **accessToken** : Change (contient le nouvel `etablissementId`)
2. **refreshToken** : Reste le même (toujours valide pour la session)

Si on générait un nouveau refreshToken à chaque changement :
- ❌ Ancien refreshToken toujours dans localStorage
- ❌ Incompatibilité entre accessToken et refreshToken
- ❌ Échec du refresh → Déconnexion

## 🎯 Bonnes pratiques appliquées

### ✅ 1. **Séparation des responsabilités**

```typescript
// ✅ CORRECT - Utilisation selon le contexte
if (premiereSelection) {
    await completeLogin(etablissementId);
} else {
    await switchEtablissement(etablissementId);
}
```

### ✅ 2. **Cohérence token/refreshToken**

Toujours conserver le même refreshToken lors d'un changement de contexte :

```typescript
apiClient.setTokens({
    accessToken: newAccessToken,
    refreshToken: get().refreshToken!, // ← Conserver l'ancien
});
```

### ✅ 3. **Chargement des permissions**

Après TOUT changement de token, recharger les permissions :

```typescript
const meResponse = await apiClient.get<UtilisateurConnecte>('/api/auth/me');
set({
    utilisateur: {
        ...meResponse.data,
        permissions: meResponse.data.permissions || [],
    },
});
```

### ✅ 4. **Invalidation cache**

Après changement d'établissement, invalider le cache React Query :

```typescript
const { queryClient } = await import('@/lib/query-client');
queryClient.clear();
```

### ✅ 5. **Logs de débogage**

Chaque opération critique est loguée :

```typescript
console.log('[Auth Store] Permissions mises à jour après switchEtablissement:', 
    meResponse.data.permissions?.length || 0, 'permissions');
```

## 📊 Comparaison Avant/Après

| Aspect | ❌ Avant | ✅ Après |
|--------|---------|---------|
| **Méthode utilisée** | `completeLogin()` | `switchEtablissement()` |
| **Token après switch** | Expire immédiatement | Valide jusqu'à expiration normale |
| **RefreshToken** | Incompatible | Compatible (conservé) |
| **Permissions** | Non rechargées | Rechargées depuis `/api/auth/me` |
| **Cache React Query** | Non invalidé | Invalidé (`clear()`) |
| **Logs** | Aucun | Structurés et informatifs |

## ⚠️ Points d'attention

### 1. **Ne PAS mélanger les deux méthodes**

- `completeLogin()` → UNIQUEMENT pour première sélection après login
- `switchEtablissement()` → UNIQUEMENT pour changement d'établissement

### 2. **Toujours conserver le refreshToken**

Ne JAMAIS remplacer le refreshToken lors d'un `switchEtablissement`, sauf si le backend en retourne un nouveau (ce qui n'est pas le cas actuellement).

### 3. **Toujours recharger les permissions**

Après un changement de token, les permissions peuvent être différentes (rôle différent par établissement).

### 4. **Invalider le cache**

Les données en cache peuvent être spécifiques à l'ancien établissement.

## 🚀 Prochaines améliorations

1. **Retourner les permissions dans switchEtablissement** : Éviter un appel supplémentaire à `/api/auth/me`
2. **Optimistic updates** : Mettre à jour l'UI avant confirmation du serveur
3. **Transition fluide** : Spinner au lieu de `window.location.reload()`
4. **Historique** : Garder trace des établissements visités dans la session

## 📝 Logs de débogage

### Succès
```
[Auth Store] Permissions mises à jour après switchEtablissement: 45 permissions
[EtablissementSwitcher] Cache React Query invalidé
```

### Échec non-bloquant
```
[Auth Store] Échec chargement profil après switchEtablissement (non bloquant): Error: Network error
```

### Vérification manuelle
```javascript
// Dans Console DevTools
const state = useAuthStore.getState();
console.log('accessToken:', state.accessToken?.substring(0, 20) + '...');
console.log('etablissementId:', state.etablissementId);
console.log('permissions:', state.utilisateur?.permissions?.length);
```

## ✅ Vérification finale

- [x] EtablissementSwitcher utilise `switchEtablissement()`
- [x] Store Zustand met à jour accessToken + refreshToken
- [x] Permissions rechargées depuis `/api/auth/me`
- [x] Cache React Query invalidé
- [x] Logs structurés pour débogage
- [x] Gestion d'erreurs non-bloquante
- [x] Import dynamique pour éviter dépendances circulaires

---

**Statut** : ✅ **CORRIGÉ**  
**Impact** : Critique (déconnexion après changement d'établissement)  
**Risque** : Faible (changement de méthode API)  
**Test requis** : Changement d'établissement + navigation + vérification permissions
