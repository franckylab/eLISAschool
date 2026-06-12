# ✅ Correction Complète de l'Erreur CORS - Ports 70xx

## 🐛 Diagnostic

### Erreur Rencontrée
```
Access to fetch at 'http://localhost:7000/api/utilisateurs' from origin 
'http://localhost:5173' has been blocked by CORS policy
```

### Cause Racine
- **Frontend** : Tourne sur `http://localhost:5173` (ancien port)
- **Backend CORS** : Autorise uniquement `http://localhost:7001` (nouveau port)
- **Mismatch** : 5173 ≠ 7001 → Requête bloquée

---

## ✅ Corrections Appliquées

### 1. Backend - Configuration CORS

**Fichier** : `backend/src/config/env.config.ts`

```typescript
// ✅ AVANT (lignes 58 et 109)
FRONTEND_URL: z.string().url().default('http://localhost:5173'),

// ✅ APRÈS
FRONTEND_URL: z.string().url().default('http://localhost:7001'),
```

**Impact** : Le backend autorise maintenant les requêtes provenant de `http://localhost:7001`

---

### 2. Frontend - Configuration Vite

**Fichier** : `frontend/vite.config.ts`

```typescript
// ✅ AVANT (lignes 86-89)
server: {
    port: 5173,
    proxy: {
        '/api': {
            target: process.env.VITE_API_URL || 'http://localhost:3001',
```

```typescript
// ✅ APRÈS
server: {
    port: 7001,  // ← Nouveau port
    proxy: {
        '/api': {
            target: process.env.VITE_API_URL || 'http://localhost:7000',  // ← Backend 7000
```

**Impact** : 
- Frontend écoutera sur le port **7001**
- Proxy API redirigé vers le backend sur le port **7000**

---

### 3. Fichiers .env (Déjà Corrects)

**`.env` (racine)** :
```bash
FRONTEND_URL=http://localhost:7001  ✅
APP_PORT=7000                        ✅
```

**`frontend/.env`** :
```bash
VITE_API_URL=http://localhost:7000  ✅
```

---

## 🚀 Redémarrage du Frontend

### Option 1 : Script Automatisé (Recommandé)

```bash
bash /home/franckylab/projets/eLISAschool/scripts/restart-frontend.sh
```

Ce script va :
1. ✅ Tuer le processus frontend actuel (port 5173)
2. ✅ Vérifier la configuration
3. ✅ Redémarrer le frontend sur le port 7001
4. ✅ Vérifier que le serveur est opérationnel

---

### Option 2 : Manuellement

```bash
# Étape 1: Tuer le processus actuel
kill $(lsof -ti :5173)

# Étape 2: Aller dans le dossier frontend
cd /home/franckylab/projets/eLISAschool/frontend

# Étape 3: Redémarrer avec le nouveau port
npm run dev -- --port 7001 --host
```

---

### Option 3 : Via Docker Compose

```bash
cd /home/franckylab/projets/eLISAschool/docker

# Démarrer le frontend dans Docker
docker compose up -d frontend

# Le frontend sera accessible sur http://localhost:7001
```

---

## 🔍 Vérification

### 1. Vérifier que le frontend écoute sur 7001

```bash
lsof -i :7001
```

**Résultat attendu :**
```
COMMAND   PID    USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    12345    user   xxu  IPv4  xxxx      0t0  TCP *:7001 (LISTEN)
```

### 2. Vérifier qu'aucun processus n'écoute sur 5173

```bash
lsof -i :5173
```

**Résultat attendu :** Aucun résultat (vide)

### 3. Tester la configuration CORS

```bash
curl -v -X OPTIONS http://localhost:7000/api/utilisateurs \
  -H "Origin: http://localhost:7001" \
  -H "Access-Control-Request-Method: GET"
```

**Résultat attendu dans les headers de réponse :**
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:7001  ✅
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

### 4. Tester dans le Navigateur

1. Ouvrir **http://localhost:7001**
2. Ouvrir les DevTools (F12) → Console
3. Naviguer vers la page des utilisateurs
4. **Aucune erreur CORS ne doit apparaître** ✅

---

## 📋 Checklist de Résolution

