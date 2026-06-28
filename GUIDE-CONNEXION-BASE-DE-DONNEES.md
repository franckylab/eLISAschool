# 🔐 Guide Complet de Connexion à la Base de Données eLISAschool

**Version** : 1.0.0  
**Date** : 28 juin 2026  
**Base de données** : PostgreSQL 16 Alpine

---

## 📋 Identifiants Réels de la Base de Données

### 🎯 Credentials PostgreSQL

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **Host (Docker)** | `postgres` ou `172.18.0.1` | Nom de service Docker OU IP de l'hôte |
| **Host (Local)** | `localhost` | Pour connexion directe depuis l'hôte |
| **Port** | `7002` | Port personnalisé (pas le 5432 par défaut) |
| **Database** | `elisaschool` | Nom de la base de données |
| **Username** | `elisaschool_user` | Utilisateur PostgreSQL |
| **Password** | `elisaschool_password` | Mot de passe (⚠️ changer en production) |

### 🔑 Credentials pgAdmin 4

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **URL** | `http://localhost:7004` | Interface web d'administration |
| **Email** | `admin@elisaschool.cm` | Identifiant de connexion pgAdmin |
| **Password** | `admin123` | Mot de passe pgAdmin (⚠️ changer en production) |

### 🔴 Credentials Redis (Cache)

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **Host (Docker)** | `redis` | Nom de service Docker |
| **Host (Local)** | `localhost` | Pour connexion directe |
| **Port** | `7003` | Port personnalisé |
| **Password** | `elisaschool_password` | Mot de passe Redis |

---

## 🐘 1. Connexion en Local (depuis l'hôte)

### 1.1 Via psql (CLI PostgreSQL)

**Prérequis** : PostgreSQL client installé sur votre machine

```bash
# Connexion interactive
psql -h localhost -p 7002 -U elisaschool_user -d elisaschool

# On vous demandera le mot de passe : elisaschool_password

# Ou en une seule commande (mot de passe en ligne)
PGPASSWORD=elisaschool_password psql -h localhost -p 7002 -U elisaschool_user -d elisaschool
```

**Exemples de requêtes** :
```sql
-- Lister toutes les tables
\dt

-- Voir les utilisateurs superadmin
SELECT email, matricule, estSuperAdmin 
FROM utilisateurs 
WHERE estSuperAdmin = true;

-- Compter les élèves
SELECT COUNT(*) FROM eleves;

-- Quitter
\q
```

### 1.2 Via une application GUI (DBeaver, pgAdmin Desktop, DataGrip)

**Configuration de connexion** :

```
Connection Type: PostgreSQL
Host: localhost
Port: 7002
Database: elisaschool
Username: elisaschool_user
Password: elisaschool_password
```

**Test de connexion** :
- Cliquez sur "Test Connection"
- Devrait afficher "Connected to PostgreSQL 16.x"

---

## 🐳 2. Connexion dans Docker (depuis un conteneur)

### 2.1 Depuis le conteneur Backend

Le backend utilise les variables d'environnement définies dans `.env` :

```bash
# Voir les variables d'environnement du backend
docker exec elisaschool_backend env | grep DB_

# Résultat attendu :
# DB_HOST=postgres
# DB_PORT=7002
# DB_NAME=elisaschool
# DB_USER=elisaschool_user
# DB_PASSWORD=elisaschool_password
```

**Dans le code backend** (TypeORM) :
```typescript
// backend/src/database/data-source.ts
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'postgres',  // Nom de service Docker
    port: parseInt(process.env.DB_PORT || '7002'),
    username: process.env.DB_USER || 'elisaschool_user',
    password: process.env.DB_PASSWORD || 'elisaschool_password',
    database: process.env.DB_NAME || 'elisaschool',
    // ...
});
```

### 2.2 Depuis le conteneur Frontend

Le frontend **n'a PAS** accès direct à la base de données. Il passe par l'API backend :

```
FRONTEND → API Backend (http://172.18.0.1:7000/api) → PostgreSQL
```

### 2.3 Depuis un autre conteneur (ex: scripts de migration)

```bash
# Exécuter une migration
docker exec elisaschool_backend npm run migration:run

# Ou se connecter directement depuis le conteneur backend
docker exec -it elisaschool_backend sh
# Dans le conteneur :
apt-get update && apt-get install -y postgresql-client
psql -h postgres -p 7002 -U elisaschool_user -d elisaschool
```

