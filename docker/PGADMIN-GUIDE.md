# pgAdmin - Guide d'utilisation

## 🎯 Architecture

pgAdmin est configuré pour se connecter aux services **existants** du groupe de conteneurs `elisaschool` :

- ✅ **PostgreSQL** : `elisaschool_postgres_dev` (groupe elisaschool)
- ✅ **Backend** : `elisaschool_backend_dev` (groupe elisaschool)
- ✅ **Redis** : `elisaschool_redis_dev` (groupe elisaschool)
- ✅ **pgAdmin** : `elisaschool_pgadmin` (géré par docker-compose)

**Tous les conteneurs sont sur le même réseau Docker** : `elisaschool_elisaschool_network`

## 🚀 Accès à l'interface

- **URL** : http://localhost:7004
- **Email** : admin@elisaschool.cm
- **Mot de passe** : admin_elisaschool_2024

## 🔧 Configuration automatique

pgAdmin est pré-configuré pour se connecter à la base de données PostgreSQL eLISAschool :

- **Serveur** : eLISAschool DB (Dev)
- **Host** : `elisaschool_postgres_dev` (nom du conteneur existant)
- **Port** : 5432 (port interne Docker)
- **Base de données** : elisaschool
- **Utilisateur** : elisaschool_user
- **Mot de passe** : elisaschool_dev_2024

## 📋 Commandes utiles

### Démarrer pgAdmin
```bash
cd /home/franckylab/projets/eLISAschool/docker
docker compose up -d pgadmin
```

### Arrêter pgAdmin
```bash
docker compose stop pgadmin
```

### Redémarrer pgAdmin
```bash
docker compose restart pgadmin
```

### Voir les logs
```bash
docker compose logs -f pgadmin
```

### Supprimer le conteneur (perdra les données)
```bash
docker compose down pgadmin
```

## 🔍 Connexion manuelle (si nécessaire)

Si la configuration automatique ne fonctionne pas :

1. Ouvrez http://localhost:7004
2. Connectez-vous avec les identifiants ci-dessus
3. Cliquez sur **"Add New Server"**
4. Onglet **General** :
   - Name : `eLISAschool DB`
5. Onglet **Connection** :
   - Host : `postgres` (si dans Docker) ou `host.docker.internal` (si accès externe)
   - Port : `5432`
   - Maintenance database : `elisaschool`
   - Username : `elisaschool_user`
   - Password : `elisaschool_dev_2024`

## 🌐 Réseau Docker

pgAdmin est connecté au réseau Docker existant :
- `elisaschool_elisaschool_network` : réseau du groupe elisaschool

Cela permet d'accéder directement aux conteneurs par leur nom :
- `elisaschool_postgres_dev` (PostgreSQL)
- `elisaschool_backend_dev` (Backend API)
- `elisaschool_redis_dev` (Redis Cache)

## 📊 Fonctionnalités principales

- ✅ Explorer la structure de la base de données
- ✅ Exécuter des requêtes SQL
- ✅ Visualiser les données dans des tableaux
- ✅ Importer/Exporter des données
- ✅ Créer des backups
- ✅ Monitorer les performances
- ✅ Gérer les utilisateurs et permissions

## 🔒 Sécurité

**En production**, modifiez les identifiants dans `.env` :
```bash
PGADMIN_EMAIL=your-email@example.com
PGADMIN_PASSWORD=your-secure-password
```

## 📝 Notes

- Les données de pgAdmin sont persistées dans le volume `pgadmin_data`
- La configuration des serveurs est dans `pgadmin-servers.json`
- pgAdmin utilise le port **7004** pour éviter les conflits
