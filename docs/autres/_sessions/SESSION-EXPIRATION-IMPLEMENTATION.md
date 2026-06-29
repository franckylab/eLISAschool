# Gestion d'Expiration de Session - Implémentation

## Résumé

Implémentation d'une redirection automatique vers la page de connexion lorsque le token d'accès ou le refresh token expire, suivant les **meilleures pratiques** en matière de gestion de session.

## Architecture

### Flux de gestion d'expiration

```
Token expiré (401)
    ↓
api-client.ts tente un refresh
    ↓
├─ Refresh réussi → Nouveau token, requête retryée
└─ Refresh échoué (INVALID_REFRESH_TOKEN)
    ↓
    dispatch('auth:session-expired')
    ↓
useSessionExpired hook (dans _auth.tsx)
    ↓
    1. Nettoyage du store (reset)
    2. Toast informatif
    3. Navigation vers /auth/login (replace: true)
```

## Fichiers modifiés/créés

### 1. **Nouveau hook** : `frontend/src/hooks/use-session-expired.ts`

Hook React global qui écoute deux événements :

- `auth:session-expired` → Session expirée automatiquement (refresh token invalide)
- `auth:logout` → Déconnexion volontaire de l'utilisateur

**Fonctionnalités** :
- ✅ Nettoyage automatique du store Zustand
- ✅ Toast informatif avec message contextualisé
- ✅ Redirection vers `/auth/login` avec `replace: true` (empêche le retour arrière)
- ✅ Protection contre les toasts multiples (ref cool-down de 10s)
- ✅ Nettoyage propre des event listeners (unmount)

### 2. **Layout auth** : `frontend/src/routes/_auth.tsx`

Intégration du hook dans le layout principal :

```tsx
function AuthLayout() {
    // ... existing hooks ...
    
    // NOUVEAU: Gérer l'expiration de session et la déconnexion
    useSessionExpired();
    
    return <PageLayout>...</PageLayout>;
}
```

### 3. **API Client** : `frontend/src/lib/api-client.ts`

Amélioration de la gestion des erreurs de refresh token :

**Avant** :
- Dispatch d'événements inconsistants (`auth:logout` vs `auth:session-expired`)
- Redirection manuelle avec `window.location.href` (rechargement complet)
- Pas de toast informatif

**Après** :
- ✅ Dispatch systématique de `auth:session-expired` dans 3 cas :
  1. Aucun refresh token disponible
  2. Refresh token invalide/expiré (réponse 401 du backend)
  3. Réponse serveur invalide
- ✅ Suppression des redirections manuelles (`window.location.href`)
- ✅ Gestion centralisée dans le hook `useSessionExpired`
- ✅ Utilisation de `navigate({ replace: true })` (SPA navigation)

### 4. **Barrel export** : `frontend/src/hooks/index.ts`

Export du nouveau hook pour utilisation dans d'autres modules si nécessaire.

## Cas couverts

| Cas | Comportement | Événement dispatché |
|-----|-------------|---------------------|
| Access token expiré (401) | Tentative de refresh automatique | - |
| Refresh réussi | Nouveau token, requête retriable | - |
| Refresh token invalide | Nettoyage + redirection | `auth:session-expired` |
| Refresh token expiré | Nettoyage + redirection | `auth:session-expired` |
| Aucun refresh token | Nettoyage + redirection | `auth:session-expired` |
| Déconnexion volontaire | Nettoyage + redirection | `auth:logout` |
| Token sans etablissementId | Modal de sélection | `auth:etablissement-required` |

## Messages utilisateur

### Session expirée
```
Toast error: "Session expirée"
Description: "Votre session a expiré. Veuillez vous reconnecter."
Durée: 5 secondes
```

### Déconnexion volontaire
```
Toast info: "Déconnexion réussie"
Description: "Vous avez été déconnecté avec succès."
Durée: 3 secondes
```

## Meilleures pratiques appliquées

### ✅ 1. **Séparation des préoccupations**
- `api-client.ts` : Détection des erreurs et dispatch d'événements
- `use-session-expired.ts` : Écoute des événements et navigation
- `_auth.tsx` : Intégration dans le cycle de vie React

