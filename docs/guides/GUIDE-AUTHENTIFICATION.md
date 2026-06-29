# 🔐 Guide d'Utilisation - Authentification

**Date** : 11 juin 2026  
**Version** : 1.0.0  

---

## 📋 Vue d'Ensemble

Le système d'authentification a été amélioré pour :
- ✅ Éviter les erreurs 403 (accès non autorisé)
- ✅ Gérer automatiquement les tokens expirés
- ✅ Rediriger vers la page de login si nécessaire

---

## 🛠️ Utilisation dans le Code

### 1. Hook useAuth() - Accès à l'Authentification

**Import** :
```typescript
import { useAuth } from '@/hooks/use-auth';
```

**Utilisation** :
```typescript
function MonComposant() {
    const { 
        isAuthenticated, 
        utilisateur, 
        isLoading,
        logout 
    } = useAuth();

    if (!isAuthenticated) {
        return <div>Veuillez vous connecter</div>;
    }

    return <div>Bienvenue {utilisateur.prenom} !</div>;
}
```

**Propriétés disponibles** :
| Propriété | Type | Description |
|-----------|------|-------------|
| `isAuthenticated` | `boolean` | Vrai si connecté |
| `utilisateur` | `UtilisateurConnecte \| null` | Infos utilisateur |
| `isLoading` | `boolean` | Chargement en cours |
| `etablissementId` | `string \| null` | Établissement actuel |
| `login()` | `Function` | Se connecter |
| `logout()` | `Function` | Se déconnecter + rediriger |

---

### 2. Hook useRequireAuth() - Forcer l'Authentification

**Utilisation** :
```typescript
function PageProtegee() {
    const { utilisateur } = useRequireAuth();
    
    // Si non authentifié, une erreur est levée
    // Le guard de route interceptera l'erreur
    
    return <div>Contenu protégé</div>;
}
```

---

### 3. Hooks API avec Authentification

**Tous les hooks API vérifient maintenant l'authentification** :

```typescript
// ✅ Le hook n'appelle l'API que si authentifié
const { data: eleves } = useEleves({ page: 1, limit: 20 });

// Si !isAuthenticated :
// - Pas de requête envoyée
// - data = undefined
// - isLoading = false
```

**Hooks concernés** :
- ✅ `useEleves()`
- ✅ `useClasses()`
- ✅ `useAnneesScolaires()`
- ✅ `useMatieres()`
- ✅ `usePersonnel()`
- ✅ `useCycles()`
- ✅ `useNiveaux()`
- ✅ `usePeriodes()`

---

## 🔍 Gestion des Erreurs

### Erreur 401 (Non Authentifié)

**Comportement automatique** :
1. Tente de rafraîchir le token
2. Si échec → Nettoie les tokens
3. Redirige vers `/auth/login`

**Aucune action requise** - Tout est automatique !

---

### Erreur 403 (Interdit)

**Comportement** :
- Erreur loguée dans la console
- Le hook reçoit l'erreur
- Afficher un message avec `ErrorMessage`

**Exemple** :
```typescript
const { data, error } = useEleves();

if (error) {
    return <ErrorMessage message="Accès non autorisé" />;
}
```

---

## 📝 Exemples Complets

### Exemple 1 : Page avec Vérification

```typescript
import { useAuth } from '@/hooks/use-auth';
import { useEleves } from '@/features/eleves/hooks/use-eleves';
import { PageSkeleton, ErrorMessage } from '@/components/ui';

function ElevesPage() {
    const { isAuthenticated } = useAuth();
    const { data, isLoading, error } = useEleves({ page: 1 });

    if (!isAuthenticated) {
        return <div>Connectez-vous pour voir les élèves</div>;
    }

    if (isLoading) return <PageSkeleton />;
    if (error) return <ErrorMessage message="Erreur de chargement" />;

    return (
        <div>
            <h1>Liste des élèves</h1>
            {/* Afficher les élèves */}
        </div>
    );
}
```

---

### Exemple 2 : Bouton Déconnexion

```typescript
import { useAuth } from '@/hooks/use-auth';

function Header() {
    const { utilisateur, logout } = useAuth();

    return (
        <header>
            <span>{utilisateur.prenom} {utilisateur.nom}</span>
            <button onClick={logout}>
                Déconnexion
            </button>
        </header>
    );
}
```

---

### Exemple 3 : Hook Personnalisé avec Auth

```typescript
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';

export function useMesEleves() {
    const { isAuthenticated, etablissementId } = useAuthStore();
    
    return useQuery({
        queryKey: ['mes-eleves', etablissementId],
        queryFn: () => fetchEleves(etablissementId),
        enabled: isAuthenticated && !!etablissementId,
    });
}
```

---

## 🎯 Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours vérifier `isAuthenticated`** avant d'afficher des données sensibles
2. **Utiliser `enabled`** dans les hooks API pour éviter les requêtes inutiles
3. **Gérer les états de loading** et d'erreur
4. **Utiliser le hook `useAuth()`** pour la cohérence

### ❌ À ÉVITER

1. ❌ Appeler l'API sans vérifier l'authentification
2. ❌ Stocker les tokens manuellement (utiliser le store)
3. ❌ Ignorer les erreurs 401/403
4. ❌ Dupliquer la logique d'authentification

---

## 🐛 Debugging

### Problème : Erreur 403 persistante

**Solution** :
```bash
# 1. Nettoyer le cache
localStorage.clear();

# 2. Recharger la page
location.reload();

# 3. Se reconnecter
```

---

### Problème : Token expiré

**Solution** :
```typescript
// Vérifier le token
const auth = useAuthStore.getState();
console.log('Token:', auth.accessToken);
console.log('Authentifié:', auth.isAuthenticated);

// Forcer la vérification
await auth.verifierSession();
```

---

### Problème : Redirection loop

**Cause** : Guard de route mal configuré

**Solution** :
```typescript
// Vérifier que le guard n'est pas trop restrictif
beforeLoad: async () => {
    const auth = getAuth();
    if (!auth.isAuthenticated) {
        throw redirect({ to: '/auth/login' });
    }
}
```

---

## 📊 État du Système

### Authentification

| Fonctionnalité | Statut |
|---------------|--------|
| Login/Logout | ✅ Opérationnel |
| Refresh Token | ✅ Automatique |
| Gestion 401 | ✅ Avec redirection |
| Gestion 403 | ✅ Avec logging |
| Hooks protégés | ✅ 8/8 modules |
| Store Zustand | ✅ Persistant |

### Fichiers Clés

| Fichier | Rôle |
|---------|------|
| `stores/auth.store.ts` | Store d'authentification |
| `hooks/use-auth.ts` | Hooks d'accès |
| `lib/api-client.ts` | Client API avec interceptors |
| `features/*/hooks/use-*.ts` | Hooks métier avec auth |

---

## 📞 Support

**Documentation** :
- [`IMPLÉMENTATION-AUTH-COMPLETE.md`](./IMPLÉMENTATION-AUTH-COMPLETE.md)
- [`ANALYSE-ERREUR-403-ELEVES.md`](./ANALYSE-ERREUR-403-ELEVES.md)

**En cas de problème** :
1. Vérifier la console du navigateur
2. Vérifier les tokens dans localStorage
3. Tester avec `curl` l'API backend
4. Consulter les logs backend

---

*11 juin 2026 - eLISAschool*
