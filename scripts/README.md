# 🛠️ Scripts eLISAschool

Ce dossier contient tous les scripts utilitaires pour le développement et la maintenance d'eLISAschool.

---

## 📁 Scripts Disponibles

### Scripts de Développement

| Script | Usage | Description |
|--------|-------|-------------|
| **`start-dev.sh`** | `./scripts/start-dev.sh` | Démarrer l'environnement de développement |
| **`stop-dev.sh`** | `./scripts/stop-dev.sh` | Arrêter l'environnement de développement |
| **`verify-setup.sh`** | `./scripts/verify-setup.sh` | Vérifier l'état de l'environnement |

### Scripts de Déploiement

| Script | Description |
|--------|-------------|
| `deploy-*.sh` | Scripts de déploiement par module |

### Scripts de Test

| Script | Description |
|--------|-------------|
| `test-*.sh` | Scripts de test par module |

---

## 🚀 Scripts de Développement

### start-dev.sh

Démarrer l'environnement de développement complet.

```bash
# Démarrer tout (frontend + backend + Docker)
./scripts/start-dev.sh

# Démarrer uniquement le backend
./scripts/start-dev.sh --backend

# Démarrer uniquement le frontend
./scripts/start-dev.sh --frontend
```

**Ce que fait le script :**
1. ✅ Vérifie que Docker est en cours d'exécution
2. ✅ Démarre PostgreSQL et Redis si nécessaire
3. ✅ Démarre le backend (port 3001)
4. ✅ Démarre le frontend (port 5173)
5. ✅ Attend que les services soient prêts
6. ✅ Affiche les URLs d'accès

**Sortie attendue :**
```
╔══════════════════════════════════════════════════════════╗
║   🎉 ENVIRONNEMENT DE DÉVELOPPEMENT PRÊT !             ║
╚══════════════════════════════════════════════════════════╝

🌐 Accès rapide :
   • Frontend:    http://localhost:5173
   • Backend API: http://localhost:3001
   • Docs API:    http://localhost:3001/api/docs
   • Health:      http://localhost:3001/api/health
```

---

### stop-dev.sh

Arrêter proprement l'environnement de développement.

```bash
# Arrêter tout
./scripts/stop-dev.sh

# Arrêter uniquement le backend
./scripts/stop-dev.sh --backend

# Arrêter uniquement le frontend
./scripts/stop-dev.sh --frontend
```

**Ce que fait le script :**
1. ✅ Trouve les processus en cours d'exécution
2. ✅ Arrêt gracieux (SIGTERM)
3. ✅ Forcement si nécessaire (SIGKILL)
4. ✅ Nettoie les fichiers PID

---

### verify-setup.sh

Vérifier que tout l'environnement est opérationnel.

```bash
./scripts/verify-setup.sh
```

**Vérifications effectuées (18) :**
- ✅ Frontend en cours d'exécution
- ✅ Backend API en cours d'exécution
- ✅ Backend API opérationnelle
- ✅ Documentation API accessible
- ✅ Fichiers critiques existants
- ✅ Imports corrects
- ✅ PostgreSQL accessible
- ✅ Redis accessible

**Sortie attendue :**
```
✅ Succès: 18
⚠️  Avertissements: 0
❌ Erreurs: 0

🎉 ENVIRONNEMENT OPÉRATIONNEL - PRÊT POUR LE DEV !
```

---

## 🔧 Commandes Manuelles

### Développement

```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run dev

# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build
```

### Base de Données

```bash
# Voir les containers
docker ps

# Démarrer Docker services
cd docker && docker-compose up -d postgres redis

# Arrêter Docker services
cd docker && docker-compose stop

# Redémarrer PostgreSQL
docker restart elisaschool-postgres

# Se connecter à PostgreSQL
docker exec -it elisaschool-postgres psql -U elisaschool -d elisaschool

# Voir les logs PostgreSQL
docker logs elisaschool-postgres -f
```

### Redis

```bash
# Vérifier Redis
docker ps | grep redis

# Redémarrer Redis
docker restart elisaschool-redis

# Voir les logs Redis
docker logs elisaschool-redis -f

# Tester la connexion Redis
docker exec -it elisaschool-redis redis-cli ping
```

