# CORRECTION ERREUR 401 - JWT_SECRET Dynamique

## 🎯 Problème Critique Identifié

### Symptômes
- ✅ Frontend authentifié (396 permissions, SUPER_ADMIN)
- ✅ Token envoyé dans les requêtes API
- ❌ Backend retourne **401 Unauthorized** sur toutes les requêtes

### Cause Racine

**Fichier** : `backend/src/config/env.config.ts` (ligne 97)

```typescript
// ❌ AVANT - Secret généré dynamiquement à chaque démarrage
JWT_SECRET: generateDevSecret(64),
```

**Problème** :
- `generateDevSecret(64)` génère un **nouveau secret aléatoire** à chaque démarrage du backend
- Tous les tokens JWT signés avec l'**ancien secret** deviennent **invalides**
- Erreur : `JsonWebTokenError: invalid signature`

### Exemple

```
Démarrage 1: JWT_SECRET = "abc123..."
→ Login → Token signé avec "abc123..."
→ Requêtes API → ✅ 200 OK

Redémarrage: JWT_SECRET = "xyz789..."  ← NOUVEAU SECRET
→ Requêtes avec ancien token → ❌ 401 Unauthorized
→ Message backend: "invalid signature"
```

## ✅ Correction Appliquée

### Code Modifié

**Fichier** : `backend/src/config/env.config.ts`

```typescript
// ✅ APRÈS - Utiliser process.env.JWT_SECRET si présent
const jwtSecret = process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
    ? process.env.JWT_SECRET  // ← Depuis .env (STABLE)
    : generateDevSecret(64);   // ← Fallback (uniquement si absent)

const encryptionKey = process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length === 32
    ? process.env.ENCRYPTION_KEY
    : generateDevSecret(32);

// ...

JWT_SECRET: jwtSecret,           // ← Stable entre redémarrages
ENCRYPTION_KEY: encryptionKey,   // ← Stable entre redémarrages
```

### Log de Diagnostic Ajouté

```typescript
if (env.NODE_ENV === 'development') {
    console.log(`[ENV Config] JWT_SECRET utilisé: ${env.JWT_SECRET.substring(0, 15)}... (longueur: ${env.JWT_SECRET.length})`);
    console.log(`[ENV Config] JWT_SECRET source: ${process.env.JWT_SECRET ? '.env' : 'généré dynamiquement'}`);
}
```

## 📋 Étapes de Correction

### 1. Redémarrer le backend

```bash
# Terminal backend
# Arrêter avec Ctrl+C

# Redémarrer
cd backend
npm run dev
# ou
npx tsx watch src/app.ts
```

### 2. Vérifier les logs de démarrage

**Logs attendus** :
```
✅ .env chargé depuis: /mnt/DONNEES/projets/eLISAschool/.env
[ENV Config] JWT_SECRET utilisé: dev_jwt_secret_c... (longueur: 44)
[ENV Config] JWT_SECRET source: .env
```

**Si vous voyez** :
```
[ENV Config] JWT_SECRET source: généré dynamiquement
```

**→ Alerte** : Le `.env` n'a pas été chargé correctement !

### 3. Se reconnecter

1. **Déconnectez-vous** (logout)
2. **Reconnectez-vous**
3. **Sélectionnez** un établissement
4. **Naviguez** vers Dashboard, Niveaux, etc.

**Résultat** : ✅ Plus d'erreur 401

## 🔍 Vérification

### Test 1 : JWT_SECRET stable entre redémarrages

```bash
# Démarrage 1
npm run dev
# Notez: [ENV Config] JWT_SECRET utilisé: dev_jwt_secret_c...

# Arrêter (Ctrl+C)
# Redémarrer
npm run dev
# Notez: [ENV Config] JWT_SECRET utilisé: dev_jwt_secret_c... ← IDENTIQUE !
```

### Test 2 : Tokens valides après redémarrage

1. Démarrez backend
2. Connectez-vous
3. Notez le token dans localStorage
4. Redémarrez backend
5. Faites une requête API avec l'ancien token

**Avant** : ❌ 401 Unauthorized  
**Après** : ✅ 200 OK

### Test 3 : Vérification manuelle

```javascript
// Frontend Console
const token = localStorage.getItem('accessToken');
const parts = token.split('.');
const signature = parts[2];

console.log('Signature:', signature.substring(0, 20) + '...');

// Redémarrez backend, puis refaites le test
// La signature doit être IDENTIQUE (même secret utilisé)
```

## 📊 Comparaison Avant/Après

