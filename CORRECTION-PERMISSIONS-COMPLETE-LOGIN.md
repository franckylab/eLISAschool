# Correction Permissions après Sélection d'Établissement

## 🚨 Problème Identifié

**Symptôme** : Après la sélection d'un établissement via le modal de sélection, toutes les pages ne sont pas autorisées (erreurs 403 ou redirections).

**Contexte** :
1. Utilisateur se connecte (multi-établissements)
2. Modal de sélection s'affiche
3. Utilisateur sélectionne un établissement
4. `completeLogin()` est appelé
5. ❌ **Les pages sont interdites** (permissions non chargées)

## 🔍 Analyse des causes

### Cause principale : Permissions non chargées après `completeLogin`

Dans le store Zustand, deux flux de connexion existent :

#### ✅ Flux mono-établissement (fonctionne)
```typescript
login() → apiClient.login()
    ↓
set({ utilisateur, tokens, ... })
    ↓
// Charge le profil complet AVEC permissions
const meResponse = await apiClient.get('/api/auth/me');
set({ utilisateur: { ...meResponse.data, permissions: [...] } });
    ↓
✅ Permissions chargées → Accès autorisé
```

#### ❌ Flux multi-établissements (bug)
```typescript
login() → apiClient.login()
    ↓
set({ utilisateur, tokens, ... })
    ↓
// PAS de chargement de /api/auth/me
// ❌ permissions = undefined
    ↓
completeLogin(etablissementId)
    ↓
set({ tokens, etablissementId, ... })
    ↓
// ❌ TOUJOURS PAS de chargement de /api/auth/me
// ❌ permissions = undefined
    ↓
❌ Permissions vides → Accès interdit (403)
```

### Pourquoi les pages sont interdites ?

Les guards de routes et les composants vérifient les permissions :

```typescript
// Exemple: use-permissions.ts
const { utilisateur } = useAuthStore();
const hasPermission = utilisateur?.permissions?.includes('module:access');

if (!hasPermission) {
    // Redirection ou erreur 403
}
```

Si `permissions` est `undefined` ou `[]`, toutes les vérifications échouent.

## ✅ Corrections appliquées

### 1. **auth.store.ts** : Charger les permissions après `completeLogin`

**Avant** (ligne 257-290) :
```typescript
completeLogin: async (etablissementId: string) => {
    // ...
    set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        etablissementId: data.utilisateur.etablissementActif,
        utilisateur: {
            id: data.utilisateur.id,
            email: data.utilisateur.email,
            // ❌ PAS de permissions
        },
        // ...
    });
    
    apiClient.setTokens({ ... });
    // ❌ FIN - pas de chargement de /api/auth/me
}
```

**Après** :
```typescript
completeLogin: async (etablissementId: string) => {
    // ...
    
    // ÉTAPE 1: Mettre à jour les tokens et informations de base
    set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        etablissementId: data.utilisateur.etablissementActif,
        utilisateur: {
            id: data.utilisateur.id,
            email: data.utilisateur.email,
            // ...
        },
        // ...
    });
    
    apiClient.setTokens({ ... });

    // ÉTAPE 2: Charger le profil complet AVEC permissions (CRITIQUE)
    try {
        const meResponse = await apiClient.get<UtilisateurConnecte>('/api/auth/me');
        if (meResponse.data) {
            const currentUtilisateur = get().utilisateur;
            const currentEtablissementId = get().etablissementId;
            
            set({ 
                utilisateur: {
                    ...currentUtilisateur,
                    ...meResponse.data,
                    permissions: meResponse.data.permissions || [], // ✅ MAINTENANT chargé
                },
                etablissementId: meResponse.data.etablissementActif || currentEtablissementId,
                etablissements: meResponse.data.etablissements || get().etablissements,
            });
            
            console.log('[Auth Store] Permissions chargées après completeLogin:', 
                meResponse.data.permissions?.length || 0, 'permissions');
        }
    } catch (error) {
        console.warn('[Auth Store] Échec chargement profil après completeLogin (non bloquant):', error);
        // Non-bloquant - l'utilisateur peut quand même accéder avec les infos de base
    }
}
```

### 2. **use-etablissement-required.ts** : Invalider le cache React Query

