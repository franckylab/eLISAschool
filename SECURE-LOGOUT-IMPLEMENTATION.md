# Déconnexion Sécurisée - Implémentation Complète

## 🚨 Problème Critique Identifié

**Symptôme** : Lorsqu'un utilisateur A se déconnecte et qu'un utilisateur B se connecte dans le même navigateur, la connexion est établie avec les identifiants de l'utilisateur A.

**Cause racine** : Persistance incomplète des tokens d'authentification après déconnexion.

## 🔍 Analyse des problèmes

### 1. **Double stockage des tokens**
```
localStorage:
├─ accessToken (api-client)
├─ refreshToken (api-client)
└─ elisaschool-auth (Zustand persist)
    ├─ accessToken
    ├─ refreshToken
    ├─ utilisateur
    └─ isAuthenticated
```

**Problème** : `apiClient.clearTokens()` ne supprimait que les 2 premiers, laissant `elisaschool-auth` intact.

### 2. **Navigation inconsistant**
```tsx
// ❌ ANCIEN - Header.tsx
await logout();
window.location.href = '/login'; // Court-circuitait useSessionExpired
```

### 3. **Pas de nettoyage du cache React Query**
Les données utilisateur restaient en cache et pouvaient être affichées au prochain utilisateur.

### 4. **Race condition Zustand persist**
```tsx
set(initialState); // Asynchrone avec middleware persist
// Le localStorage peut ne pas être mis à jour immédiatement
```

## ✅ Solution implémentée

### Architecture du service sécurisé

```
handleLogout()
    ↓
[Anti double-clic] → isLoggingOut flag
    ↓
secureLogout()
    ↓
ÉTAPE 1: Invalider refresh token serveur (try/catch)
    ↓
ÉTAPE 2: apiClient.clearTokens()
    ↓
ÉTAPE 3: authStore.reset() + localStorage.removeItem('elisaschool-auth')
    ↓
ÉTAPE 4: queryClient.clear() (cache React Query)
    ↓
ÉTAPE 5: Nettoyage sessionStorage (clés elisaschool-*)
    ↓
ÉTAPE 6: Dispatch 'auth:logout' event
    ↓
ÉTAPE 7: Nettoyage cookies (auth/token/session)
    ↓
ÉTAPE 8: window.location.href = '/auth/login' (rechargement complet)
```

## 📁 Fichiers modifiés/créés

### 1. **NOUVEAU** : `frontend/src/lib/secure-logout.ts` (152 lignes)

Service centralisé de déconnexion sécurisée suivant les meilleures pratiques OWASP.

**Fonctions exportées** :
- `secureLogout(options)` : Déconnexion complète (9 étapes)
- `handleLogout(options)` : Wrapper avec protection anti double-clic
- `isLogoutInProgress()` : Vérifier si déconnexion en cours

**Options** :
```typescript
{
    redirect?: boolean;        // Rediriger automatiquement (défaut: true)
    preserveLanguage?: boolean; // Préserver la langue (défaut: false)
}
```

### 2. **MODIFIÉ** : `frontend/src/components/layout/Header.tsx`

**Avant** :
```tsx
const { utilisateur, logout } = useAuthStore();

const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
};
```

**Après** :
```tsx
const { utilisateur } = useAuthStore();

const handleLogout = async () => {
    const { handleLogout: secureHandleLogout } = await import('@/lib/secure-logout');
    await secureHandleLogout({ redirect: true });
};
```

**Avantages** :
- ✅ Import dynamique (code splitting)
- ✅ Nettoyage complet garanti
- ✅ Protection anti double-clic
- ✅ Rechargement complet de la page

### 3. **MODIFIÉ** : `frontend/src/hooks/use-session-expired.ts`

Utilisation du service sécurisé pour la déconnexion via événement :

```tsx
const handleLogout = () => {
    import('@/lib/secure-logout').then(({ secureLogout }) => {
        secureLogout({ redirect: false }); // Redirect géré par le hook
    });
    
    toast.info('Déconnexion réussie');
    navigate({ to: '/auth/login', replace: true });
};
```

### 4. **MODIFIÉ** : `frontend/src/stores/auth.store.ts`

Renforcement de la méthode `reset()` :

```tsx
reset: () => {
    apiClient.clearTokens();
    set(initialState);
    
    // FORCER la purge immédiate du localStorage Zustand
    try {
        localStorage.removeItem('elisaschool-auth');
    } catch (error) {
        console.error('[Auth Store] Erreur purge localStorage:', error);
    }
},
```

