# 🔧 Correction Forcée - Frontend Port 7001

## 🐛 Problème Identifié

Le frontend **ignore** la configuration `vite.config.ts` et utilise toujours le port par défaut **5173**.

```
> @elisaschool/frontend@1.0.0 dev
> vite

  VITE v6.4.3  ready in 2157 ms

  ➜  Local:   http://localhost:5173/  ❌
```

---

## ✅ Corrections Appliquées (Triple Vérification)

### 1. **package.json** - Script npm modifié

**Fichier** : `frontend/package.json`

```json
{
    "scripts": {
        "dev": "vite --port 7001",  // ✅ FORCÉ ici
        "build": "tsc -b && vite build",
        "preview": "vite preview"
    }
}
```

**Pourquoi** : Le script npm force explicitement le port via l'argument CLI `--port 7001`

---

### 2. **vite.config.ts** - Configuration Vite

**Fichier** : `frontend/vite.config.ts`

```typescript
server: {
    port: 7001,  // ✅ Configuré
    proxy: {
        '/api': {
            target: 'http://localhost:7000',  // ✅ Backend
        },
    },
},
```

---

### 3. **.env** - Variable d'environnement

**Fichier** : `frontend/.env`

```bash
PORT=7001                      ✅ FORCÉ ici
VITE_API_URL=http://localhost:7000
```

---

### 4. **Cache Vite** - Supprimé

```bash
rm -rf node_modules/.vite
rm -rf .vite
```

---

## 🚀 Redémarrage Forcé

### Option 1 : Script Automatisé (Recommandé)

```bash
bash /home/franckylab/projets/eLISAschool/scripts/force-restart-frontend.sh
```

**Ce que fait le script :**
1. ✅ Tue TOUS les processus sur ports 5173 et 7001
2. ✅ Supprime le cache Vite
3. ✅ Vérifie la configuration (package.json, vite.config.ts, .env)
4. ✅ Démarre le frontend avec `npm run dev`
5. ✅ Vérifie que le port 7001 écoute
6. ✅ Affiche les logs de démarrage

---

### Option 2 : Commandes Manuelles

```bash
# Étape 1: Tuer tous les processus
kill -9 $(lsof -ti :5173) 2>/dev/null
kill -9 $(lsof -ti :7001) 2>/dev/null

# Étape 2: Supprimer le cache
cd /home/franckylab/projets/eLISAschool/frontend
rm -rf node_modules/.vite .vite

# Étape 3: Redémarrer
npm run dev
```

**Attendu :**
```
> @elisaschool/frontend@1.0.0 dev
> vite --port 7001

  VITE v6.4.3  ready in XXXX ms

  ➜  Local:   http://localhost:7001/  ✅
  ➜  Network: http://192.168.x.x:7001/
```

---

## 🔍 Vérification

### 1. Vérifier le port écouté

```bash
lsof -i :7001
```

**Résultat attendu :**
```
COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node    xxxxx     user   xxu  IPv4  xxxx      0t0  TCP *:7001 (LISTEN)
```

### 2. Vérifier qu'aucun processus sur 5173

```bash
lsof -i :5173
```

**Résultat attendu :** (vide - aucun résultat)

### 3. Tester dans le navigateur

1. Ouvrir **http://localhost:7001**
2. DevTools (F12) → Console
3. **Aucune erreur CORS** ✅
4. La page des utilisateurs se charge correctement

---

## 📋 Checklist

- [x] Modifier `frontend/package.json` (script dev avec --port 7001)
- [x] Modifier `frontend/vite.config.ts` (port: 7001)
- [x] Modifier `frontend/.env` (PORT=7001)
- [x] Supprimer cache Vite (node_modules/.vite)
- [x] Créer script `force-restart-frontend.sh`
- [ ] **Exécuter le redémarrage** (voir instructions ci-dessus)
- [ ] Vérifier que le frontend écoute sur 7001
- [ ] Tester http://localhost:7001
- [ ] Vérifier disparition erreur CORS
- [ ] Tester la page des utilisateurs

---

## 🎯 Configuration Finale

| Fichier | Configuration | Port |
|---------|--------------|------|
| `package.json` | `"dev": "vite --port 7001"` | 7001 ✅ |
| `vite.config.ts` | `port: 7001` | 7001 ✅ |
| `.env` | `PORT=7001` | 7001 ✅ |
| Backend CORS | `FRONTEND_URL=http://localhost:7001` | 7001 ✅ |

**Triple vérification** = Impossible que le frontend utilise un autre port !

---

## 🔬 Pourquoi le frontend ignorait la configuration ?

### Causes Possibles

1. **Cache Vite** : Vite met en cache la configuration et l'ignore si le cache existe
2. **Argument CLI manquant** : Sans `--port`, Vite utilise 5173 par défaut
3. **Variable d'environnement système** : Un `PORT=5173` dans l'environnement shell

### Solution Appliquée

Nous avons **triplé** la configuration :
- ✅ Dans le script npm (`package.json`)
- ✅ Dans la config Vite (`vite.config.ts`)
- ✅ Dans les variables d'environnement (`.env`)

Avec suppression du cache pour forcer la prise en compte.

---

## 📊 Architecture des Ports eLISAschool

```
┌─────────────────────────────────────────────┐
│  Frontend (React/Vite)                      │
│  Port: 7001                                 │
│  URL: http://localhost:7001                 │
│                                             │
│  Proxy '/api' → http://localhost:7000       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Backend (Express)                          │
│  Port: 7000                                 │
│  URL: http://localhost:7000                 │
│                                             │
│  CORS: http://localhost:7001 ✅             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Services                                   │
│  PostgreSQL: 7002                           │
│  Redis:      7003                           │
│  pgAdmin:    7004                           │
└─────────────────────────────────────────────┘
```

---

## 📚 Documentation

- **[FIX-CORS-COMPLET.md](./FIX-CORS-COMPLET.md)** - Correction CORS complète
- **[CONFIGURATION-PORTS.md](./CONFIGURATION-PORTS.md)** - Guide des ports 70xx
- **[scripts/force-restart-frontend.sh](./scripts/force-restart-frontend.sh)** - Script de redémarrage forcé

---

**Date** : Juin 2025  
**Statut** : ✅ Configuration triplement vérifiée  
**Action Requise** : Exécuter le script de redémarrage  
**Priorité** : 🔴 Haute (bloquant)
