# ⚡ Aide-Mémoire - Commandes eLISAschool

## 🚀 Démarrage Rapide

```bash
# 1. Démarrer tout
./scripts/start-dev.sh

# 2. Vérifier
./scripts/verify-setup.sh

# 3. Accéder
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

---

## 📋 Commandes Essentielles

### Développement Quotidien

```bash
# Démarrer l'environnement
./scripts/start-dev.sh

# Arrêter l'environnement
./scripts/stop-dev.sh

# Vérifier l'état
./scripts/verify-setup.sh

# Redémarrer frontend uniquement
cd frontend && npm run dev

# Redémarrer backend uniquement
cd backend && npm run dev
```

### Base de Données

```bash
# Se connecter à PostgreSQL
docker exec -it elisaschool-postgres psql -U elisaschool -d elisaschool

# Voir les tables
\dt

# Voir la structure d'une table
\d eleves

# Quitter psql
\q

# Redémarrer PostgreSQL
docker restart elisaschool-postgres

# Voir les logs
docker logs elisaschool-postgres -f
```

### Docker

```bash
# Voir les containers actifs
docker ps

# Voir tous les containers
docker ps -a

# Démarrer les services
cd docker && docker-compose up -d

# Arrêter les services
cd docker && docker-compose down

# Voir les logs
docker logs -f <container_name>

# Redémarrer un container
docker restart <container_name>

# Nettoyer (⚠️ supprime les données)
docker system prune -a
```

### Git

```bash
# Voir le statut
git status

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "feat: description en français"

# Push
git push origin main

# Voir l'historique
git log --oneline -20

# Annuler dernier commit (garde les changements)
git reset --soft HEAD~1
```

---

## 🔧 Dépannage

### Frontend ne compile pas

```bash
cd frontend
rm -rf node_modules/.vite .tanstack dist
npm install
npm run dev
```

### Backend ne répond pas

```bash
cd backend
tail -f logs/app.log
npm run dev
```

### Ports occupés

```bash
# Voir les processus
lsof -i :5173  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # PostgreSQL

# Tuer un processus
kill -9 <PID>
```

### Cache corrompu

```bash
# Frontend
cd frontend && rm -rf node_modules/.vite .tanstack dist

# Backend
cd backend && rm -rf dist node_modules/.cache

# Rebuild
npm install
npm run dev
```

---

## 📦 Installation

### Nouveau poste de travail

```bash
# 1. Cloner le projet
git clone <repo_url>
cd eLISAschool

# 2. Installer les dépendances
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec les bonnes valeurs

# 4. Démarrer Docker
cd docker && docker-compose up -d

# 5. Démarrer l'application
./scripts/start-dev.sh
```

### Migrations Base de Données

```bash
# Exécuter les migrations
cd backend
npm run migration:run

# Générer une migration
npm run migration:generate -- src/database/migrations/NomMigration

# Revenir en arrière
npm run migration:revert
```

### Seeds (Données de test)

```bash
# Charger les seeds
cd backend
npm run seed:run

# Seeds spécifiques
npm run seed:run -- --config=nom-du-seed
```

---

## 🧪 Tests

### Frontend

```bash
cd frontend

# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Linter
npm run lint

# Type checking
npm run type-check
```

### Backend

```bash
cd backend

# Build
npm run build

# Linter
npm run lint

# Type checking
npm run type-check

# Tests unitaires
npm test

# Tests avec couverture
npm run test:cov
```

---

## 📊 Monitoring

### Vérification Rapide

```bash
# API Health
curl http://localhost:3001/api/health

# Frontend
curl -I http://localhost:5173

# PostgreSQL
docker exec elisaschool-postgres pg_isready -U elisaschool

# Redis
docker exec elisaschool-redis redis-cli ping
```

### Logs

```bash
# Backend en temps réel
tail -f backend/logs/app.log

# Frontend
# Console navigateur (F12)

# Docker
docker logs -f elisaschool-postgres
docker logs -f elisaschool-redis
```

### Performance

```bash
# Temps de réponse API
curl -w "\nTemps: %{time_total}s\n" -o /dev/null -s http://localhost:3001/api/health

