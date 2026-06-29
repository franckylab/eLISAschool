# 🔍 Analyse - Erreur 403 Forbidden sur GET /api/eleves

**Date** : 11 juin 2026  
**Statut** : 🔍 **Analysé - Solution Identifiée**  

---

## 🐛 Erreur Rencontrée

```
GET http://localhost:3001/api/eleves?page=1&limit=20 403 (Forbidden)
```

**Localisation** : `frontend/src/features/eleves/hooks/use-eleves.ts:33`

---

## 🔍 Analyse

### Cause Racine

L'erreur **403 Forbidden** indique un problème d'**autorisation** au niveau du backend.

### Controller Backend

```typescript
// backend/src/modules/eleves/controllers/eleves.controller.ts:20
router.get('/', 
    authMiddleware, 
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.PERSONNEL), 
    async (req, res) => { ... }
);
```

**Rôles requis** :
- ✅ ADMIN
- ✅ SUPER_ADMIN
- ✅ CHEF_ETABLISSEMENT
- ✅ PERSONNEL

### Problèmes Identifiés

#### 1. Token JWT Invalide ou Expiré
```bash
# Test du token
curl -s http://localhost:3001/api/auth/me -H "Authorization: Bearer <token>"

# Résultat
{"success":false,"error":{"code":"INVALID_TOKEN","message":"Token invalide ou expiré"}}
```

**Cause** : 
- Token expiré ( TTL par défaut : 7 jours)
- Token mal stocké dans le frontend
- Session perdue après redémarrage

#### 2. Identifiants de Connexion Incorrects
```bash
# Test de connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifiant":"admin@elisaschool.com","motDePasse":"admin123"}'

# Résultat
{"success":false,"error":{"message":"Identifiant ou mot de passe incorrect"}}
```

**Cause** :
- Le compte `admin@elisaschool.com` n'existe pas dans la base de données
- Le mot de passe `admin123` est incorrect
- Les seeds n'ont pas été chargés

#### 3. Frontend Non Authentifié
Le composant `ElevesPage` appelle `useEleves()` qui fait une requête API **sans vérifier si l'utilisateur est connecté**.

---

## ✅ Solutions

### Solution 1 : Vérifier l'Authentification dans le Frontend

**Fichier à modifier** : `frontend/src/features/eleves/components/eleves-page.tsx`

**Avant** :
```typescript
const { data, isLoading, error } = useEleves({
    page,
    limit,
    search: filtres.search,
    classeId: filtres.classeId,
});
```

**Après** :
```typescript
const { isAuthenticated } = useAuth(); // Hook d'authentification
const { data, isLoading, error } = useEleves(
    {
        page,
        limit,
        search: filtres.search,
        classeId: filtres.classeId,
    },
    { enabled: isAuthenticated } // Ne pas appeler si non connecté
);
```

---

### Solution 2 : Rediriger vers Login si Non Authentifié

**Fichier à modifier** : Route TanStack Router

```typescript
// frontend/src/app/routes/_auth.eleves.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { ElevesPage } from '@/features/eleves/components/eleves-page';
import { getAuth } from '@/lib/auth';

export const Route = createFileRoute('/_auth/eleves')({
    beforeLoad: async () => {
        const auth = getAuth();
        if (!auth.isAuthenticated) {
            throw redirect({ to: '/auth/login' });
        }
    },
    component: ElevesPage,
});
```

---

### Solution 3 : Initialiser les Données de Test (Seeds)

```bash
# Charger les seeds pour créer le compte admin
cd backend
npm run seed:run

# Vérifier que le compte existe
docker exec -it elisaschool-postgres psql -U elisaschool -d elisaschool -c \
  "SELECT email, role FROM utilisateurs WHERE email = 'admin@elisaschool.com';"
```

---

### Solution 4 : Tester avec un Token Valide

```bash
# 1. Se connecter
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifiant":"<email>","motDePasse":"<password>"}' \
  | jq -r '.data.token')

# 2. Tester l'API
curl -s http://localhost:3001/api/eleves?page=1&limit=20 \
  -H "Authorization: Bearer $TOKEN"

# 3. Vérifier le rôle
curl -s http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq '.data.utilisateur.role'
```

---

## 📊 Diagnostic Complet

### Checklist de Vérification

- [ ] **Backend en cours d'exécution** : `curl http://localhost:3001/api/health`
- [ ] **Base de données accessible** : `docker ps | grep postgres`
- [ ] **Seeds chargés** : `npm run seed:run`
- [ ] **Compte admin existe** : Requête SQL ci-dessus
- [ ] **Token JWT valide** : Se connecter et vérifier
- [ ] **Frontend utilise le token** : Vérifier localStorage/cookies
- [ ] **Hook useAuth() disponible** : Vérifier l'implémentation

---

## 🔧 Correctifs Immédiats

### 1. Vérifier les Seeds

```bash
cd backend
npm run seed:run
```

### 2. Nettoyer le Cache du Frontend

```bash
# Dans le navigateur
# F12 > Application > Local Storage > Supprimer tout
# Recharger la page (Ctrl+Shift+R)
```

### 3. Se Connecter Properment

1. Aller à http://localhost:5173/auth/login
2. Utiliser les identifiants corrects (après seeds)
3. Vérifier que le token est stocké
4. Naviguer vers /eleves

---

## 📝 Recommandations

### Court Terme
1. ✅ Implémenter la vérification d'authentification dans tous les hooks API
2. ✅ Ajouter des guards de route TanStack Router
3. ✅ Rediriger vers /login si token expiré
4. ✅ Afficher un message d'erreur clair (401/403)

### Moyen Terme
1. ✅ Implémenter le refresh token automatique
2. ✅ Stocker le token de manière sécurisée (httpOnly cookies)
3. ✅ Ajouter un interceptor Axios pour gérer les 401/403
4. ✅ Tester les seeds dans CI/CD

### Long Terme
1. ✅ Implémenter OAuth2 / SSO
2. ✅ Support multi-factor authentication
3. ✅ Audit des connexions
4. ✅ Rate limiting sur /login

---

## 🎯 Prochaines Actions

**Priorité 1** (Immédiat) :
- [ ] Vérifier que les seeds sont chargés
- [ ] Tester la connexion avec les bons identifiants
- [ ] Vérifier que le token est stocké correctement

**Priorité 2** (Cette session) :
- [ ] Ajouter `enabled: isAuthenticated` aux hooks API
- [ ] Implémenter la redirection vers /login
- [ ] Améliorer la gestion des erreurs 401/403

**Priorité 3** (Future session) :
- [ ] Refresh token automatique
- [ ] Interceptor global pour les erreurs d'auth
- [ ] Tests E2E d'authentification

---

**Analyse terminée - Solutions identifiées** ✅

---

*11 juin 2026 - eLISAschool*