### 2.4 Depuis le conteneur PostgreSQL lui-même

```bash
# Se connecter au conteneur DB
docker exec -it elisaschool_db sh

# Dans le conteneur (en tant que postgres)
psql -U elisaschool_user -d elisaschool -p 7002

# Ou en tant que superuser postgres
psql -U postgres -p 7002
```

---

## 🌐 3. Connexion à Distance (depuis une autre machine)

### 3.1 Prérequis

1. **PostgreSQL doit écouter sur toutes les interfaces** (pas juste localhost)
2. **Le port 7002 doit être accessible** depuis le réseau
3. **Le firewall doit autoriser** les connexions entrantes sur le port 7002

### 3.2 Configuration PostgreSQL (docker-compose.yml)

Vérifiez que le port est exposé sur `0.0.0.0` :

```yaml
postgres:
  ports:
    - "0.0.0.0:7002:7002"  # ✅ Accessible depuis toutes les interfaces
    # OU
    - "7002:7002"          # ✅ Par défaut, écoute sur 0.0.0.0
```

**Vérification** :
```bash
# Vérifier que PostgreSQL écoute sur toutes les interfaces
docker exec elisaschool_db cat /var/lib/postgresql/data/postgresql.conf | grep listen_addresses

# Devrait retourner :
# listen_addresses = '*'
```

### 3.3 Connexion depuis une machine distante

```bash
# Remplacer 10.0.0.1 par l'IP de votre serveur
psql -h 10.0.0.1 -p 7002 -U elisaschool_user -d elisaschool

# Ou via une application GUI
Host: 10.0.0.1
Port: 7002
Database: elisaschool
Username: elisaschool_user
Password: elisaschool_password
```

### 3.4 Configuration du Firewall (Linux)

```bash
# Autoriser le port 7002 (UFW - Ubuntu/Debian)
sudo ufw allow 7002/tcp
sudo ufw reload

# Ou avec iptables
sudo iptables -A INPUT -p tcp --dport 7002 -j ACCEPT

# Vérifier
sudo ufw status | grep 7002
```

### 3.5 ⚠️ Sécurité pour la Production

**NE JAMAIS** exposer PostgreSQL directement sur Internet en production !

Utilisez plutôt :
1. **SSH Tunnel** (recommandé) :
   ```bash
   # Créer un tunnel SSH
   ssh -L 7002:localhost:7002 user@serveur.com
   
   # Se connecter en local via le tunnel
   psql -h localhost -p 7002 -U elisaschool_user -d elisaschool
   ```

2. **VPN** : Connectez-vous au VPN de l'entreprise avant d'accéder à la DB

3. **Proxy inverse** : Nginx/Traefik avec authentification

---

## 🎨 4. Connexion avec pgAdmin 4

### 4.1 Accès à l'Interface Web

```bash
# Ouvrir dans votre navigateur
http://localhost:7004

# Ou depuis une autre machine du réseau local
http://10.0.0.1:7004
```

### 4.2 Première Connexion

1. **Page de login pgAdmin** :
   - **Email** : `admin@elisaschool.cm`
   - **Password** : `admin123`

2. **Ajouter un nouveau serveur** :

   **Onglet "General"** :
   ```
   Name: eLISAschool DB (Développement)
   ```

   **Onglet "Connection"** :
   ```
   Host name/address: postgres        # OU 172.18.0.1 (IP de l'hôte)
   Port: 7002
   Maintenance database: elisaschool
   Username: elisaschool_user
   Password: elisaschool_password
   Save password? ✓ (cocher pour ne pas retaper)
   ```

   **Cliquer sur "Save"**

### 4.3 Configuration Avancée (Optionnel)

**Onglet "SSL"** :
```
SSL mode: prefer
```

**Onglet "Advanced"** :
```
DB restriction: elisaschool
```

### 4.4 Navigation dans pgAdmin

Une fois connecté :

```
Servers
  └── eLISAschool DB (Développement)
       ├── Databases
       │    └── elisaschool
       │         ├── Schemas
       │         │    └── public
       │         │         ├── Tables (161 tables)
       │         │         ├── Views
       │         │         └── Functions
       │         └── Query Tool (F6 pour ouvrir)
       └── Maintenance Databases
            └── elisaschool
```

### 4.5 Exécuter des Requêtes SQL

1. **Clic droit** sur `elisaschool` → **Query Tool** (ou touche `F6`)

