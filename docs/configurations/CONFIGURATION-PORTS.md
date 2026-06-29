# 🔌 Configuration des Ports eLISAschool

## 📋 Convention de Numérotation

Tous les ports eLISAschool utilisent la **racine 70** avec une numérotation séquentielle pour une cohérence et une mémorisation optimales.

### Schema de Numérotation

| Port | Service | Usage | Statut |
|------|---------|-------|--------|
| **7000** | Backend API | API Express.js principale | ✅ Actif |
| **7001** | Frontend Dev | Interface React/Vite (développement) | ✅ Actif |
| **7002** | PostgreSQL | Base de données principale | ✅ Actif |
| **7003** | Redis | Cache distribué & files d'attente | ✅ Actif |
| **7004** | pgAdmin | Interface web de gestion PostgreSQL | ✅ Actif |
| **7005+** | Services futurs | Extensions et services additionnels | 📦 Réservé |

---

## 🎯 Avantages de cette Convention

### ✅ Cohérence
- Tous les ports commencent par `70xx`
- Numérotation logique et prévisible
- Facile à mémoriser : `7000 + N° service`

### ✅ Disponibilité
- Plage 7000-7099 très peu utilisée par les services standards
- Conflits de ports quasi inexistants
- Compatible avec tous les systèmes (Linux, macOS, Windows)

### ✅ Maintenance
- Ajout facile de nouveaux services (7005, 7006, etc.)
- Documentation simplifiée
- Dépannage facilité

---

## 🔧 Configuration par Environnement

### Fichiers de Configuration

| Fichier | Ports Configurés |
|---------|------------------|
| `.env` (racine) | APP_PORT=7000, DB_PORT=7002, REDIS_PORT=7003, FRONTEND_URL=7001 |
| `docker/.env` | DB_PORT=7002, REDIS_PORT=7003, APP_PORT=7000, FRONTEND_PORT=7001, PGADMIN_PORT=7004 |
| `frontend/.env` | VITE_API_URL=http://localhost:7000 |
| `docker/docker-compose.yml` | Ports mappés avec valeurs par défaut 70xx |

### Variables d'Environnement

```bash
# Backend
APP_PORT=7000
APP_URL=http://localhost:7000

# Frontend
FRONTEND_PORT=7001
FRONTEND_URL=http://localhost:7001
VITE_API_URL=http://localhost:7000

# Base de données
DB_PORT=7002

# Cache
REDIS_PORT=7003

# Administration
PGADMIN_PORT=7004
```

---

## 🌐 URLs d'Accès

### Développement Local

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:7001 | Interface utilisateur React |
| **Backend API** | http://localhost:7000 | API REST Express |
| **Swagger Docs** | http://localhost:7000/api/docs | Documentation API |
| **Health Check** | http://localhost:7000/api/health | Statut de l'API |
| **pgAdmin** | http://localhost:7004 | Gestion PostgreSQL |

### Docker Compose

```bash
# Accès aux services via Docker
# Backend interne : http://backend:3000
# PostgreSQL interne : postgres:5432
# Redis interne : redis:6379
```

---

## 🔍 Vérification des Ports

### Commands de Vérification

```bash
# Vérifier tous les ports eLISAschool
lsof -i :7000  # Backend
lsof -i :7001  # Frontend
lsof -i :7002  # PostgreSQL
lsof -i :7003  # Redis
lsof -i :7004  # pgAdmin

# Ou utiliser netstat
netstat -tulpn | grep 70

# Vérifier avec ss
ss -tulpn | grep 70
```

### Test de Connectivité

```bash
# Test Backend
curl http://localhost:7000/api/health

# Test Frontend
curl -I http://localhost:7001

# Test PostgreSQL
psql -h localhost -p 7002 -U elisaschool_user -d elisaschool

# Test Redis
redis-cli -h localhost -p 7003 -a elisaschool_password ping
```

---

## 🐛 Dépannage

### Port Déjà Utilisé

```bash
# Identifier le processus utilisant le port
lsof -i :7000

# Tuer le processus (si nécessaire)
kill -9 <PID>

# Ou changer le port dans .env
APP_PORT=7005  # Port alternatif
```

### Services Inaccessibles

```bash
# 1. Vérifier que les services sont démarrés
docker compose ps

# 2. Vérifier les logs
docker compose logs backend
docker compose logs frontend

# 3. Redémarrer le service problématique
docker compose restart backend

# 4. Vérifier la configuration des ports
docker compose port backend 3000  # Devrait afficher 0.0.0.0:7000
```

### Conflit de Ports Docker

```bash
# Arrêter tous les conteneurs
docker compose down

# Vérifier qu'aucun port n'est bloqué
lsof -i :7000-7004

# Redémarrer proprement
docker compose up -d
```

---

## 📝 Migration depuis Anciens Ports

Si vous migrez depuis l'ancienne configuration :

### Anciens → Nouveaux Ports

| Ancien Port | Nouveau Port | Service |
|-------------|--------------|---------|
| 3000/3001 | 7000 | Backend |
| 5173 | 7001 | Frontend |
| 5432/5433 | 7002 | PostgreSQL |
| 6379 | 7003 | Redis |
| 5050 | 7004 | pgAdmin |

### Actions Requises

1. **Mettre à jour les bookmarks/favoris** dans votre navigateur
2. **Modifier les configurations IDE** (VS Code, etc.)
3. **Updater les scripts de déploiement** si nécessaire
4. **Informer l'équipe** du changement de ports

---

## 🔒 Sécurité

### Recommandations Production

```bash
# Ne JAMAIS exposer ces ports directement en production
# Utiliser un reverse proxy (nginx, Traefik)

# Exemple nginx :
# Port 80/443 → Backend (7000)
# Port 80/443 → Frontend (7001)

# Firewall rules (ufw exemple)
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 7000:7004  # Bloquer accès direct aux ports
```

### Monitoring

```bash
# Surveiller les connexions aux ports
watch -n 1 'netstat -an | grep :70'

# Alertes sur connexions non autorisées
# Configurer dans votre système de monitoring
```

---

## 📚 Références

- [Docker Compose Configuration](../docker/docker-compose.yml)
- [Variables d'Environnement](../.env)
- [Guide Docker](../docker/README.md)
- [Quick Start Guide](../QUICKSTART.md)

---

**Dernière mise à jour** : Juin 2025  
**Version** : 1.0.0  
**Auteur** : franck arlos chendjou
