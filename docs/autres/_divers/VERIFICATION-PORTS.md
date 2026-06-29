# ✅ Vérification de la Cohérence des Ports

## 📊 Résumé des Modifications

### Fichiers Modifiés

| Fichier | Statut | Ports Mis à Jour |
|---------|--------|------------------|
| `.env` | ✅ | 7000, 7001, 7002, 7003 |
| `docker/.env` | ✅ | 7000, 7001, 7002, 7003, 7004 |
| `frontend/.env` | ✅ | 7000 (API URL) |
| `docker/docker-compose.yml` | ✅ | 7000, 7001, 7002, 7003, 7004 |
| `backend/src/config/env.config.ts` | ✅ | 7000, 7002, 7003 |
| `backend/src/database/seeds/force-config-seed.ts` | ✅ | 7002 |
| `docker/README.md` | ✅ | Tous les ports |
| `docker/PGADMIN-GUIDE.md` | ✅ | 7004 |
| `QUICKSTART.md` | ✅ | 7000, 7001 |
| `CONFIGURATION-PORTS.md` | ✅ | Nouveau fichier |

---

## 🔍 Vérification de Cohérence

### Backend API (7000)

```bash
# Fichier: .env
APP_PORT=7000 ✅
APP_URL=http://localhost:7000 ✅

# Fichier: docker/.env
APP_PORT=7000 ✅

# Fichier: docker/docker-compose.yml
"${APP_PORT:-7000}:3000" ✅

# Fichier: backend/src/config/env.config.ts
APP_PORT: default('7000') ✅
APP_URL: default('http://localhost:7000') ✅

# Fichier: frontend/.env
VITE_API_URL=http://localhost:7000 ✅
```

### Frontend (7001)

```bash
# Fichier: .env
FRONTEND_URL=http://localhost:7001 ✅

# Fichier: docker/.env
FRONTEND_PORT=7001 ✅

# Fichier: docker/docker-compose.yml
"${FRONTEND_PORT:-7001}:5173" ✅
```

### PostgreSQL (7002)

```bash
# Fichier: .env
DB_PORT=7002 ✅

# Fichier: docker/.env
DB_PORT=7002 ✅

# Fichier: docker/docker-compose.yml
"${DB_PORT:-7002}:5432" ✅

# Fichier: backend/src/config/env.config.ts
DB_PORT: default('7002') ✅

# Fichier: backend/src/database/seeds/force-config-seed.ts
DB_PORT = '7002' ✅
```

### Redis (7003)

```bash
# Fichier: .env
REDIS_PORT=7003 ✅

# Fichier: docker/.env
REDIS_PORT=7003 ✅

# Fichier: docker/docker-compose.yml
"${REDIS_PORT:-7003}:6379" ✅

# Fichier: backend/src/config/env.config.ts
REDIS_PORT: default('7003') ✅
```

### pgAdmin (7004)

```bash
# Fichier: docker/.env
PGADMIN_PORT=7004 ✅

# Fichier: docker/docker-compose.yml
"${PGADMIN_PORT:-7004}:80" ✅
```

---

## 🧪 Tests de Validation

### 1. Démarrage Docker Compose

```bash
cd /home/franckylab/projets/eLISAschool/docker
docker compose down
docker compose up -d

# Vérifier que tous les services sont démarrés
docker compose ps
```

**Résultat attendu :**
```
NAME                    STATUS         PORTS
elisaschool_backend     Up             0.0.0.0:7000->3000/tcp
elisaschool_frontend    Up             0.0.0.0:7001->5173/tcp
elisaschool_db          Up (healthy)   0.0.0.0:7002->5432/tcp
elisaschool_redis       Up (healthy)   0.0.0.0:7003->6379/tcp
elisaschool_pgadmin     Up             0.0.0.0:7004->80/tcp
```

### 2. Tests de Connectivité

```bash
# Backend API
curl http://localhost:7000/api/health
# Réponse attendue: {"success": true, ...}

# Frontend
curl -I http://localhost:7001
# Réponse attendue: HTTP/1.1 200 OK

# PostgreSQL
psql -h localhost -p 7002 -U elisaschool_user -d elisaschool -c "SELECT 1;"
# Réponse attendue: ?column? = 1

# Redis
redis-cli -h localhost -p 7003 -a elisaschool_password ping
# Réponse attendue: PONG

# pgAdmin
curl -I http://localhost:7004
# Réponse attendue: HTTP/1.1 200 OK
```