### Logs

```bash
# Logs backend
tail -f backend/logs/app.log

# Logs frontend
# Console navigateur (F12)

# Logs Docker
docker logs elisaschool-postgres -f
docker logs elisaschool-redis -f
```

---

## 🎯 Workflow de Développement Typique

### 1. Démarrage Matin

```bash
# Démarrer tout l'environnement
./scripts/start-dev.sh

# Vérifier que tout est OK
./scripts/verify-setup.sh
```

### 2. Développement

```bash
# Terminal 1 - Frontend (si HMR ne fonctionne pas)
cd frontend && npm run dev

# Terminal 2 - Backend (si besoin de redémarrer)
cd backend && npm run dev

# Terminal 3 - Tests, migrations, etc.
cd backend && npm run migration:generate -- src/database/migrations/MaMigration
```

### 3. Fin de Journée

```bash
# Arrêter proprement
./scripts/stop-dev.sh

# Ou laisser tourner (reprise rapide le lendemain)
```

### 4. Dépannage

```bash
# Si quelque chose ne va pas
./scripts/verify-setup.sh

# Voir ce qui utilise les ports
lsof -i :5173  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # PostgreSQL

# Tuer un processus bloqué
kill -9 <PID>

# Redémarrage complet
./scripts/stop-dev.sh
./scripts/start-dev.sh
```

---

## 📊 Monitoring

### Vérification Rapide

```bash
# Tous les services
curl -s http://localhost:3001/api/health | jq

# Frontend
curl -s http://localhost:5173 > /dev/null && echo "Frontend OK"

# Backend
curl -s http://localhost:3001/api/health | jq -r '.message'

# PostgreSQL
docker exec elisaschool-postgres pg_isready -U elisaschool

# Redis
docker exec elisaschool-redis redis-cli ping
```

### Performance

```bash
# Temps de réponse API
curl -w "Temps: %{time_total}s\n" -o /dev/null -s http://localhost:3001/api/health

# Utilisation mémoire Docker
docker stats --no-stream

# Processus Node
ps aux | grep node
```

---

## 🐛 Dépannage Courant

### Le frontend ne compile pas

```bash
cd frontend
rm -rf node_modules/.vite .tanstack dist
npm run dev
```

### Le backend ne répond pas

```bash
cd backend
tail -f logs/app.log
npm run dev
```

### Port déjà utilisé

```bash
# Voir le processus
lsof -i :5173

# Tuer
kill -9 <PID>

# Ou utiliser un autre port
PORT=5174 npm run dev
```

### PostgreSQL inaccessible

```bash
# Vérifier Docker
docker ps | grep postgres

# Redémarrer
docker restart elisaschool-postgres

# Vérifier connexion
docker exec -it elisaschool-postgres psql -U elisaschool -d elisaschool -c "SELECT 1;"
```

### Redis inaccessible

```bash
# Vérifier Docker
docker ps | grep redis

# Redémarrer
docker restart elisaschool-redis

# Le backend fonctionne sans Redis (fallback in-memory)
```

---

## 📝 Notes

### Fichiers PID

Les scripts créent des fichiers PID dans `/tmp/` :
- `/tmp/elisaschool-backend.pid`
- `/tmp/elisaschool-frontend.pid`

Ces fichiers permettent d'arrêter proprement les processus.

### Variables d'Environnement

Les scripts utilisent les variables du fichier `.env` à la racine du projet.

### Logs

- **Backend** : `backend/logs/app.log`
- **Frontend** : Console navigateur (F12)
- **Docker** : `docker logs <container>`

---

## 🆘 Support

Si un script ne fonctionne pas :

1. Vérifier les permissions : `chmod +x scripts/*.sh`
2. Vérifier Bash : `bash --version` (>= 4.0)
3. Vérifier Docker : `docker --version`
4. Consulter les logs dans le terminal

---

*Dernière mise à jour : 11 juin 2026*  
*Version : 1.0.0*  
*eLISAschool - Système de Gestion Scolaire*
