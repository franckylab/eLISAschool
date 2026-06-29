# ✅ Correction de l'Erreur CORS - Ports 70xx

## 🐛 Problème Identifié

**Erreur CORS** : Le frontend tourne sur `http://localhost:5173` mais le backend n'autorise que `http://localhost:7001`.

**Cause** : Après la migration des ports vers la racine 70, le frontend n'a pas été redémarré sur le nouveau port.

---

## ✅ Solution Appliquée

### 1. Configuration Backend Mise à Jour

Fichier : `backend/src/config/env.config.ts`

```typescript
// AVANT (ancien port)
FRONTEND_URL: z.string().url().default('http://localhost:5173'),

// APRÈS (nouveau port)
FRONTEND_URL: z.string().url().default('http://localhost:7001'),
```

**Modifications effectuées :**
- ✅ Ligne 58 : Valeur par défaut Zod → `http://localhost:7001`
- ✅ Ligne 109 : Valeur fallback dev → `http://localhost:7001`

---

## 🚀 Instructions pour Corriger

### Option 1 : Redémarrer le Frontend Local (Recommandé)

```bash
# 1. Tuer le processus frontend actuel (port 5173)
kill 536499 536500

# 2. Aller dans le dossier frontend
cd /home/franckylab/projets/eLISAschool/frontend

# 3. Redémarrer avec le nouveau port
npm run dev -- --port 7001
```

### Option 2 : Utiliser Docker Compose

```bash
cd /home/franckylab/projets/eLISAschool/docker

# Démarrer le frontend dans Docker
docker compose up -d frontend

# Le frontend sera accessible sur http://localhost:7001
```

### Option 3 : Temporary Fix (Développement uniquement)

Si vous devez absolument garder le frontend sur le port 5173 temporairement :

```bash
# Modifier .env à la racine
FRONTEND_URL=http://localhost:5173

# Redémarrer le backend
cd /home/franckylab/projets/eLISAschool/docker
docker compose restart backend
```

⚠️ **Note** : Cette option n'est pas recommandée car elle casse la cohérence de la numérotation 70xx.

---

## 🔍 Vérification

### 1. Vérifier que le frontend écoute sur le bon port

```bash
lsof -i :7001
```

**Résultat attendu :**
```
COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    xxxxx user   xxu  IPv4  xxxx      0t0  TCP localhost:7001 (LISTEN)
```

### 2. Tester la requête API

```bash
curl -X GET http://localhost:7000/api/utilisateurs?page=1&limit=20 \
  -H "Origin: http://localhost:7001" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -v
```

**Résultat attendu dans les headers de réponse :**
```
Access-Control-Allow-Origin: http://localhost:7001
```

### 3. Vérifier dans le navigateur

1. Ouvrir http://localhost:7001
2. Ouvrir les DevTools (F12) → Console
3. L'erreur CORS ne doit plus apparaître

---

## 📋 Checklist de Correction

- [x] Mettre à jour `backend/src/config/env.config.ts` (FRONTEND_URL default)
- [x] Vérifier `.env` (FRONTEND_URL=http://localhost:7001)
- [ ] Tuer le processus frontend sur le port 5173
- [ ] Redémarrer le frontend sur le port 7001
- [ ] Tester l'accès à http://localhost:7001
- [ ] Vérifier que l'erreur CORS a disparu
- [ ] Tester la page des utilisateurs

---

## 🎯 Configuration Finale Attendue

| Service | URL | Port |
|---------|-----|------|
| **Backend API** | http://localhost:7000 | 7000 |
| **Frontend** | http://localhost:7001 | 7001 |
| **CORS Autorisé** | http://localhost:7001 | ✅ |

---

## ⚠️ Points Importants

### Pourquoi cette erreur ?

Le navigateur envoie une requête **preflight OPTIONS** avant la requête réelle pour vérifier les permissions CORS. Le backend répond avec :

```
Access-Control-Allow-Origin: http://localhost:7001
```

Mais le navigateur voit que la page vient de `http://localhost:5173`, donc il bloque la requête car **5173 ≠ 7001**.

### Architecture CORS eLISAschool

```typescript
// backend/src/app.ts
app.use(cors({
    origin: envConfig.app.frontendUrl,  // ← Lit FRONTEND_URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
```

Le CORS est configuré pour n'autoriser **qu'une seule origine** (mon-origine), ce qui est plus sécurisé que `*`.

---

## 📚 Références

- [CONFIGURATION-PORTS.md](./CONFIGURATION-PORTS.md) - Configuration des ports
- [RAPPORT-MIGRATION-PORTS.md](./RAPPORT-MIGRATION-PORTS.md) - Migration des ports
- [backend/src/config/env.config.ts](./backend/src/config/env.config.ts) - Configuration environnementale

---

**Date** : Juin 2025  
**Statut** : ✅ Configuration corrigée, redémarrage frontend requis  
**Impact** : CORS bloquant les requêtes API