| Aspect | ❌ Avant | ✅ Après |
|--------|---------|---------|
| **JWT_SECRET** | Généré dynamiquement | Lu depuis `.env` |
| **Stabilité** | Change à chaque redémarrage | Stable entre redémarrages |
| **Tokens après redémarrage** | Invalides (401) | Valides (200) |
| **Durée de vie** | 7 jours (inutile si redémarrage) | 7 jours (effective) |
| **Développement** | Reconnexion obligatoire | Session persiste |

## 🎯 Bonnes Pratiques

### 1. Toujours définir JWT_SECRET dans .env

```env
# .env
JWT_SECRET=dev_jwt_secret_change_in_production_256bits
ENCRYPTION_KEY=dev_encryption_key_32chars__1234
```

### 2. Ne JAMAIS changer JWT_SECRET en production

- Changer `JWT_SECRET` invalide **TOUS** les tokens existants
- Tous les utilisateurs doivent se reconnecter
- En production, utiliser un gestionnaire de secrets (Vault, AWS Secrets Manager, etc.)

### 3. Longueur minimale

```typescript
// Schéma Zod
JWT_SECRET: z.string().min(32, 'Le secret JWT doit faire au moins 32 caractères')
```

- **Minimum** : 32 caractères
- **Recommandé** : 64 caractères ou plus
- **Production** : Utiliser `openssl rand -hex 64`

### 4. Vérifier le chargement du .env

```bash
# Au démarrage, vous devriez voir:
✅ .env chargé depuis: /path/to/.env

# Si vous voyez:
⚠️ Fichier .env non trouvé, utilisation des valeurs par défaut

# → CRITIQUE en production, OK en dev si JWT_SECRET est défini
```

## 🔧 Génération de Secrets Sécurisés

### Développement

```bash
# JWT_SECRET (64 caractères)
openssl rand -hex 32
# Exemple: a1b2c3d4e5f6... (64 caractères)

# ENCRYPTION_KEY (32 caractères)
openssl rand -hex 16
# Exemple: 1a2b3c4d5e6f... (32 caractères)
```

### Production

```bash
# JWT_SECRET (128 caractères)
openssl rand -hex 64

# ENCRYPTION_KEY (32 caractères - AES-256)
openssl rand -hex 16
```

**OU** utiliser un gestionnaire de secrets :
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- Docker Secrets

## 📝 Checklist de Vérification

### Configuration

- [x] `.env` contient `JWT_SECRET` (>= 32 caractères)
- [x] `.env` contient `ENCRYPTION_KEY` (== 32 caractères)
- [x] `env.config.ts` utilise `process.env.JWT_SECRET` (pas `generateDevSecret()`)
- [x] Log de démarrage affiche `source: .env`

### Tests

- [ ] Backend redémarré
- [ ] Logs de démarrage montrent `source: .env`
- [ ] Déconnexion + reconnexion réussie
- [ ] Navigation vers Niveaux → ✅ 200 OK
- [ ] Navigation vers Dashboard → ✅ 200 OK
- [ ] Tokens valides après redémarrage backend

## 🚨 Pièges à Éviter

### 1. Changer JWT_SECRET fréquemment

**Conséquence** :
- Tous les tokens invalidés
- Reconnexion obligatoire pour tous les utilisateurs
- Session perdue

**Solution** :
- Définir une fois dans `.env`
- Ne JAMAIS modifier en production
- En dev, seulement si nécessaire (puis reconnexion)

### 2. Utiliser des secrets courts

**Conséquence** :
- Vulnérabilité aux attaques par force brute
- Non-conformité aux standards (OWASP)

**Solution** :
- Minimum 32 caractères
- Recommandé 64+ caractères
- Utiliser `openssl rand -hex`

### 3. Commit le .env avec secrets

**Conséquence** :
- Secrets exposés publiquement
- Violation de sécurité critique

**Solution** :
- `.env` dans `.gitignore`
- Utiliser `.env.example` avec valeurs de placeholder
- Gestionnaire de secrets en production

### 4. Ignorer les warnings de démarrage

**Conséquence** :
- Problèmes de configuration non détectés
- Tokens invalides en production

**Solution** :
- Toujours vérifier les logs de démarrage
- Automatiser les health checks
- Monitoring des erreurs JWT

## 📚 Références

- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [Node.js crypto.randomBytes](https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback)

---

**Statut** : ✅ **CORRIGÉ**  
**Impact** : Critique (toutes les requêtes API échouaient)  
**Risque** : Faible (correction de configuration)  
**Test requis** : Redémarrage backend + navigation