- [x] Identifier l'erreur CORS (mismatch de ports)
- [x] Corriger `backend/src/config/env.config.ts` (FRONTEND_URL → 7001)
- [x] Corriger `frontend/vite.config.ts` (port → 7001, proxy → 7000)
- [x] Vérifier `.env` (FRONTEND_URL=http://localhost:7001) ✅
- [x] Vérifier `frontend/.env` (VITE_API_URL=http://localhost:7000) ✅
- [x] Créer script de redémarrage `scripts/restart-frontend.sh`
- [ ] **Exécuter le redémarrage du frontend** (voir instructions ci-dessus)
- [ ] Vérifier que le frontend écoute sur le port 7001
- [ ] Tester l'accès à http://localhost:7001
- [ ] Vérifier que l'erreur CORS a disparu
- [ ] Tester la page des utilisateurs

---

## 🎯 Configuration Finale

| Service | URL | Port | Statut |
|---------|-----|------|--------|
| **Backend API** | http://localhost:7000 | 7000 | ✅ Configuré |
| **Frontend** | http://localhost:7001 | 7001 | ✅ Configuré |
| **CORS** | http://localhost:7001 | - | ✅ Autorisé |
| **PostgreSQL** | localhost:7002 | 7002 | ✅ Actif |
| **Redis** | localhost:7003 | 7003 | ✅ Actif |
| **pgAdmin** | http://localhost:7004 | 7004 | ✅ Actif |

---

## 📚 Architecture CORS eLISAschool

### Comment fonctionne le CORS ?

```
┌─────────────────────────────────────────────────────────┐
│  Navigateur (Frontend: http://localhost:7001)           │
│                                                         │
│  1. Requête OPTIONS (preflight) vers backend            │
│     Headers: Origin: http://localhost:7001              │
│                                                         │
│  2. Backend vérifie si l'origine est autorisée          │
│     Si FRONTEND_URL == Origin → ✅ Autorisé             │
│     Sinon → ❌ Bloqué                                   │
│                                                         │
│  3. Si autorisé, envoi de la requête réelle              │
│     GET /api/utilisateurs                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Backend Express (http://localhost:7000)                │
│                                                         │
│  app.use(cors({                                         │
│      origin: envConfig.app.frontendUrl, // ← 7001       │
│      credentials: true,                                 │
│      methods: ['GET', 'POST', 'PUT', ...],              │
│  }));                                                   │
│                                                         │
│  Réponse:                                               │
│  Access-Control-Allow-Origin: http://localhost:7001 ✅  │
└─────────────────────────────────────────────────────────┘
```

### Pourquoi une seule origine ?

La configuration CORS d'eLISAschool utilise une **origine unique** plutôt que `*` pour :

1. ✅ **Sécurité** : Empêche les domaines non autorisés d'accéder à l'API
2. ✅ **Credentials** : Permet l'envoi de cookies et headers d'authentification
3. ✅ **Conformité** : Respect des bonnes pratiques de sécurité web

---

## ⚠️ Points Importants

### Ne Pas Faire

```typescript
// ❌ JAMAIS faire ça en production
app.use(cors({ origin: '*' }));

// ❌ Ne pas autoriser plusieurs origines non vérifiées
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:7001'] }));
```

### Bonnes Pratiques

```typescript
// ✅ Utiliser une variable d'environnement
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

// ✅ En production, utiliser l'URL exacte du frontend
// FRONTEND_URL=https://app.elisaschool.cm
```

---

## 🔧 Dépannage

### Le frontend ne démarre pas sur 7001

```bash
# Vérifier si un autre processus utilise le port
lsof -i :7001

# Tuer le processus conflictuel
kill -9 <PID>

# Redémarrer
npm run dev -- --port 7001
```

### Erreur CORS persiste

```bash
# 1. Vérifier que le backend est démarré
curl http://localhost:7000/api/health

# 2. Vérifier la valeur de FRONTEND_URL dans le backend
# Dans backend/src/app.ts, ajouter un log temporaire:
console.log('CORS Origin:', envConfig.app.frontendUrl);

# 3. Redémarrer le backend
cd /home/franckylab/projets/eLISAschool/docker
docker compose restart backend

# 4. Vider le cache du navigateur (Ctrl+Shift+Delete)
# 5. Recharger la page (Ctrl+F5)
```

### Le proxy Vite ne fonctionne pas

```bash
# Vérifier la configuration du proxy dans vite.config.ts
# La ligne suivante doit pointer vers le backend:
target: process.env.VITE_API_URL || 'http://localhost:7000'

# Vérifier que VITE_API_URL est défini dans frontend/.env
cat frontend/.env | grep VITE_API_URL
# Doit afficher: VITE_API_URL=http://localhost:7000
```

---

## 📖 Documentation Associée

- **[CONFIGURATION-PORTS.md](./CONFIGURATION-PORTS.md)** - Guide complet des ports 70xx
- **[CORRECTION-CORS-PORTS.md](./CORRECTION-CORS-PORTS.md)** - Première correction CORS
- **[RAPPORT-MIGRATION-PORTS.md](./RAPPORT-MIGRATION-PORTS.md)** - Migration des ports
- **[scripts/restart-frontend.sh](./scripts/restart-frontend.sh)** - Script de redémarrage

---

**Date** : Juin 2025  
**Statut** : ✅ Configuration corrigée, redémarrage frontend requis  
**Impact** : Correction bloquante - Empêche toute communication API  
**Priorité** : 🔴 Haute
