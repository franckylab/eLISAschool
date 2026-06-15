# Diagnostic Erreur 401 - Token Invalide après CompleteLogin

## 🚨 Problème Identifié

**Symptôme** : 
- ✅ Guard autorise l'accès (396 permissions, SUPER_ADMIN)
- ❌ Appels API retournent **401 Unauthorized**
- Exemple : `GET /api/niveaux/all` → 401

**Cause probable** : Le token envoyé par le frontend est **rejeté par le backend** lors de la vérification JWT.

## 🔍 Logs de Diagnostic Ajoutés

### Frontend (Console DevTools)

```javascript
[Auth Store] Tokens synchronisés avec apiClient: {
    hasAccessToken: true,
    tokenMatch: true
}

[API Client] Requête avec token: {
    endpoint: "/api/niveaux/all",
    hasToken: true,
    tokenPrefix: "eyJhbGciOiJIUzI1NiI...",
    hasEtablissementId: "c644c03e-cf66-4c3f-90f1-fb774f21e1f1"
}
```

### Backend (Logs serveur)

```javascript
[Auth Middleware] Token invalide ou expiré: {
    tokenPrefix: "eyJhbGciOiJIUzI1NiI...",
    tokenLength: 1234,
    hasThreeParts: true
}

Échec de vérification du token JWT: {
    error: "jwt malformed" | "invalid signature" | "jwt expired",
    errorName: "JsonWebTokenError" | "TokenExpiredError",
    tokenPrefix: "eyJhbGciOiJIUzI1NiI..."
}
```

## 📋 Étapes de Diagnostic

### 1. **Reproduire et collecter les logs**

1. Lancez frontend + backend
2. Connectez-vous et sélectionnez un établissement
3. Naviguez vers la page Niveaux
4. **Copiez TOUS les logs** :
   - Console frontend (F12)
   - Terminal backend

### 2. **Analyser selon le type d'erreur**

#### Type A : `TokenExpiredError`

**Log backend** :
```
Token expiré: { expiredAt: "2024-01-15T10:00:00.000Z" }
```

**Cause** : Le token a une durée de vie trop courte ou l'horloge est désynchronisée.

**Solution** :
```bash
# Vérifier la date système
date

# Vérifier JWT_EXPIRES_IN dans .env
grep JWT_EXPIRES_IN backend/.env
# Exemple: JWT_EXPIRES_IN=15m (trop court)
```

**Correction** : Augmenter la durée de vie :
```env
JWT_EXPIRES_IN=1h  # ou 2h
```

---

#### Type B : `JsonWebTokenError: invalid signature`

**Log backend** :
```
Token malformé ou signature invalide: { message: "invalid signature" }
```

**Cause** : Le `JWT_SECRET` a changé entre la génération et la vérification.

**Vérification** :
```bash
# Voir le JWT_SECRET utilisé
grep JWT_SECRET backend/.env

# Doit être IDENTIQUE à chaque redémarrage
# Si vous changez JWT_SECRET, tous les tokens existants deviennent invalides
```

**Solution** :
1. **NE JAMAIS** changer `JWT_SECRET` en production
2. En dev, si vous changez `JWT_SECRET`, **déconnectez-vous et reconnectez-vous**

---

#### Type C : `tokenMatch: false`

**Log frontend** :
```javascript
[Auth Store] Tokens synchronisés avec apiClient: {
    hasAccessToken: true,
    tokenMatch: false  // ← PROBLÈME !
}
```

**Cause** : `apiClient` n'a pas la même instance de token que le store Zustand.

**Vérification** :
```javascript
// Dans Console DevTools
const { useAuthStore } = await import('/src/stores/auth.store.ts');
const { apiClient } = await import('/src/lib/api-client.ts');

const storeToken = useAuthStore.getState().accessToken;
const apiToken = apiClient.getAccessToken();

console.log('Store token:', storeToken?.substring(0, 30));
console.log('API token:', apiToken?.substring(0, 30));
console.log('Match:', storeToken === apiToken);
```