# Stats Docker
docker stats --no-stream

# Processus Node
ps aux | grep node | grep -v grep
```

---

## 🎯 Workflows Courants

### Ajouter un Nouveau Module

```bash
# 1. Créer la structure
mkdir -p backend/src/modules/mon-module/{controllers,services,entities,dto}

# 2. Créer les fichiers
touch backend/src/modules/mon-module/{index,controllers/index,services/index,entities/index,dto/index}.ts

# 3. Déclarer dans app.ts
# Importer le controller et ajouter la route

# 4. Frontend
mkdir -p frontend/src/features/mon-module/{components,hooks,types}
```

### Corriger une Erreur Frontend

```bash
# 1. Voir l'erreur
# Console navigateur (F12)

# 2. Vérifier les imports
grep -r "import.*problem" frontend/src

# 3. Nettoyer le cache
cd frontend && rm -rf node_modules/.vite .tanstack

# 4. Redémarrer
npm run dev
```

### Déployer une Mise à Jour

```bash
# 1. Pull les changements
git pull origin main

# 2. Installer les dépendances
npm install

# 3. Migrations
cd backend && npm run migration:run

# 4. Build
cd frontend && npm run build
cd backend && npm run build

# 5. Redémarrer
./scripts/stop-dev.sh
./scripts/start-dev.sh
```

---

## 📁 Structure Rapide

```
eLISAschool/
├── frontend/              # Application React
│   ├── src/
│   │   ├── app/          # Routes
│   │   ├── components/   # Composants UI
│   │   └── features/     # Modules
│   └── package.json
├── backend/               # API Express
│   ├── src/
│   │   └── modules/      # Modules backend
│   └── package.json
├── docker/               # Configuration Docker
├── scripts/              # Scripts utilitaires
└── docs/                 # Documentation
```

---

## 🔐 Connexions

### PostgreSQL (Docker)

```
Host: localhost
Port: 5432
Database: elisaschool
User: elisaschool_user
Password: (voir .env)
```

### pgAdmin

```
URL: http://localhost:5050
Email: (voir .env)
Password: (voir .env)
```

### Application

```
URL: http://localhost:5173
Email: admin@elisaschool.com
Password: admin123
```

---

## 💡 Astuces

### Productivité

```bash
# Alias utiles (ajouter à ~/.bashrc)
alias elisa-start='./scripts/start-dev.sh'
alias elisa-stop='./scripts/stop-dev.sh'
alias elisa-check='./scripts/verify-setup.sh'
alias elisa-logs='tail -f backend/logs/app.log'

# Raccourcis clavier
# Ctrl+C - Arrêter un processus
# Ctrl+R - Recherche dans l'historique
# Tab - Autocomplétion
```

### Debugging

```bash
# Voir les variables d'environnement
env | grep ELISA

# Mode verbeux
DEBUG=* npm run dev

# profiler les requêtes
# Ajouter ?_debug=true aux URLs API
```

### Nettoyage

```bash
# Nettoyage léger
rm -rf frontend/.tanstack frontend/node_modules/.vite backend/dist

# Nettoyage complet
rm -rf node_modules frontend/node_modules backend/node_modules
npm install

# Nettoyage Docker
docker system prune -a --volumes
```

---

## 📞 Ressources

### Documentation

- [`INDEX.md`](../INDEX.md) - Index de toute la documentation
- [`QUICKSTART.md`](../QUICKSTART.md) - Guide de démarrage
- [`README.md`](../README.md) - Documentation principale

### Scripts

- [`scripts/README.md`](README.md) - Documentation des scripts
- [`start-dev.sh`](start-dev.sh) - Démarrage
- [`stop-dev.sh`](stop-dev.sh) - Arrêt
- [`verify-setup.sh`](verify-setup.sh) - Vérification

### Skills Qoder

- `elisaschool-dev` - Backend
- `elisaschool-frontend-dev` - Frontend
- `elisaschool-business-logic` - Logique métier

---

**📌 Gardez ce fichier à portée de main pour le développement quotidien !**

---

*Dernière mise à jour : 11 juin 2026*  
*Version : 1.0.0*  
*eLISAschool - Système de Gestion Scolaire*