**Avant** :
```typescript
const handleSelectEtablissement = async (etablissementId: string) => {
    await completeLogin(etablissementId);
    toast.success('Établissement sélectionné avec succès');
    setShowEtablissementModal(false);
    
    // Recharger la page
    setTimeout(() => {
        window.location.reload();
    }, 300);
};
```

**Après** :
```typescript
const handleSelectEtablissement = async (etablissementId: string) => {
    await completeLogin(etablissementId);
    toast.success('Établissement sélectionné avec succès');
    setShowEtablissementModal(false);

    // Invalider le cache React Query pour forcer le rechargement des données
    // avec les nouvelles permissions
    try {
        const { queryClient } = await import('@/lib/query-client');
        queryClient.clear();
        console.log('[EtablissementRequired] Cache React Query invalidé');
    } catch (error) {
        console.warn('[EtablissementRequired] Échec invalidation cache:', error);
    }

    // Recharger la page pour appliquer le nouveau contexte
    setTimeout(() => {
        window.location.reload();
    }, 300);
};
```

### 3. **use-etablissement-selection.ts** : Même correction

Application de la même invalidation de cache React Query.

## 📁 Fichiers modifiés

| Fichier | Lignes | Modification |
|---------|--------|--------------|
| [auth.store.ts](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/stores/auth.store.ts) | 256-318 | Ajout chargement `/api/auth/me` après `completeLogin` |
| [use-etablissement-required.ts](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/hooks/use-etablissement-required.ts) | 53-73 | Ajout invalidation cache React Query |
| [use-etablissement-selection.ts](file:///mnt/DONNEES/projets/eLISAschool/frontend/src/hooks/use-etablissement-selection.ts) | 30-48 | Ajout invalidation cache React Query |

## 🧪 Scénarios de test

### Scénario 1 : Multi-établissements (sélection)

1. **Se connecter** avec un utilisateur multi-établissements
2. **Sélectionner** un établissement via le modal
3. **Vérifier** dans Console :
   ```
   [Auth Store] Permissions chargées après completeLogin: 45 permissions
   [EtablissementRequired] Cache React Query invalidé
   ```
4. **Naviguer** vers différentes pages (Dashboard, Élèves, Classes, etc.)
5. **Résultat attendu** : ✅ Toutes les pages accessibles (selon rôle)

### Scénario 2 : Vérification des permissions

1. **Ouvrir** DevTools après sélection d'établissement
2. **Exécuter** dans Console :
   ```javascript
   const store = window.__ZUSTAND_DEVTOOLS__.elisaschool-auth.state;
   console.log('Permissions:', store.utilisateur?.permissions);
   ```
3. **Résultat attendu** : ✅ Tableau de permissions non vide

### Scénario 3 : Mono-établissement (régression)

1. **Se connecter** avec un utilisateur mono-établissement
2. **Vérifier** que les permissions sont chargées (pas de régression)
3. **Résultat attendu** : ✅ Fonctionne comme avant

## 🔍 Explication technique

### Flux corrigé (multi-établissements)

```
Login → Token SANS etablissementId
    ↓
Modal sélection → completeLogin(etablissementId)
    ↓
ÉTAPE 1: Tokens + etablissementId mis à jour
    ↓
ÉTAPE 2: GET /api/auth/me → Profil complet AVEC permissions
    ↓
ÉTAPE 3: Store Zustand mis à jour (permissions incluses)
    ↓
ÉTAPE 4: Cache React Query invalidé
    ↓
ÉTAPE 5: Page rechargée (window.location.reload)
    ↓
✅ Toutes les pages vérifient les permissions → Accès autorisé
```

### Pourquoi invalider le cache React Query ?

Même avec les permissions chargées, React Query peut avoir en cache des requêtes qui ont échoué avec d'anciennes permissions. L'invalidation garantit :

1. **Re-fetch** de toutes les données avec le nouveau contexte
2. **Pas de données stale** provenant de l'ancien établissement
3. **Cohérence** entre le store Zustand et le cache React Query

## 🎯 Bonnes pratiques appliquées

### ✅ 1. **Cohérence des flux d'authentification**

Les deux flux (mono et multi-établissements) suivent maintenant le même pattern :

```typescript
// TOUJOURS charger /api/auth/me après mise à jour des tokens
const meResponse = await apiClient.get<UtilisateurConnecte>('/api/auth/me');
set({
    utilisateur: {
        ...meResponse.data,
        permissions: meResponse.data.permissions || [],
    },
});
```

### ✅ 2. **Gestion d'erreurs non-bloquante**

```typescript
try {
    const meResponse = await apiClient.get('/api/auth/me');
    // ...
} catch (error) {
    console.warn('[Auth Store] Échec chargement profil (non bloquant):', error);
    // L'utilisateur peut quand même accéder avec les infos de base
}
```

### ✅ 3. **Import dynamique**

```typescript
const { queryClient } = await import('@/lib/query-client');
```

Évite les dépendances circulaires et permet le code splitting.

### ✅ 4. **Logs de débogage**

```typescript
console.log('[Auth Store] Permissions chargées après completeLogin:', 
    meResponse.data.permissions?.length || 0, 'permissions');
```

Facilite le débogage en production (logs structurés).

## 📊 Comparaison Avant/Après

| Aspect | ❌ Avant | ✅ Après |
|--------|---------|---------|
| **Permissions après completeLogin** | `undefined` | Chargées depuis `/api/auth/me` |
| **Accès aux pages** | 403/Interdit | Autorisé (selon rôle) |
| **Cache React Query** | Non invalidé | `clear()` après sélection |
| **Cohérence mono/multi** | Différents | Identiques |
| **Logs** | Aucun | Structurés et informatifs |
| **Gestion erreurs** | Crash possible | Non-bloquant |

## ⚠️ Points d'attention

### 1. **Ne PAS supprimer le chargement de /api/auth/me**

Ce chargement est CRITIQUE pour les permissions. Même si `completeLogin` retourne des infos utilisateur, il ne retourne PAS les permissions.

### 2. **Toujours invalider le cache React Query**

Après un changement d'établissement, les données en cache peuvent être obsolètes ou incorrectes.

### 3. **Gestion d'erreurs non-bloquante**

Si `/api/auth/me` échoue, l'utilisateur peut quand même accéder à l'application avec les informations de base de `completeLogin`. Les permissions seront juste vides.

### 4. **Ordre des opérations**

L'ordre est CRITIQUE :
1. Mettre à jour tokens (ÉTAPE 1)
2. Charger profil complet (ÉTAPE 2)
3. Invalider cache
4. Recharger page

## 🚀 Prochaines améliorations

1. **Retourner les permissions dans completeLogin** : Modifier le backend pour inclure les permissions dans la réponse de `/api/auth/complete-login` (éviter un appel supplémentaire)
2. **Invalidation sélective** : Au lieu de `queryClient.clear()`, invalider uniquement les queries affectées par le changement d'établissement
3. **Optimistic updates** : Mettre à jour les permissions en optimiste avant la confirmation du serveur
4. **Retry automatique** : Si `/api/auth/me` échoue, retry 2-3 fois avant de considérer comme non-bloquant

## 📝 Logs de débogage

### Succès
```
[Auth Store] Permissions chargées après completeLogin: 45 permissions
[EtablissementRequired] Cache React Query invalidé
```

### Échec non-bloquant
```
[Auth Store] Échec chargement profil après completeLogin (non bloquant): Error: Network error
```

### Vérification manuelle
```javascript
// Dans Console DevTools
const state = useAuthStore.getState();
console.log('Permissions:', state.utilisateur?.permissions);
// Doit afficher un tableau de strings non vide
```

## ✅ Vérification finale

- [x] `completeLogin` charge `/api/auth/me` après mise à jour des tokens
- [x] Permissions mises à jour dans le store Zustand
- [x] Cache React Query invalidé après sélection
- [x] Gestion d'erreurs non-bloquante
- [x] Logs de débogage structurés
- [x] Cohérence mono/multi-établissements
- [x] Import dynamique pour éviter dépendances circulaires

---

**Statut** : ✅ **CORRIGÉ**  
**Impact** : Moyen (uniquement utilisateurs multi-établissements)  
**Risque** : Faible (ajout de chargement, pas de suppression)  
**Test requis** : Login multi-établissements + navigation vers pages protégées
