# Configuration HMR Frontend - Meilleures Pratiques Docker + Vite

## ✅ Configuration Actuelle

### vite.config.ts - HMR Optimisé pour Docker

```typescript
server: {
    port: 7001,
    host: '0.0.0.0',
    // Configuration HMR pour Docker
    hmr: {
        protocol: 'ws',              // WebSocket pour temps réel
        host: 'localhost',           // Hôte pour le client navigateur
        port: 7001,                  // Port du WebSocket
        clientPort: 7001,            // Port visible par le client
    },
    watch: {
        usePolling: true,            // ✅ OBLIGATOIRE pour Docker
        interval: 100,               // Vérification toutes les 100ms
        ignored: ['**/node_modules/**', '**/.git/**'],
    },
    proxy: {
        '/api': {
            target: 'http://backend:7000',  // ✅ Nom du service Docker
            changeOrigin: true,
        },
    },
}
```

### docker-compose.yml - Build Optimisé

```yaml
frontend:
  image: node:20-alpine
  volumes:
    - ./frontend:/app              # Bind mount pour HMR
    - /app/node_modules            # Volume séparé pour node_modules
    - ./shared:/shared             # Package partagé
  command: >
    sh -c "
      cd /app &&
      # Vérification intelligente des dépendances
      if [ ! -d 'node_modules' ] || [ ! -f 'node_modules/.package-lock.json' ] || [ ! -x 'node_modules/.bin/vite' ]; then
        npm install --frozen-lockfile;
      fi &&
      npm run dev -- --host 0.0.0.0 --port 7001
    "
```

## 🎯 Pourquoi Cette Configuration ?

### 1. **usePolling: true** - OBLIGATOIRE pour Docker

**Problème :** Docker utilise des volumes bind mount qui ne supportent pas les événements filesystem natifs (inotify).

**Solution :** Le polling vérifie périodiquement les modifications de fichiers.

```typescript
// ❌ SANS polling (ne fonctionne PAS dans Docker)
watch: {
    usePolling: false  // HMR ne détecte pas les changements
}

// ✅ AVEC polling (fonctionne dans Docker)
watch: {
    usePolling: true,
    interval: 100  // 100ms = bon équilibre performance/réactivité
}
```

### 2. **HMR WebSocket Configuration**

**Problème :** Dans Docker, le WebSocket HMR peut ne pas trouver le bon chemin.

**Solution :** Configuration explicite du WebSocket :

```typescript
hmr: {
    protocol: 'ws',        // WebSocket standard
    host: 'localhost',     // Accessible depuis le navigateur
    port: 7001,            // Même port que le serveur
    clientPort: 7001,      // Port que le client utilise
}
```

### 3. **Nom du Service Docker pour le Proxy**

**Problème :** `localhost` dans un conteneur pointe vers le conteneur lui-même, pas vers l'hôte.

**Solution :** Utiliser le nom du service Docker :

```typescript
// ❌ NE FONCTIONNE PAS dans Docker
target: 'http://localhost:7000'

// ✅ FONCTIONNE dans Docker (nom du service)
target: 'http://backend:7000'
```

### 4. **Installation Intelligente des Dépendances**

**Problème :** `npm install` à chaque redémarrage = lent.

**Solution :** Vérifier si les dépendances sont déjà installées :

```bash
# Vérifie 3 conditions :
# 1. node_modules existe
# 2. .package-lock.json existe (lock file)
# 3. vite est exécutable (binaire présent)
if [ ! -d 'node_modules' ] || \
   [ ! -f 'node_modules/.package-lock.json' ] || \
   [ ! -x 'node_modules/.bin/vite' ]; then
  npm install --frozen-lockfile
fi
```

## 🚀 Performance

### Temps de Démarrage

| Étape | Première Fois | Redémarrage |
|-------|---------------|-------------|
| npm install | ~30-60s | 0s (skip) |
| Vite startup | ~3s | ~3s |
| **Total** | **~33-63s** | **~3s** |

### Détection HMR

| Type de Modification | Temps de Rechargement |
|---------------------|----------------------|
| CSS | < 100ms (instant) |
| Composant React | ~200-500ms |
| Import/Export | ~500ms-1s (full reload) |
| vite.config.ts | ~2s (restart serveur) |

## 🔧 Troubleshooting

### HMR ne fonctionne pas

**Symptôme :** Modifications non détectées, besoin de refresh manuel.

**Vérifications :**

```bash
# 1. Vérifier que usePolling est activé
grep -A 5 "watch:" frontend/vite.config.ts

# 2. Vérifier les logs Vite
docker logs elisaschool_frontend | grep -E "watch|HMR|change"

# 3. Tester la détection
touch frontend/src/test-hmr.tsx
docker logs elisaschool_frontend | grep "test-hmr"
```

**Solution :**

```typescript
// Dans vite.config.ts
watch: {
    usePolling: true,        // ✅ Obligatoire
    interval: 100,           // ✅ Assez rapide
}
```

### Erreur "vite: not found"

**Cause :** `node_modules` manquant ou corrompu.

**Solution :**

```bash
# Supprimer et réinstaller
docker compose down frontend
docker compose rm -f frontend
docker compose up -d frontend
```

### Proxy ne fonctionne pas

**Symptôme :** Erreurs CORS ou "Connection refused".

**Vérification :**

```bash
# Tester la connectivité backend
docker exec elisaschool_frontend wget -qO- http://backend:7000/api/health
```

**Solution :**

```typescript
// Dans vite.config.ts
proxy: {
    '/api': {
        target: 'http://backend:7000',  // ✅ Nom du service
        changeOrigin: true,
    },
}
```

## 📋 Checklist de Configuration

- [ ] `usePolling: true` dans `vite.config.ts`
- [ ] `hmr.clientPort` configuré
- [ ] Proxy utilise `http://backend:7000` (pas localhost)
- [ ] Volume `/app/node_modules` séparé
- [ ] `npm install --frozen-lockfile` pour reproductibilité
- [ ] `.dockerignore` exclude `node_modules`
- [ ] `host: '0.0.0.0'` pour accès externe

## 🎓 Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours utiliser `usePolling: true` dans Docker**
2. **Séparer le volume `node_modules`** pour éviter les conflits
3. **Utiliser `--frozen-lockfile`** pour des builds reproductibles
4. **Configurer HMR explicitement** pour éviter les problèmes de WebSocket
5. **Utiliser les noms de services Docker** (pas localhost)

### ❌ À ÉVITER

1. **Ne pas utiliser `usePolling: false`** dans Docker
2. **Ne pas binder node_modules depuis l'hôte**
3. **Ne pas utiliser `localhost`** dans les URLs internes Docker
4. **Ne pas skipper `npm install`** sans vérification
5. **Ne pas oublier `.dockerignore`** pour node_modules

## 📊 Monitoring HMR

### Vérifier que HMR fonctionne

```bash
# Watch logs en temps réel
docker logs -f elisaschool_frontend

# Modifier un fichier
echo "// test" >> frontend/src/App.tsx

# Devrait voir :
# 11:50:30 AM [vite] hmr update /src/App.tsx
```

### Performance du HMR

```bash
# Vérifier l'intervalle de polling
docker exec elisaschool_frontend cat /proc/$(pgrep node)/fd | wc -l
# Beaucoup de fichiers ouverts = polling actif
```

---

**Dernière mise à jour :** 28 juin 2026  
**Version Vite :** 6.4.3  
**Node.js :** 20 Alpine