**Solution** : Redémarrer l'application (problème d'instance singleton).

---

#### Type D : Token valide mais 401 quand même

**Logs** :
```
Frontend: tokenMatch: true, hasEtablissementId: "..."
Backend: Token invalide ou expiré
```

**Cause** : Problème de **CORS** ou **headers non envoyés**.

**Vérification Network** :
1. Ouvrez DevTools → Network
2. Filtrez par "niveaux"
3. Cliquez sur la requête `GET /api/niveaux/all`
4. Onglet **Headers** → **Request Headers**

**Vérifiez** :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiI...  ← Doit être présent
```

**Si absent** : Problème dans `api-client.ts` (intercepteurs).

---

## 🧪 Tests Manuels

### Test 1 : Décoder le token manuellement

```javascript
// Frontend Console
const token = localStorage.getItem('accessToken');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));

console.log('Token payload:', {
    sub: payload.sub,           // User ID
    email: payload.email,
    role: payload.role,
    etablissementId: payload.etablissementId,
    iat: payload.iat,           // Issued at (timestamp)
    exp: payload.exp,           // Expiration (timestamp)
});

// Vérifier expiration
const now = Date.now() / 1000;
console.log('Token valide:', payload.exp > now);
console.log('Expire dans:', Math.floor((payload.exp - now) / 60), 'minutes');
```

### Test 2 : Appeler l'API manuellement

```javascript
const token = localStorage.getItem('accessToken');

const response = await fetch('http://localhost:7000/api/niveaux/all', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
});

console.log('Status:', response.status);
const data = await response.json();
console.log('Réponse:', data);
```

**Si 200** : Le problème vient de `apiClient`  
**Si 401** : Le problème vient du backend (JWT_SECRET ou expiration)

### Test 3 : Vérifier le JWT_SECRET backend

```bash
# Backend
cd backend
cat .env | grep JWT_SECRET

# Devrait afficher:
# JWT_SECRET=votre_secret_tres_long_et_aleatoire

# Vérifier qu'il n'a PAS changé entre deux redémarrages
```

---

## 🎯 Solutions selon le diagnostic

### Solution 1 : JWT_EXPIRES_IN trop court

**Fichier** : `backend/.env`

```env
# AVANT
JWT_EXPIRES_IN=15m

# APRÈS
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

**Puis** : Redémarrer le backend

---

### Solution 2 : JWT_SECRET différent

**Symptôme** : Vous avez redémarré le backend et le `.env` a été regénéré avec un nouveau `JWT_SECRET`.

**Solution** :
1. **Définir un JWT_SECRET fixe** dans `.env` :
   ```env
   JWT_SECRET=eLISAschool_jwt_secret_2024_tres_long_et_aleatoire_CHANGEZ_MOI_EN_PROD
   ```

2. **Redémarrer** backend + frontend
3. **Se déconnecter** et **se reconnecter**

---

### Solution 3 : apiClient pas synchronisé

**Symptôme** : `tokenMatch: false` dans les logs

**Solution** :
```javascript
// Dans Console DevTools
const { useAuthStore } = await import('/src/stores/auth.store.ts');
const { apiClient } = await import('/src/lib/api-client.ts');

// Forcer la synchronisation
const token = useAuthStore.getState().accessToken;
const refreshToken = useAuthStore.getState().refreshToken;

apiClient.setTokens({ accessToken: token, refreshToken });

console.log('Synchronisation forcée');
```

**Ou** : Recharger la page (F5)

---

### Solution 4 : Problème CORS

**Symptôme** : Headers `Authorization` absent dans Network

**Vérification** :
```bash
# Backend .env
FRONTEND_URL=http://localhost:5173

# Doit correspondre EXACTEMENT à l'URL frontend
# PAS de slash à la fin
```

**Fichier** : `backend/src/app.ts`

```typescript
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],  // ← Authorization doit être présent
}));
```

---

## 📊 Table de Diagnostic Rapide