### 3. Vérification des Logs

```bash
# Backend - vérifier qu'il écoute sur le bon port
docker logs elisaschool_backend | grep -i "listening\|port"
# Attendu: "Server listening on port 3000" (port interne Docker)

# Frontend - vérifier l'URL de l'API
docker logs elisaschool_frontend | grep -i "api\|vite"
# Attendu: VITE_API_URL=http://localhost:7000/api

# PostgreSQL - vérifier le port d'écoute
docker logs elisaschool_db | grep -i "listening\|port"
# Attendu: "listening on port 5432" (port interne)

# Redis - vérifier le port
docker logs elisaschool_redis | grep -i "port"
# Attendu: "Ready to accept connections on port 6379" (port interne)
```

---

## ⚠️ Points de Vigilance

### URLs Hardcodées

Les fichiers suivants peuvent contenir des URLs hardcodées à vérifier :

```bash
# Rechercher les anciennes URLs
grep -r "localhost:3000" backend/src/ frontend/src/ --include="*.ts" --include="*.tsx"
grep -r "localhost:3001" backend/src/ frontend/src/ --include="*.ts" --include="*.tsx"
grep -r "localhost:5173" backend/src/ frontend/src/ --include="*.ts" --include="*.tsx"
grep -r "localhost:5432" backend/src/ --include="*.ts"
grep -r "localhost:6379" backend/src/ --include="*.ts"
```

### Variables d'Environnement Frontend

Vérifier que le frontend utilise bien la variable d'environnement :

```typescript
// frontend/src/config/api.ts (ou similaire)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';
```

### Configuration CORS Backend

Vérifier que le backend accepte les requêtes du nouveau port frontend :

```typescript
// backend/src/config/cors.config.ts (ou similaire)
const allowedOrigins = [
  'http://localhost:7001',  // ✅ Nouveau port
  'http://localhost:7000',
  process.env.FRONTEND_URL,
];
```

---

## 📝 Checklist de Migration

- [x] Modifier `.env` (racine)
- [x] Modifier `docker/.env`
- [x] Modifier `frontend/.env`
- [x] Modifier `docker/docker-compose.yml`
- [x] Modifier `backend/src/config/env.config.ts`
- [x] Modifier `backend/src/database/seeds/force-config-seed.ts`
- [x] Mettre à jour `docker/README.md`
- [x] Mettre à jour `docker/PGADMIN-GUIDE.md`
- [x] Mettre à jour `QUICKSTART.md`
- [x] Créer `CONFIGURATION-PORTS.md`
- [ ] Tester le démarrage Docker Compose
- [ ] Vérifier la connectivité Backend
- [ ] Vérifier la connectivité Frontend
- [ ] Vérifier la connexion PostgreSQL
- [ ] Vérifier la connexion Redis
- [ ] Accéder à pgAdmin
- [ ] Tester une requête API complète (Frontend → Backend → DB)
- [ ] Vérifier les logs pour erreurs
- [ ] Mettre à jour bookmarks/favoris navigateur
- [ ] Informer l'équipe du changement

---

## 🔄 Rollback (si nécessaire)

En cas de problème, voici comment revenir aux anciens ports :

```bash
# Backend
APP_PORT=3001
APP_URL=http://localhost:3001

# Frontend
FRONTEND_PORT=5173
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001

# PostgreSQL
DB_PORT=5433

# Redis
REDIS_PORT=6379

# pgAdmin
PGADMIN_PORT=5050
```

---

## 📞 Support

En cas de problème :

1. Vérifier les logs Docker : `docker compose logs <service>`
2. Consulter `CONFIGURATION-PORTS.md` pour la documentation complète
3. Vérifier la section dépannage dans `docker/README.md`
4. Exécuter les tests de connectivité ci-dessus

---

**Date de vérification** : Juin 2025  
**Statut** : ✅ Configuration cohérente et validée  
**Prochaines étapes** : Tests de démarrage et validation fonctionnelle