### 5. **MODIFIÉ** : `frontend/src/lib/api.ts` et `frontend/src/lib/index.ts`

Exports centralisés pour faciliter l'utilisation :

```tsx
export { apiClient } from './api-client';
export { secureLogout, handleLogout, isLogoutInProgress } from './secure-logout';
```

## 🔒 Meilleures pratiques appliquées

### ✅ 1. **OWASP Session Management**

Référence : [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

- ✅ Invalidation du token côté serveur
- ✅ Nettoyage complet côté client
- ✅ Suppression de tous les mécanismes de persistance
- ✅ Rechargement complet de la page (pas d'état résiduel)

### ✅ 2. **Defense in Depth**

Plusieurs couches de nettoyage :
1. Serveur (invalidation refresh token)
2. API Client (tokens)
3. Zustand Store (state + localStorage)
4. React Query (cache)
5. Session Storage
6. Cookies
7. Rechargement page

### ✅ 3. **Fail-Safe Design**

Chaque étape est dans un `try/catch` indépendant :

```tsx
try {
    await apiClient.logout();
} catch (error) {
    console.warn('[Logout] Échec invalidation serveur (non bloquant)');
}

// Continue même si serveur inaccessible
apiClient.clearTokens();
// ...
```

### ✅ 4. **Protection Anti Double-Clic**

```tsx
let isLoggingOut = false;

export async function handleLogout(options) {
    if (isLoggingOut) {
        console.warn('[Logout] Déconnexion déjà en cours, ignorée');
        return;
    }
    
    try {
        isLoggingOut = true;
        await secureLogout(options);
    } finally {
        if (!options?.redirect) {
            isLoggingOut = false;
        }
    }
}
```

### ✅ 5. **Nettoyage Garanti (Finally Block)**

Même en cas d'erreur critique :

```tsx
catch (error) {
    console.error('[Logout] Erreur critique:', error);
    
    // FORCER le nettoyage et la redirection
    apiClient.clearTokens();
    localStorage.removeItem('elisaschool-auth');
    window.location.href = '/auth/login';
}
```

### ✅ 6. **Import Dynamique (Code Splitting)**

```tsx
const { handleLogout: secureHandleLogout } = await import('@/lib/secure-logout');
```

- ✅ Réduit le bundle initial
- ✅ Chargement uniquement quand nécessaire
- ✅ Pas d'impact sur les performances

## 🧪 Guide de Test

### Scénario 1 : Déconnexion normale

1. **Se connecter** en tant qu'utilisateur A
2. **Vérifier** dans DevTools → Application → Local Storage :
   - `accessToken` existe
   - `refreshToken` existe
   - `elisaschool-auth` existe avec données utilisateur A
3. **Cliquer** sur "Déconnexion"
4. **Vérifier** que tout est supprimé :
   - ✅ `accessToken` = null
   - ✅ `refreshToken` = null
   - ✅ `elisaschool-auth` = supprimé
5. **Se connecter** en tant qu'utilisateur B
6. **Vérifier** que les données sont celles de B :
   - ✅ `utilisateur.email` = email de B
   - ✅ `etablissementId` = établissement de B

### Scénario 2 : Double déconnexion

1. **Cliquer** 2 fois rapidement sur "Déconnexion"
2. **Vérifier** dans Console :
   ```
   [Logout] Déconnexion déjà en cours, ignorée
   ```
3. ✅ Une seule déconnexion effectuée

### Scénario 3 : Serveur inaccessible

1. **Couper** le backend (stop Docker)
2. **Cliquer** sur "Déconnexion"
3. **Vérifier** dans Console :
   ```
   [Logout] Échec invalidation serveur (non bloquant)
   [Logout] Déconnexion sécurisée complétée avec succès
   ```
4. ✅ Déconnexion réussie même sans serveur

### Scénario 4 : Navigation après déconnexion

1. **Se connecter**
2. **Naviguer** vers plusieurs pages
3. **Se déconnecter**
4. **Cliquer** sur le bouton "Précédent" du navigateur
5. ✅ Reste sur `/auth/login` (pas de retour en arrière)

## 📊 Comparaison Avant/Après

| Aspect | ❌ Avant | ✅ Après |
|--------|---------|---------|
| Tokens localStorage | Partiel (2/3) | Complet (3/3) |
| Cache React Query | Non nettoyé | `queryClient.clear()` |
| Session Storage | Non nettoyé | Nettoyé (clés elisaschool-*) |
| Cookies | Non nettoyés | Supprimés (auth/token/session) |
| Protection double-clic | Aucune | Flag `isLoggingOut` |
| Rechargement page | `window.location.href` | `window.location.href` (correct) |
| Gestion erreurs | Crash possible | Fail-safe garanti |
| Import | Statique | Dynamique (code splitting) |
| Navigation login | `/login` (incorrect) | `/auth/login` (correct) |

## 🔐 Sécurité renforcée

### Tokens supprimés

| Stockage | Clé supprimée | Méthode |
|----------|--------------|---------|
| localStorage | `accessToken` | `apiClient.clearTokens()` |
| localStorage | `refreshToken` | `apiClient.clearTokens()` |
| localStorage | `elisaschool-auth` | `localStorage.removeItem()` |
| sessionStorage | `elisaschool-*` | Loop + `removeItem()` |
| Cookies | `*auth*`, `*token*`, `*session*` | Expiration 1970 |

### États réinitialisés

| État | Valeur après logout |
|------|-------------------|
| `authStore.accessToken` | `null` |
| `authStore.refreshToken` | `null` |
| `authStore.utilisateur` | `null` |
| `authStore.isAuthenticated` | `false` |
| `authStore.etablissementId` | `null` |
| `apiClient.accessToken` | `null` |
| `apiClient.refreshToken` | `null` |
| `queryClient.cache` | `clear()` |

## 🚀 Utilisation dans d'autres composants

### Pattern recommandé

```tsx
import { handleLogout } from '@/lib/secure-logout';

function MonComposant() {
    const handleDeconnexion = async () => {
        await handleLogout({ redirect: true });
    };
    
    return <button onClick={handleDeconnexion}>Déconnexion</button>;
}
```

### Sans redirection (pour gestion manuelle)

```tsx
import { secureLogout } from '@/lib/secure-logout';

async function logoutSansRedirect() {
    await secureLogout({ redirect: false });
    // Gestion manuelle de la navigation
}
```

### Vérifier si déconnexion en cours

```tsx
import { isLogoutInProgress } from '@/lib/secure-logout';

if (isLogoutInProgress()) {
    console.log('Déconnexion en cours, attendre...');
    return;
}
```

## 📝 Logs de débogage

### Déconnexion réussie

```
[Logout] Déconnexion sécurisée complétée avec succès
```

### Échec serveur (non bloquant)

```
[Logout] Échec invalidation serveur (non bloquant): Error: Network error
[Logout] Déconnexion sécurisée complétée avec succès
```

### Double déconnexion

```
[Logout] Déconnexion déjà en cours, ignorée
```

### Erreur critique

```
[Logout] Erreur critique lors de la déconnexion: Error: ...
(Nettoyage forcé et redirection automatique)
```

## ⚠️ Points d'attention

### 1. **Ne JAMAIS** appeler directement `useAuthStore.getState().reset()`

Toujours utiliser `secureLogout()` ou `handleLogout()` pour garantir le nettoyage complet.

### 2. **Ne JAMAIS** utiliser `window.location.href = '/login'`

Le chemin correct est `/auth/login` (route TanStack Router).

### 3. **Toujours** utiliser `handleLogout()` pour les boutons UI

Il inclut la protection anti double-clic.

### 4. **Éviter** les imports statiques de `secure-logout`

Préférer l'import dynamique pour le code splitting :
```tsx
const { handleLogout } = await import('@/lib/secure-logout');
```

## 🎯 Prochaines améliorations

1. **Invalidation refresh token Redis** : Stocker les refresh tokens en Redis avec capacité de révocation
2. **Blacklist de tokens** : Maintenir une liste des tokens invalidés côté serveur
3. **WebSocket cleanup** : Déconnecter les WebSocket lors du logout
4. **Analytics logout** : Tracker les déconnexions pour détection d'anomalies
5. **Session timeout configurable** : Paramètre utilisateur pour durée de session

## 📚 Références

- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Zustand Persist Middleware](https://github.com/pmndrs/zustand#persist-middleware)
- [React Query Cache Management](https://tanstack.com/query/latest/docs/react/guides/query-cache)
