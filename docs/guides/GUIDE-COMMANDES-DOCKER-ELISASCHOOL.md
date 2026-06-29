# 🐳 Guide Complet des Commandes Docker - eLISAschool

> **Version:** 1.0.0  
> **Date:** 28 juin 2026  
> **Auteur:** franck arlos chendjou  
> **Projet:** eLISAschool - Plateforme de Gestion Scolaire

---

## 📋 Table des Matières

1. [Architecture Docker eLISAschool](#architecture-docker-elisaschool)
2. [Commandes de Base](#commandes-de-base)
3. [Gestion des Conteneurs](#gestion-des-conteneurs)
4. [Monitoring et Diagnostic](#monitoring-et-diagnostic)
5. [Logs et Débogage](#logs-et-débogage)
6. [Nettoyage et Maintenance](#nettoyage-et-maintenance)
7. [Configuration et Variables d'Environnement](#configuration-et-variables-denvironnement)
8. [Base de Données PostgreSQL](#base-de-données-postgresql)
9. [Sauvegarde et Restauration](#sauvegarde-et-restauration)
10. [Réseau et Ports](#réseau-et-ports)
11. [Dépannage Rapide](#dépannage-rapide)
12. [Scripts Automatisés](#scripts-automatisés)

---

## 🏗️ Architecture Docker eLISAschool

### Conteneurs eLISAschool

| Conteneur | Service | Port | Description |
|-----------|---------|------|-------------|
| `elisaschool_backend` | API Express | 7000 | Backend Node.js/TypeScript |
| `elisaschool_frontend` | React/Vite | 7001 | Frontend React/TypeScript |
| `elisaschool_db` | PostgreSQL | 7002 | Base de données principale |
| `elisaschool_redis` | Redis | 7003 | Cache et sessions |
| `elisaschool_pgadmin` | pgAdmin 4 | 7004 | Interface web PostgreSQL |

### Network et Volumes

```yaml
Network: elisaschool_network (bridge)
Volumes:
  - postgres_data: Données PostgreSQL
  - redis_data: Données Redis
```

---

## 🚀 Commandes de Base

### Démarrage de l'Application

```bash
# Démarrer tous les conteneurs en arrière-plan
docker compose up -d

# Démarrer et voir les logs (premier démarrage)
docker compose up

# Démarrer un conteneur spécifique
docker compose up -d backend
docker compose up -d frontend
docker compose up -d db
docker compose up -d redis
docker compose up -d pgadmin
```

### Arrêt de l'Application

```bash
# Arrêter tous les conteneurs (garde les volumes)
docker compose down

# Arrêter et supprimer les volumes ⚠️ (perd les données)
docker compose down -v

# Arrêter un conteneur spécifique
docker compose stop backend
docker compose stop frontend
```

### Redémarrage

```bash
# Redémarrage rapide (NE recharge PAS les variables d'environnement)
docker compose restart backend
docker compose restart frontend

# Recréation complète (recharge la configuration) ✅
docker compose down backend
docker compose up -d backend
```

### Vérification de l'État

```bash
# Voir tous les conteneurs en cours d'exécution
docker ps

# Voir TOUS les conteneurs (y compris arrêtés)
docker ps -a

# Voir uniquement les conteneurs eLISAschool
docker ps --filter "name=elisaschool"

# Format personnalisé avec noms et statuts
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## 📦 Gestion des Conteneurs

### Informations sur un Conteneur

```bash
# Détails complets d'un conteneur
docker inspect elisaschool_backend

# Voir la configuration réseau
docker inspect elisaschool_backend | grep -A 20 "NetworkSettings"

# Voir les variables d'environnement
docker exec elisaschool_backend printenv
docker exec elisaschool_backend printenv | grep NODE_ENV
docker exec elisaschool_backend printenv | grep ALLOWED_ORIGINS

# Voir les montages de volumes
docker inspect elisaschool_db | grep -A 10 "Mounts"
```

### Exécution de Commandes dans les Conteneurs

```bash
# Backend - Shell interactif
docker exec -it elisaschool_backend sh

# Backend - Vérifier Node.js
docker exec elisaschool_backend node --version

# Backend - Vérifier npm
docker exec elisaschool_backend npm --version

# Frontend - Shell interactif
docker exec -it elisaschool_frontend sh

# Frontend - Vérifier les fichiers
docker exec elisaschool_frontend ls -la /app
docker exec elisaschool_frontend cat /app/.env.local

# PostgreSQL - Shell psql
docker exec -it elisaschool_db psql -U elisaschool_user -d elisaschool

# Redis - Shell CLI
docker exec -it elisaschool_redis redis-cli
```

### Copie de Fichiers

```bash
# De l'hôte vers le conteneur
docker cp fichier.txt elisaschool_backend:/app/

# Du conteneur vers l'hôte
docker cp elisaschool_backend:/app/package.json ./

# Copier un dossier entier
docker cp ./scripts elisaschool_backend:/app/scripts
```

### Suppression et Recréation

```bash
# Supprimer un conteneur spécifique
docker rm -f elisaschool_backend

# Supprimer TOUS les conteneurs arrêtés
docker container prune

# Supprimer un conteneur et recréer
docker compose down backend
docker compose up -d backend

# Reconstruire l'image (après modification Dockerfile)
docker compose build backend
docker compose up -d backend
```

---

## 📊 Monitoring et Diagnostic

### Statuts et Santé

```bash
# Voir l'état de santé des conteneurs
docker ps --format "table {{.Names}}\t{{.Status}}"

# Vérifier si un conteneur est healthy
docker inspect --format='{{.State.Health.Status}}' elisaschool_db

# Voir les détails de healthcheck
docker inspect elisaschool_db | grep -A 10 "Health"
```

### Ressources Utilisées

```bash
# Statistiques en temps réel (CPU, RAM, Network)
docker stats

# Statistiques pour eLISAschool uniquement
docker stats elisaschool_backend elisaschool_frontend elisaschool_db

# Voir l'utilisation disque des volumes
docker system df -v

# Voir les volumes
docker volume ls
docker volume inspect postgres_data
```

### Inspection Réseau

```bash
# Voir le réseau eLISAschool
docker network ls
docker network inspect elisaschool_network

# Tester la connectivité entre conteneurs
docker exec elisaschool_frontend ping -c 3 elisaschool_backend
docker exec elisaschool_backend ping -c 3 elisaschool_db

# Tester les ports
docker exec elisaschool_frontend wget -qO- http://elisaschool_backend:7000/api/health
```

### Tests de Connectivité API

```bash
# Health check backend
curl http://localhost:7000/api/health

# Health check frontend
curl http://localhost:7001/api/health

# Test CORS complet
curl -v http://localhost:7000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:7001" \
  -d '{"identifiant":"test","motDePasse":"test"}'

# Test avec IP réseau
curl http://10.0.0.1:7000/api/health
curl http://10.0.0.1:7001/api/health
```

---

## 📜 Logs et Débogage

### Logs des Conteneurs

```bash
# Logs d'un conteneur (100 dernières lignes)
docker logs elisaschool_backend --tail 100

# Logs en temps réel (suivi continu)
docker logs -f elisaschool_backend

# Logs avec timestamps
docker logs --timestamps elisaschool_backend

# Logs des 30 dernières minutes
docker logs --since 30m elisaschool_backend

# Logs après une date précise
docker logs --since "2026-06-28T10:00:00" elisaschool_backend

# Logs avant une date
docker logs --until "2026-06-28T12:00:00" elisaschool_backend
```

### Recherche dans les Logs

```bash
# Chercher une erreur spécifique
docker logs elisaschool_backend 2>&1 | grep "ERROR"

# Chercher un mot-clé
docker logs elisaschool_backend 2>&1 | grep "migration"
docker logs elisaschool_backend 2>&1 | grep "seed"
docker logs elisaschool_backend 2>&1 | grep "CORS"

# Chercher avec contexte (5 lignes avant/après)
docker logs elisaschool_backend 2>&1 | grep -C 5 "error"

# Compter les occurrences
docker logs elisaschool_backend 2>&1 | grep -c "ERROR"
```

### Logs Multi-Conteneurs

```bash
# Logs de tous les conteneurs eLISAschool
docker compose logs

# Logs avec noms de conteneurs
docker compose logs --tail 50

# Logs d'un service spécifique
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Logs en temps réel (tous services)
docker compose logs -f
```

### Export des Logs

```bash
# Sauvegarder les logs dans un fichier
docker logs elisaschool_backend > backend-logs-$(date +%Y%m%d_%H%M%S).txt 2>&1

# Logs avec filtres
docker logs elisaschool_backend 2>&1 | grep "ERROR" > errors-$(date +%Y%m%d).txt
```

---

## 🧹 Nettoyage et Maintenance

### Nettoyage des Conteneurs

```bash
# Supprimer tous les conteneurs arrêtés
docker container prune -f

# Supprimer un conteneur spécifique
docker rm -f elisaschool_backend

# Supprimer TOUS les conteneurs (⚠️ DANGER)
docker rm -f $(docker ps -aq)
```

### Nettoyage des Images

```bash
# Voir les images
docker images

# Supprimer les images non utilisées
docker image prune -f

# Supprimer TOUTES les images non utilisées (y compris dangling)
docker image prune -a -f

# Supprimer une image spécifique
docker rmi node:20-alpine
```

### Nettoyage des Volumes

```bash
# Voir les volumes
docker volume ls

# Supprimer les volumes non utilisés
docker volume prune -f

# ⚠️ SUPPRIMER les volumes eLISAschool (perd les données)
docker volume rm postgres_data
docker volume rm redis_data
```

### Nettoyage du Réseau

```bash
# Voir les réseaux
docker network ls

# Supprimer les réseaux non utilisés
docker network prune -f

# Supprimer un réseau spécifique
docker network rm elisaschool_network
```

### Nettoyage Complet (⚠️ DANGER)

```bash
# SUPPRIME TOUT: conteneurs, images, volumes, réseaux
docker system prune -a --volumes -f

# Version plus sûre (garde les images)
docker system prune --volumes -f
```

### Nettoyage Spécifique eLISAschool

```bash
# Arrêter et tout supprimer (garde les variables .env)
docker compose down -v

# Nettoyage sélectif
docker compose down
docker container prune -f
docker image prune -f
docker volume prune -f
docker network prune -f
```

---

## ⚙️ Configuration et Variables d'Environnement

### Fichiers de Configuration

```bash
# Emplacement des fichiers
ls -la /mnt/DONNEES/projets/eLISAschool/.env
ls -la /mnt/DONNEES/projets/eLISAschool/docker-compose.yml
ls -la /mnt/DONNEES/projets/eLISAschool/frontend/.env.local
```

### Vérification des Variables

```bash
# Backend - Vérifier ALLOWED_ORIGINS (CORS)
docker exec elisaschool_backend printenv | grep ALLOWED_ORIGINS

# Backend - Vérifier NODE_ENV
docker exec elisaschool_backend printenv | grep NODE_ENV

# Backend - Vérifier DB connection
docker exec elisaschool_backend printenv | grep DB_

# Frontend - Vérifier VITE_API_URL
docker exec elisaschool_frontend cat /app/.env.local

# Frontend - Vérifier le cache Vite
docker exec elisaschool_frontend ls -la /app/node_modules/.vite
```

### Modification de la Configuration

```bash
# 1. Modifier .env sur l'hôte
nano /mnt/DONNEES/projets/eLISAschool/.env

# 2. Modifier frontend/.env.local
nano /mnt/DONNEES/projets/eLISAschool/frontend/.env.local

# 3. Recréer le conteneur (PAS restart !)
docker compose down backend
docker compose up -d backend

# 4. Vérifier
docker exec elisaschool_backend printenv | grep ALLOWED_ORIGINS
```

### Variables Critiques

```bash
# Backend
ALLOWED_ORIGINS=http://localhost:7001,http://10.0.0.1:7001
NODE_ENV=development
DB_HOST=postgres
DB_PORT=7002
APP_PORT=7000

# Frontend
VITE_API_URL=http://10.0.0.1:7000

# Database
POSTGRES_DB=elisaschool
POSTGRES_USER=elisaschool_user
POSTGRES_PASSWORD=<mot_de_passe>
```

---

## 🗄️ Base de Données PostgreSQL

### Connexion à la Base

```bash
# Via psql dans le conteneur
docker exec -it elisaschool_db psql -U elisaschool_user -d elisaschool

# Via psql depuis l'hôte
psql -h localhost -p 7002 -U elisaschool_user -d elisaschool

# Via pgAdmin (interface web)
# URL: http://localhost:7004
# Email: admin@elisaschool.com
# Mot de passe: Admin123!
```

### Commandes SQL Utiles

```bash
# Voir toutes les tables
\dt

# Voir la structure d'une table
\d utilisateurs

# Voir les 10 premiers utilisateurs
SELECT id, email, role FROM utilisateurs LIMIT 10;

# Voir les établissements
SELECT id, nom FROM etablissements;

# Voir les migrations exécutées
SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 10;

# Quitter psql
\q
```

### Migrations et Seeds

```bash
# Exécuter les migrations
docker exec elisaschool_backend npx typeorm migration:run -d dist/database/data-source.js

# Voir les migrations disponibles
docker exec elisaschool_backend ls -la dist/database/migrations/

# Exécuter les seeds
docker exec elisaschool_backend npx ts-node -r tsconfig-paths/register src/database/seeds/run-seeds.ts

# Rollback dernière migration
docker exec elisaschool_backend npx typeorm migration:revert -d dist/database/data-source.js
```

### Sauvegarde PostgreSQL

```bash
# Backup complet (SQL)
docker exec elisaschool_db pg_dump -U elisaschool_user elisaschool > backup-$(date +%Y%m%d_%H%M%S).sql

# Backup compressé
docker exec elisaschool_db pg_dump -U elisaschool_user elisaschool | gzip > backup-$(date +%Y%m%d_%H%M%S).sql.gz

# Backup d'une table spécifique
docker exec elisaschool_db pg_dump -U elisaschool_user -t utilisateurs elisaschool > backup-utilisateurs.sql

# Restaurer un backup
cat backup.sql | docker exec -i elisaschool_db psql -U elisaschool_user -d elisaschool

# Restaurer un backup compressé
gunzip < backup.sql.gz | docker exec -i elisaschool_db psql -U elisaschool_user -d elisaschool
```

### Maintenance PostgreSQL

```bash
# Analyser la base (optimisation)
docker exec elisaschool_db psql -U elisaschool_user -d elisaschool -c "ANALYZE;"

# Voir la taille de la base
docker exec elisaschool_db psql -U elisaschool_user -d elisaschool -c "SELECT pg_size_pretty(pg_database_size('elisaschool'));"

# Voir la taille des tables
docker exec elisaschool_db psql -U elisaschool_user -d elisaschool -c "
SELECT table_name, 
       pg_size_pretty(pg_total_relation_size(table_name)) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name) DESC
LIMIT 20;
"
```

---

## 💾 Sauvegarde et Restauration

### Backup Complet de l'Application

```bash
#!/bin/bash
# backup-elisaschool.sh

BACKUP_DIR="/mnt/DONNEES/projets/eLISAschool/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "🔄 Sauvegarde eLISAschool..."

# 1. Backup PostgreSQL
docker exec elisaschool_db pg_dump -U elisaschool_user elisaschool | gzip > $BACKUP_DIR/db-$TIMESTAMP.sql.gz

# 2. Backup Redis
docker exec elisaschool_redis redis-cli SAVE
docker cp elisaschool_redis:/data/dump.rdb $BACKUP_DIR/redis-$TIMESTAMP.rdb

# 3. Backup configuration
cp .env $BACKUP_DIR/env-$TIMESTAMP
cp docker-compose.yml $BACKUP_DIR/docker-compose-$TIMESTAMP.yml

echo "✅ Sauvegarde terminée dans $BACKUP_DIR"
ls -lh $BACKUP_DIR/*$TIMESTAMP*
```

### Restauration Complète

```bash
#!/bin/bash
# restore-elisaschool.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Usage: ./restore-elisaschool.sh <backup-file>"
    exit 1
fi

echo "🔄 Restauration depuis $BACKUP_FILE..."

# 1. Restaurer PostgreSQL
gunzip < $BACKUP_FILE | docker exec -i elisaschool_db psql -U elisaschool_user -d elisaschool

# 2. Redémarrer les services
docker compose restart backend frontend

echo "✅ Restauration terminée"
```

### Sauvegarde Automatique (Cron)

```bash
# Backup quotidien à 2h du matin
0 2 * * * /mnt/DONNEES/projets/eLISAschool/scripts/backup-elisaschool.sh >> /var/log/elisaschool-backup.log 2>&1

# Conserver seulement les 7 derniers jours
find /mnt/DONNEES/projets/eLISAschool/backups -name "*.gz" -mtime +7 -delete
```

---

## 🌐 Réseau et Ports

### Configuration des Ports

| Service | Port Hôte | Port Conteneur | Protocole |
|---------|-----------|----------------|-----------|
| Backend API | 7000 | 7000 | TCP |
| Frontend React | 7001 | 7001 | TCP |
| PostgreSQL | 7002 | 7002 | TCP |
| Redis | 7003 | 7003 | TCP |
| pgAdmin | 7004 | 7004 | TCP |

### Vérification des Ports

```bash
# Voir les ports exposés
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Vérifier qu'un port est en écoute
netstat -tuln | grep 7000
netstat -tuln | grep 7001

# Ou avec ss
ss -tuln | grep 7000
```

### Test de Connectivité Réseau

```bash
# Depuis l'hôte
curl http://localhost:7000/api/health
curl http://localhost:7001/api/health

# Depuis le réseau local (remplacer 10.0.0.1 par l'IP du serveur)
curl http://10.0.0.1:7000/api/health
curl http://10.0.0.1:7001/api/health

# Depuis un autre conteneur
docker exec elisaschool_frontend wget -qO- http://elisaschool_backend:7000/api/health
```

### Configuration CORS pour Réseau Local

```bash
# Dans .env
ALLOWED_ORIGINS=http://localhost:7001,http://127.0.0.1:7001,http://0.0.0.0:7001,http://10.0.0.1:7001

# Puis recréer le backend
docker compose down backend
docker compose up -d backend

# Vérifier
docker exec elisaschool_backend printenv | grep ALLOWED_ORIGINS
```

### Configuration VITE_API_URL

```bash
# Dans frontend/.env.local
VITE_API_URL=http://10.0.0.1:7000

# ⚠️ JAMAIS utiliser 172.18.0.1 (gateway Docker)

# Puis recréer le frontend
docker compose down frontend
docker compose up -d frontend

# Vérifier
docker exec elisaschool_frontend cat /app/.env.local
```

---

## 🔧 Dépannage Rapide

### Le Backend ne Répond Pas

```bash
# 1. Vérifier l'état
docker ps | grep backend

# 2. Voir les logs
docker logs elisaschool_backend --tail 100

# 3. Vérifier la configuration
docker exec elisaschool_backend printenv | grep -E "(NODE_ENV|DB_|ALLOWED_ORIGINS)"

# 4. Tester la connexion DB
docker exec elisaschool_backend ping -c 3 elisaschool_db

# 5. Redémarrer
docker compose down backend
docker compose up -d backend
```

### Erreur CORS depuis une Autre Machine

```bash
# 1. Vérifier ALLOWED_ORIGINS
docker exec elisaschool_backend printenv | grep ALLOWED_ORIGINS

# 2. Doit contenir http://10.0.0.1:7001
# Si absent, modifier .env et recréer:
docker compose down backend
docker compose up -d backend

# 3. Tester
curl -v http://10.0.0.1:7000/api/auth/login \
  -X POST \
  -H "Origin: http://10.0.0.1:7001" \
  -H "Content-Type: application/json" \
  -d '{"identifiant":"test","motDePasse":"test"}' | grep "Access-Control"
```

### Le Frontend Affiche une Page Blanche

```bash
# 1. Vérifier VITE_API_URL
docker exec elisaschool_frontend cat /app/.env.local

# 2. Vérifier que le cache Vite est propre
docker exec elisaschool_frontend ls -la /app/node_modules/.vite

# 3. Si problème, supprimer cache et recréer
docker compose down frontend
rm -rf frontend/node_modules/.vite
docker compose up -d frontend

# 4. Sur le navigateur client: Ctrl+Shift+R (vider cache)
```

### La Base de Données ne Démare Pas

```bash
# 1. Voir les logs
docker logs elisaschool_db --tail 100

# 2. Vérifier l'espace disque
df -h
docker system df

# 3. Vérifier les permissions du volume
docker volume inspect postgres_data

# 4. Recréer le conteneur
docker compose down db
docker compose up -d db
```

### Redis ne Répond Pas

```bash
# 1. Tester la connexion
docker exec elisaschool_redis redis-cli ping
# Doit retourner: PONG

# 2. Voir les logs
docker logs elisaschool_redis

# 3. Redémarrer
docker compose restart redis
```

### Espace Disque Saturé

```bash
# Voir l'utilisation
docker system df

# Nettoyage progressif
docker container prune -f        # Conteneurs arrêtés
docker image prune -f            # Images dangling
docker volume prune -f           # Volumes non utilisés
docker system prune -f           # Tout nettoyer (safe)

# Nettoyage agressif ⚠️
docker system prune -a --volumes -f
```

---

## 📜 Scripts Automatisés

### Script de Démarrage Complet

```bash
#!/bin/bash
# start-elisaschool.sh

echo "🚀 Démarrage eLISAschool..."

# 1. Vérifier Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas démarré"
    exit 1
fi

# 2. Nettoyer les anciens conteneurs
docker compose down

# 3. Démarrer tous les services
docker compose up -d

# 4. Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# 5. Vérifier l'état
echo "✅ État des conteneurs:"
docker ps --filter "name=elisaschool" --format "table {{.Names}}\t{{.Status}}"

# 6. Tests de connectivité
echo ""
echo "🧪 Tests de connectivité:"
curl -s http://localhost:7000/api/health | jq -r '.message' && echo "✅ Backend OK" || echo "❌ Backend KO"
curl -s http://localhost:7001/api/health | jq -r '.message' && echo "✅ Frontend OK" || echo "❌ Frontend KO"

echo ""
echo "🎉 eLISAschool démarré avec succès!"
echo "📱 Frontend: http://localhost:7001"
echo "🔧 Backend: http://localhost:7000"
```

### Script de Diagnostic Complet

```bash
#!/bin/bash
# diagnose-elisaschool.sh

echo "🔍 Diagnostic eLISAschool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. État des conteneurs
echo ""
echo "📦 Conteneurs:"
docker ps --filter "name=elisaschool" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Ressources
echo ""
echo "💾 Ressources:"
docker stats --no-stream elisaschool_backend elisaschool_frontend elisaschool_db

# 3. Logs récents (erreurs)
echo ""
echo "📜 Erreurs récentes (backend):"
docker logs elisaschool_backend --tail 50 2>&1 | grep -i "error" | tail -5

# 4. Configuration
echo ""
echo "⚙️  Configuration backend:"
docker exec elisaschool_backend printenv | grep -E "(NODE_ENV|ALLOWED_ORIGINS)" | head -3

# 5. Tests
echo ""
echo "🧪 Tests de connectivité:"
curl -s -o /dev/null -w "Backend: HTTP %{http_code}\n" http://localhost:7000/api/health
curl -s -o /dev/null -w "Frontend: HTTP %{http_code}\n" http://localhost:7001

# 6. Espace disque
echo ""
echo "💿 Espace disque:"
df -h / | tail -1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Diagnostic terminé"
```

### Script de Redémarrage d'Urgence

```bash
#!/bin/bash
# emergency-restart.sh

echo "🚨 Redémarrage d'urgence eLISAschool..."

# 1. Arrêt brutal
docker compose down

# 2. Nettoyage
docker container prune -f
docker system prune -f

# 3. Redémarrage
docker compose up -d

# 4. Vérification
sleep 30
docker ps --filter "name=elisaschool"

echo "✅ Redémarrage terminé"
```

---

## 📚 Annexes

### A. Raccourcis Utiles (Aliases Bash)

```bash
# Ajouter à ~/.bashrc

# eLISAschool - Navigation
alias elisa='cd /mnt/DONNEES/projets/eLISAschool'
alias elisa-logs='docker compose logs -f'
alias elisa-ps='docker ps --filter "name=elisaschool"'

# eLISAschool - Gestion
alias elisa-up='docker compose up -d'
alias elisa-down='docker compose down'
alias elisa-restart='docker compose down && docker compose up -d'

# eLISAschool - Diagnostic
alias elisa-health='docker exec elisaschool_backend printenv | grep -E "(NODE_ENV|ALLOWED_ORIGINS)"'
alias elisa-logs-backend='docker logs elisaschool_backend --tail 100 -f'
alias elisa-logs-frontend='docker logs elisaschool_frontend --tail 100 -f'

# eLISAschool - Base de données
alias elisa-db='docker exec -it elisaschool_db psql -U elisaschool_user -d elisaschool'
alias elisa-backup='docker exec elisaschool_db pg_dump -U elisaschool_user elisaschool | gzip > backup-$(date +%Y%m%d_%H%M%S).sql.gz'
```

### B. Ports et URLs de Référence

```
Développement Local:
  Frontend: http://localhost:7001
  Backend:  http://localhost:7000
  pgAdmin:  http://localhost:7004
  API Docs: http://localhost:7000/api/docs

Réseau Local (depuis autre machine):
  Frontend: http://10.0.0.1:7001
  Backend:  http://10.0.0.1:7000
  pgAdmin:  http://10.0.0.1:7004
```

### C. Identifiants de Test

```
Super Admin:
  Email: superadmin@elisaschool.com
  Mot de passe: Admin123!

pgAdmin:
  Email: admin@elisaschool.com
  Mot de passe: Admin123!

PostgreSQL:
  Utilisateur: elisaschool_user
  Base: elisaschool
  Port: 7002
```

### D. Checklist de Dépannage

```
□ Docker est-il démarré ? (docker info)
□ Les conteneurs sont-ils en cours ? (docker ps)
□ Les ports sont-ils en écoute ? (netstat -tuln | grep 7000)
□ Les logs montrent-ils des erreurs ? (docker logs)
□ La configuration est-elle correcte ? (printenv)
□ Le firewall autorise-t-il les ports ? (ufw status)
□ L'espace disque est-il suffisant ? (df -h)
□ Les volumes sont-ils montés ? (docker inspect)
```

---

**Dernière mise à jour :** 28 juin 2026  
**Auteur :** franck arlos chendjou  
**Version :** 1.0.0  
**Statut :** ✅ Guide Complet et Validé
