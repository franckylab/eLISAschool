# 🐳 eLISAschool - Docker Compose

## 🎯 Architecture

Tous les services eLISAschool tournent dans un seul groupe de conteneurs Docker géré par docker-compose :

| Service | Conteneur | Port externe | Port interne | Status |
|---------|-----------|--------------|--------------|--------|
| **PostgreSQL** | `elisaschool_postgres` | 7002 | 5432 | ✅ Healthy |
| **Redis** | `elisaschool_redis` | 7003 | 6379 | ✅ Healthy |
| **pgAdmin** | `elisaschool_pgadmin` | 7004 | 80 | ✅ Running |
| **Backend** | `elisaschool_backend` | 7000 | 3000 | ⏸️ Optionnel |
| **Frontend** | `elisaschool_frontend` | 7001 | 5173 | ⏸️ Optionnel |

**Réseau Docker unique** : `docker_elisaschool_network`

---

## 🚀 Démarrage rapide

### 1. Démarrer tous les services

```bash
./pgadmin.sh start
```

Ou avec docker-compose directement :

```bash
docker compose up -d
```

### 2. Vérifier l'état

```bash
./pgadmin.sh status
```

### 3. Accéder aux services

- **pgAdmin** : http://localhost:7004
  - Email : `admin@elisaschool.cm`
  - Password : `admin123`
  
- **PostgreSQL** : localhost:7002
  - Database : `elisaschool`
  - User : `elisaschool_user`
  - Password : `elisaschool_password`

- **Redis** : localhost:7003
  - Password : `elisaschool_password`

---

## 📋 Commandes utiles

### Gestion des services

```bash
# Démarrer tous les services
./pgadmin.sh start

# Arrêter tous les services
./pgadmin.sh stop

# Redémarrer tous les services
./pgadmin.sh restart

# Voir l'état complet
./pgadmin.sh status

# Voir les logs de tous les services
./pgadmin.sh logs

# Voir les logs d'un service spécifique
./pgadmin.sh logs postgres
./pgadmin.sh logs redis
./pgadmin.sh logs pgadmin

# Se connecter à PostgreSQL
./pgadmin.sh db-shell

# Nettoyage complet (ATTENTION: supprime les volumes)
./pgadmin.sh clean
```

### Commandes Docker directes

```bash
# Voir tous les conteneurs
docker ps --filter "name=elisaschool"

# Voir les logs
docker logs -f elisaschool_postgres

# Se connecter à un conteneur
docker exec -it elisaschool_postgres bash

# Redémarrer un service
docker compose restart postgres
```

---

## 🔧 Configuration

### Fichiers de configuration

| Fichier | Description |
|---------|-------------|
| `docker-compose.yml` | Configuration de tous les services |
| `.env` | Variables d'environnement |
| `pgadmin-servers.json` | Configuration automatique pgAdmin |
| `pgadmin.sh` | Script de gestion |

### Variables d'environnement principales

```bash
# PostgreSQL
DB_NAME=elisaschool
DB_USER=elisaschool_user
DB_PASSWORD=elisaschool_password
DB_PORT=7002

# Redis
REDIS_PASSWORD=elisaschool_password

# pgAdmin
PGADMIN_EMAIL=admin@elisaschool.cm
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=7004
```

Pour modifier ces valeurs, éditez le fichier `.env`.

---

## 🌐 Réseau Docker

Tous les conteneurs partagent le même réseau : `docker_elisaschool_network`

**Résolution DNS automatique :**
- Depuis n'importe quel conteneur : `postgres`, `redis`, `pgadmin`
- Exemple : Le backend utilise `DB_HOST=postgres` pour se connecter

**Isolation :**
- Les conteneurs sont isolés des autres applications Docker
- Communication inter-conteneurs uniquement par le réseau interne

---

## 💾 Volumes persistants

Les données sont conservées dans des volumes Docker :

| Volume | Données stockées |
|--------|------------------|
| `docker_postgres_data` | Base de données PostgreSQL |
| `docker_redis_data` | Cache Redis |
| `docker_pgadmin_data` | Configuration pgAdmin |

**⚠️ Important** : Ne supprimez pas ces volumes sauf si vous voulez perdre vos données !

---

## 🔒 Sécurité

### En développement

Les identifiants par défaut sont dans le fichier `.env`.

### En production

**MODIFIEZ TOUS LES IDENTIFIANTS :**

```bash
# Dans .env
DB_PASSWORD=<mot-de-passe-fort>
REDIS_PASSWORD=<mot-de-passe-fort>
PGADMIN_PASSWORD=<mot-de-passe-fort>
JWT_SECRET=<secret-fort>
ENCRYPTION_KEY=<clé-32-caractères>
```

**Recommandations :**
- Utilisez des mots de passe d'au moins 16 caractères
- Activez SSL pour PostgreSQL en production
- Limitez l'accès aux ports exposés
- Utilisez des secrets Docker pour les informations sensibles

---

## 🐛 Dépannage

### PostgreSQL ne démarre pas

```bash
# Voir les logs
docker logs elisaschool_postgres

# Vérifier le port
lsof -i :7002

# Redémarrer
docker compose restart postgres
```

### pgAdmin ne voit pas PostgreSQL

```bash
# Vérifier la connectivité
docker exec elisaschool_pgadmin ping -c 3 postgres

# Vérifier que PostgreSQL écoute
docker exec elisaschool_postgres pg_isready -U elisaschool_user

# Vérifier le réseau
docker network inspect docker_elisaschool_network
```

### Port déjà utilisé

```bash
# Trouver le processus
lsof -i :7002
lsof -i :7003
lsof -i :7004

# Changer le port dans .env
DB_PORT=7003  # Au lieu de 7002
```

### Réinitialiser complètement

```bash
# Arrêter et tout supprimer
./pgadmin.sh clean

# Redémarrer proprement
./pgadmin.sh start
```

---

## 📊 Monitoring

### Vérifier la santé des services

```bash
# Voir l'état
./pgadmin.sh status

# PostgreSQL doit montrer "healthy"
# Redis doit montrer "healthy"
```

### Accéder aux bases de données

**Via pgAdmin (recommandé) :**
1. Ouvrez http://localhost:7004
2. Connectez-vous avec admin@elisaschool.cm / admin123
3. Le serveur "eLISAschool DB" est pré-configuré

**Via ligne de commande :**
```bash
# Se connecter à PostgreSQL
./pgadmin.sh db-shell

# Ou directement
docker exec -it elisaschool_postgres psql -U elisaschool_user -d elisaschool

# Voir les tables
\dt

# Quitter
\q
```

---

## 📝 Notes

- **Toujours utiliser** les noms de conteneurs pour la communication inter-services
- **Le réseau** `docker_elisaschool_network` est géré par docker-compose
- **Les volumes** persistent les données même après suppression des conteneurs
- **Backend et Frontend** sont optionnels - vous pouvez les démarrer en local

---

## 📚 Documentation associée

- [Guide pgAdmin](PGADMIN-GUIDE.md)
- [Documentation backend](../backend/)
- [Guide de déploiement](../docs/)
- [Conventions de développement](../.qoder/rules/elisaschool-conventions.md)