| Symptôme | Cause | Solution |
|----------|-------|----------|
| `TokenExpiredError` | JWT_EXPIRES_IN trop court | Augmenter durée de vie |
| `invalid signature` | JWT_SECRET changé | Fixer JWT_SECRET + reconnexion |
| `tokenMatch: false` | Instances différentes | Recharger page (F5) |
| Headers absents | CORS | Vérifier FRONTEND_URL |
| `jwt malformed` | Token corrompu | Se reconnecter |
| `NotBeforeError` | Horloge désynchronisée | Synchroniser horloge système |

---

## ✅ Checklist de Vérification

### Frontend

- [ ] Logs `[Auth Store] Tokens synchronisés` visibles
- [ ] `tokenMatch: true`
- [ ] `hasEtablissementId` présent dans le token
- [ ] Headers `Authorization` visible dans Network

### Backend

- [ ] Logs `[Auth Middleware]` visibles
- [ ] Pas de `TokenExpiredError`
- [ ] Pas de `JsonWebTokenError`
- [ ] `JWT_SECRET` fixe (pas changé entre redémarrages)
- [ ] `JWT_EXPIRES_IN` >= 1h

### Réseau

- [ ] `FRONTEND_URL` dans `.env` backend correspond au port frontend
- [ ] CORS configuré correctement
- [ ] Headers `Authorization` envoyés

---

## 🔧 Commande de Debug Rapide

### Tout-en-un (Frontend Console)

```javascript
(async () => {
    console.log('=== DIAGNOSTIC TOKEN ===\n');
    
    // 1. Store Zustand
    const { useAuthStore } = await import('/src/stores/auth.store.ts');
    const state = useAuthStore.getState();
    console.log('1. Store Zustand:', {
        isAuthenticated: state.isAuthenticated,
        etablissementId: state.etablissementId,
        role: state.utilisateur?.role,
    });
    
    // 2. apiClient
    const { apiClient } = await import('/src/lib/api-client.ts');
    console.log('2. apiClient:', {
        hasToken: !!apiClient.getAccessToken(),
        tokenMatch: apiClient.getAccessToken() === state.accessToken,
    });
    
    // 3. localStorage
    const storedToken = localStorage.getItem('accessToken');
    console.log('3. localStorage:', {
        hasToken: !!storedToken,
        tokenMatch: storedToken === state.accessToken,
    });
    
    // 4. Décoder token
    if (state.accessToken) {
        const parts = state.accessToken.split('.');
        const payload = JSON.parse(atob(parts[1]));
        const now = Date.now() / 1000;
        console.log('4. Token payload:', {
            sub: payload.sub,
            role: payload.role,
            etablissementId: payload.etablissementId,
            valide: payload.exp > now,
            expireDans: Math.floor((payload.exp - now) / 60) + ' min',
        });
    }
    
    // 5. Test API
    try {
        const response = await fetch('http://localhost:7000/api/niveaux/all', {
            headers: { 'Authorization': `Bearer ${state.accessToken}` },
        });
        console.log('5. Test API:', {
            status: response.status,
            ok: response.ok,
        });
    } catch (error) {
        console.log('5. Test API: ERREUR', error.message);
    }
    
    console.log('\n=== FIN DIAGNOSTIC ===');
})();
```

---

## 📝 Template de Rapport

Si le problème persiste, fournissez :

```
**Logs Frontend** :
[Copier les logs complets de la console]

**Logs Backend** :
[Copier les logs du terminal backend]

**Diagnostic manuel** :
[Résultat de la commande de debug rapide]

**Network Tab** :
- Requête: GET /api/niveaux/all
- Status: 401
- Request Headers: { Authorization: "Bearer ..." }
- Response: { success: false, error: { code: "INVALID_TOKEN", message: "..." } }

**Environnement** :
- JWT_SECRET: (fixe ou changé récemment ?)
- JWT_EXPIRES_IN: ...
- FRONTEND_URL: ...
```

---

**Prochaine étape** : Exécutez la **commande de debug rapide** et partagez les résultats pour identifier précisément la cause !