2. **Exemples de requêtes** :

```sql
-- Lister les tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Voir les utilisateurs
SELECT id, email, matricule, "estSuperAdmin", "createdAt"
FROM utilisateurs
ORDER BY "createdAt" DESC
LIMIT 10;

-- Voir les établissements
SELECT id, nom, code, ville, "createdAt"
FROM etablissements
ORDER BY "createdAt" DESC;

-- Compter les données par table
SELECT 
    'utilisateurs' as table_name, COUNT(*) as row_count FROM utilisateurs
UNION ALL
SELECT 'eleves', COUNT(*) FROM eleves
UNION ALL
SELECT 'etablissements', COUNT(*) FROM etablissements
UNION ALL
SELECT 'annees_scolaires', COUNT(*) FROM annees_scolaires
ORDER BY table_name;

-- Voir les connexions actives
SELECT 
    pid,
    usename,
    client_addr,
    client_port,
    state,
    query,
    query_start
FROM pg_stat_activity
WHERE datname = 'elisaschool'
ORDER BY query_start DESC;
```

3. **Exécuter** : Bouton "Execute" (▶) ou `F5`

### 4.6 Importer/Exporter des Données

**Exporter** :
1. Clic droit sur une table → **Import/Export Data**
2. Onglet **Export**
3. Choisir le format (CSV, SQL, JSON)
4. Cliquer sur **OK**

**Importer** :
1. Clic droit sur une table → **Import/Export Data**
2. Onglet **Import**
3. Sélectionner le fichier
4. Configurer les options
5. Cliquer sur **OK**

---

## 🔍 5. Diagnostic et Troubleshooting

### 5.1 Vérifier que PostgreSQL tourne

```bash
# Voir le statut du conteneur
docker ps | grep elisaschool_db

# Devrait afficher :
# elisaschool_db   postgres:16-alpine   Up (healthy)   0.0.0.0:7002->7002/tcp

# Vérifier les logs
docker logs elisaschool_db --tail=20

# Devrait afficher :
# PostgreSQL init process complete; ready for start up.
# ... database system is ready to accept connections
```

### 5.2 Tester la connectivité

```bash
# Test 1: Le port est-il ouvert ?
nc -zv localhost 7002

# Résultat attendu :
# Connection to localhost port 7002 [tcp/*] succeeded!

# Test 2: PostgreSQL répond-il ?
docker exec elisaschool_db pg_isready -U elisaschool_user -d elisaschool -p 7002

# Résultat attendu :
# /var/run/postgresql:7002 - accepting connections
```

### 5.3 Erreurs Courantes

#### ❌ "Connection refused"

**Cause** : PostgreSQL n'est pas démarré ou le port est incorrect

**Solution** :
```bash
# Redémarrer PostgreSQL
docker compose restart postgres

# Vérifier le port
docker compose ps | grep postgres
```

#### ❌ "Password authentication failed"

**Cause** : Mot de passe incorrect

**Solution** :
```bash
# Vérifier les identifiants dans .env
grep DB_PASSWORD .env

# Réinitialiser le mot de passe (si nécessaire)
docker exec -it elisaschool_db psql -U postgres -p 7002 -c "ALTER USER elisaschool_user WITH PASSWORD 'elisaschool_password';"
```

#### ❌ "Database does not exist"

**Cause** : La base de données n'a pas été créée

**Solution** :
```bash
# Recréer la base
docker compose down -v
docker compose up -d
# Attendre 30 secondes que l'initialisation se termine
```

#### ❌ "FATAL: no pg_hba.conf entry for host"

**Cause** : PostgreSQL n'autorise pas les connexions depuis cette IP

**Solution** :
```bash
# Dans le conteneur, modifier pg_hba.conf
docker exec -it elisaschool_db sh
echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf
exit

# Redémarrer PostgreSQL
docker compose restart postgres
```

### 5.4 Réinitialiser le Mot de Passe PostgreSQL

Si vous avez oublié le mot de passe :

```bash
# 1. Se connecter en tant que superuser postgres
docker exec -it elisaschool_db psql -U postgres -p 7002

# 2. Changer le mot de passe
ALTER USER elisaschool_user WITH PASSWORD 'nouveau_mot_de_passe';

# 3. Quitter
\q

# 4. Mettre à jour .env
echo "DB_PASSWORD=nouveau_mot_de_passe" >> .env

# 5. Redémarrer le backend
docker compose restart backend
```