### ✅ 2. **Navigation SPA**
- Utilisation de `useNavigate` de TanStack Router
- `replace: true` empêche le retour en arrière vers une page protégée
- Pas de rechargement complet de la page (`window.location.href` supprimé)

### ✅ 3. **UX utilisateur**
- Toast informatif avec message contextualisé
- Protection contre les toasts multiples (ref cool-down)
- Redirection automatique sans action utilisateur

### ✅ 4. **Nettoyage mémoire**
- `useEffect` cleanup pour les event listeners
- Reset du store Zustand pour éviter les états inconsistants
- Pas de fuite mémoire (listeners supprimés à l'unmount)

### ✅ 5. **Cohérence des événements**
- Un seul événement pour l'expiration : `auth:session-expired`
- Un seul événement pour la déconnexion : `auth:logout`
- Plus de mélange entre les deux

### ✅ 6. **Sécurité**
- Nettoyage des tokens côté client (`clearTokens()`)
- Reset du store Zustand (`initialState`)
- Empêche l'accès aux pages protégées après expiration

## Test manuel

### Scénario 1 : Expiration normale
1. Se connecter
2. Attendre l'expiration du token (ou modifier manuellement le token dans localStorage)
3. Faire une requête API
4. **Rés attendu** : Toast "Session expirée" + redirection vers login

### Scénario 2 : Refresh token invalide
1. Se connecter
2. Supprimer/modifier le refresh token dans localStorage
3. Faire une requête API
4. **Rés attendu** : Toast "Session expirée" + redirection vers login

### Scénario 3 : Déconnexion volontaire
1. Se connecter
2. Cliquer sur "Déconnexion"
3. **Rés attendu** : Toast "Déconnexion réussie" + redirection vers login

### Scénario 4 : Retour arrière bloqué
1. Se connecter → naviguer vers une page
2. Session expire → redirection login
3. Cliquer sur le bouton "Précédent" du navigateur
4. **Rés attendu** : Reste sur la page login (grâce à `replace: true`)

## Intégration avec React Query

Les hooks `useQuery` de React Query gèrent automatiquement les erreurs via :

```tsx
// Exemple dans use-analytics.ts
export function useDashboardAnalytics(filtres?: FiltresAnalytics) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: ANALYTICS_KEYS.dashboard(filtres),
        queryFn: async () => {
            const response = await apiClient.get('/api/analytics/dashboard', { params: filtres ?? {} });
            return response.data?.data;
        },
        enabled: isAuthenticated, // ← Query désactivée si non authentifié
        staleTime: 5 * 60 * 1000,
    });
}
```

Quand `auth:session-expired` est dispatché :
1. Le store est reset → `isAuthenticated = false`
2. Les queries sont désactivées (`enabled: false`)
3. Le cache React Query est automatiquement invalidé
4. La redirection vers login est effectuée

## Compatibilité multi-tenant

Le système fonctionne avec la logique multi-tenant existante :

- `auth:etablissement-required` → Affiche la modal de sélection d'établissement
- `auth:session-expired` → Redirige vers login (token complètement invalide)
- Les deux événements sont mutuellement exclusifs

## Monitoring et logs

Les événements sont logués dans la console pour le débogage :

```
[API] Token invalide
[API] Token incomplet: etablissementId manquant
[Auth Store] Tokens synchronisés avec API Client
```

## Prochaines améliorations possibles

1. **Refresh proactif** : Détecter l'expiration 1min avant et refresh automatiquement
2. **WebSocket heartbeat** : Maintenir la session active avec des pings
3. **Offline mode** : Mettre en cache les requêtes échouées et les rejouer après reconnexion
4. **Analytics** : Tracker le nombre d'expirations de session par utilisateur

## Références

- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [TanStack Router Navigation](https://tanstack.com/router/latest/docs/framework/react/guide/navigation)
- [React Query Authentication](https://tanstack.com/query/latest/docs/framework/react/guides/authentication)