---

## 🛠️ 6. Scripts Utiles

### 6.1 Script de Connexion Rapide (connexion-db.sh)

```bash
#!/bin/bash
# ==================================
# eLISAschool - Connexion Rapide à la DB
# ==================================

# Charger les variables d'environnement
source .env

echo "🔐 Connexion à la base de données eLISAschool..."
echo "   Host: ${DB_HOST:-localhost}"
echo "   Port: ${DB_PORT:-7002}"
echo "   DB: ${DB_NAME:-elisaschool}"
echo "   User: ${DB_USER:-elisaschool_user}"
echo ""

# Connexion
PGPASSWORD=${DB_PASSWORD:-elisaschool_password} \
  psql -h ${DB_HOST:-localhost} \
       -p ${DB_PORT:-7002} \
       -U ${DB_USER:-elisaschool_user} \
       -d ${DB_NAME:-elisaschool}
```

**Utilisation** :
```bash
chmod +x scripts/connexion-db.sh
./scripts/connexion-db.sh
```

### 6.2 Script de Backup (backup-db.sh)

```bash
#!/bin/bash
# ==================================
# eLISAschool - Backup de la Base de Données
# ==================================

source .env

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/elisaschool_${TIMESTAMP}.sql"

mkdir -p ${BACKUP_DIR}

echo "💾 Backup de la base de données..."
docker exec elisaschool_db pg_dump \
  -U ${DB_USER:-elisaschool_user} \
  -d ${DB_NAME:-elisaschool} \
  -p 7002 \
  -F c \
  -f /tmp/backup.dump

docker cp elisaschool_db:/tmp/backup.dump ${BACKUP_FILE}

echo "✅ Backup créé: ${BACKUP_FILE}"
echo "   Taille: $(du -h ${BACKUP_FILE} | cut -f1)"
```

### 6.3 Script de Restore (restore-db.sh)

```bash
#!/bin/bash
# ==================================
# eLISAschool - Restore de la Base de Données
# ==================================

if [ -z "$1" ]; then
  echo "❌ Usage: ./restore-db.sh <backup_file.sql>"
  exit 1
fi

source .env

BACKUP_FILE=$1

echo "🔄 Restore de la base de données depuis ${BACKUP_FILE}..."

docker cp ${BACKUP_FILE} elisaschool_db:/tmp/restore.dump

docker exec elisaschool_db pg_restore \
  -U ${DB_USER:-elisaschool_user} \
  -d ${DB_NAME:-elisaschool} \
  -p 7002 \
  --clean \
  --if-exists \
  /tmp/restore.dump

echo "✅ Restore terminé"
```

---

## 📊 7. Architecture de Connexion

### 7.1 En Développement (Docker)

```
┌─────────────────────────────────────────────────────────┐
│                    RÉSEAU LOCAL                         │
│                                                         │
│  ┌─────────────┐    ┌─────────────────────────────┐    │
│  │  NAVIGATEUR │───▶│  FRONTEND (172.18.0.6)      │    │
│  │ localhost:7001│    │  Vite Dev Server            │    │
│  └─────────────┘    └──────────┬──────────────────┘    │
│                                │ VITE_API_URL          │
│                                ▼                       │
│                     ┌──────────────────────┐           │
│                     │  HÔTE (172.18.0.1)   │           │
│                     │  Port 7000 exposé    │           │
│                     └──────────┬───────────┘           │
│                                │ Port mapping          │
│                                ▼                       │
│  ┌─────────────┐    ┌─────────────────────────────┐    │
│  │  BACKEND    │◀──│  BACKEND (172.18.0.5)       │    │
│  │ localhost:7000│    │  Express.js + TypeORM     │    │
│  └─────────────┘    └──────────┬──────────────────┘    │
│                                │ DB_HOST=postgres      │
│                                ▼                       │
│                     ┌──────────────────────┐           │
│                     │  POSTGRES (172.18.0.3)│          │
│                     │  Port 7002            │          │
│                     └──────────┬───────────┘           │
│                                │ Port mapping          │
│                                ▼                       │
│                     ┌──────────────────────┐           │
│                     │  HÔTE (localhost:7002)│          │
│                     └──────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Modes de Connexion

| Mode | Host | Port | Usage |
|------|------|------|-------|
| **Docker (interne)** | `postgres` | `7002` | Conteneur → DB |
| **Local (hôte)** | `localhost` | `7002` | psql, DBeaver, etc. |
| **Réseau local** | `10.0.0.1` | `7002` | Machine distante |
| **pgAdmin** | `postgres` | `7002` | Interface web |

---

## 🔒 8. Recommandations de Sécurité

### 8.1 Développement

✅ **OK** :
- Utiliser les identifiants par défaut
- Exposer le port 7002 sur localhost
- Utiliser pgAdmin en local

❌ **À ÉVITER** :
- Exposer PostgreSQL sur Internet
- Utiliser des mots de passe faibles en production

### 8.2 Production

✅ **OBLIGATOIRE** :
- Changer **TOUS** les mots de passe
- Utiliser des mots de passe forts (min 32 caractères)
- Restreindre l'accès par IP (firewall)
- Activer SSL pour les connexions
- Utiliser SSH Tunnel ou VPN pour l'accès distant
- Ne JAMAIS exposer PostgreSQL directement sur Internet
- Configurer `pg_hba.conf` pour restreindre les IPs autorisées

**Exemple .env.production** :
```bash
# ⚠️ Production - Mots de passe forts
DB_PASSWORD=votre_mot_de_passe_tres_long_et_complexe_12345678901234567890
REDIS_PASSWORD=autre_mot_de_passe_tres_securise_abcdefghijklmnopqrstuvwxyz
PGADMIN_PASSWORD=pgadmin_password_super_securise_98765432109876543210
```

### 8.3 Rotation des Mots de Passe

```bash
# Changer le mot de passe PostgreSQL
docker exec -it elisaschool_db psql -U postgres -p 7002 << EOF
ALTER USER elisaschool_user WITH PASSWORD 'nouveau_mot_de_passe_$(date +%s)';
EOF

# Mettre à jour .env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=nouveau_mot_de_passe_$(date +%s)/" .env

# Redémarrer les services
docker compose restart backend
```

---

## 📚 9. Ressources Utiles

### 9.1 Commandes psql Essentielles

```sql
-- Lister les bases de données
\l

-- Se connecter à une base
\c elisaschool

-- Lister les tables
\dt

-- Lister les vues
\dv

-- Lister les fonctions
\df

-- Décrire une table
\d nom_table

-- Voir les index d'une table
\di nom_table*

-- Historique des requêtes
-- Utiliser les flèches ↑ ↓

-- Quitter
\q
```

### 9.2 Requêtes de Monitoring

```sql
-- Taille de la base
SELECT pg_size_pretty(pg_database_size('elisaschool'));

-- Taille des tables (top 10)
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Connexions actives
SELECT count(*) FROM pg_stat_activity WHERE datname = 'elisaschool';

-- Requêtes lentes (> 1s)
SELECT 
    pid,
    now() - query_start AS duration,
    query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '1 second'
ORDER BY duration DESC;

-- Cache hit ratio (devrait être > 99%)
SELECT 
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

---

## ✅ Checklist de Vérification

Avant de commencer à travailler sur la base de données :

- [ ] Docker Compose est démarré (`docker compose ps`)
- [ ] PostgreSQL est healthy (`docker ps | grep elisaschool_db`)
- [ ] Le port 7002 est accessible (`nc -zv localhost 7002`)
- [ ] Les identifiants sont corrects (vérifier `.env`)
- [ ] Test de connexion réussi (`psql -h localhost -p 7002 -U elisaschool_user -d elisaschool`)
- [ ] pgAdmin est accessible (`http://localhost:7004`)

---

## 🎯 Résumé Express

| Pour... | Utilisez... | Commande/URL |
|---------|-------------|--------------|
| **CLI rapide** | psql | `PGPASSWORD=elisaschool_password psql -h localhost -p 7002 -U elisaschool_user -d elisaschool` |
| **Interface web** | pgAdmin | `http://localhost:7004` (admin@elisaschool.cm / admin123) |
| **App GUI** | DBeaver/DataGrip | Host: localhost, Port: 7002, User: elisaschool_user |
| **Depuis Docker** | Conteneur backend | Host: `postgres`, Port: 7002 |
| **À distance** | SSH Tunnel | `ssh -L 7002:localhost:7002 user@serveur` puis psql local |

---

**Auteur** : franck arlos chendjou  
**Version** : 1.0.0  
**Dernière mise à jour** : 28 juin 2026
