# 🚀 eLISAschool - Guide de Démarrage Rapide

## Installation en 5 minutes

### 1️⃣ Prérequis

```bash
# Vérifier Docker
docker --version
docker compose version

# Si non installé:
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2️⃣ Cloner le Projet

```bash
git clone <repository-url>
cd eLISAschool
```

### 3️⃣ Déploiement Local (Développement)

```bash
cd docker
./deploy.sh local-dev up
```

**✨ C'est tout !** Le script va automatiquement :
- Détecter l'IP de votre serveur
- Générer les secrets (DB, JWT, Redis, Encryption)
- Configurer les CORS
- Démarrer tous les services
- Vérifier la connectivité

### 4️⃣ Accéder à l'Application

```
🌐 Frontend: http://<VOTRE_IP>:7001
🔌 Backend:  http://<VOTRE_IP>:7000
🗄️  pgAdmin:   http://<VOTRE_IP>:7004
```

### 5️⃣ Premier Login

```
Email: admin@elisaschool.cm
Mot de passe: admin123
```

⚠️ **Changez ce mot de passe immédiatement !**

---

## 📋 Commandes Utiles

```bash
# Voir les logs
cd docker
./deploy.sh local-dev logs
./deploy.sh local-dev logs backend
./deploy.sh local-dev logs frontend

# État des services
./deploy.sh local-dev status

# Redémarrer
./deploy.sh local-dev restart

# Arrêter
./deploy.sh local-dev down

# Reconstruire from scratch
./deploy.sh local-dev rebuild
```

---

## 💾 Backups

### Backup Manuel

```bash
cd docker/scripts
./backup-manuel.sh avant_maj_v1.1
```

### Restaurer un Backup

```bash
cd docker/scripts
./restore.sh ../backups/manual/elisaschool_manual_avant_maj_v1.1_20260627.sql.gz
```

### Backup Automatique

Installé par défaut via cron (2h du matin) :

```bash
# Installer le cron
crontab docker/scripts/cron-backup.txt

# Vérifier
crontab -l
```

**Rotation automatique :**
- Daily : 7 jours
- Weekly : 4 semaines
- Monthly : 12 mois

---

## 🔄 Mises à Jour

```bash
cd docker/scripts

# Vérifier
./update.sh check

# Voir changements
./update.sh preview

# Appliquer (avec backup auto + rollback si échec)
./update.sh apply

# Historique
./update.sh history
```

---

## 🌐 Déploiement Production Locale

```bash
cd docker
./deploy.sh local-prod up
```

**Différences avec le mode dev :**
- ❌ Pas de hot-reload
- ✅ Images optimisées
- ✅ Resource limits (CPU, RAM)
- ✅ Logs level: info (pas debug)
- ✅ Performance maximale

---

## ☁️ Déploiement Cloud

### Configuration

Éditer `docker/.env.cloud` :

```bash
DOMAIN_NAME=app.mon-ecole.cm
ADMIN_EMAIL=admin@mon-ecole.cm
```

### Déploiement

```bash
cd docker
./deploy.sh cloud-prod up
```

**SSL automatique avec Let's Encrypt !**

---

## 🐛 Dépannage

### Les services ne démarrent pas ?

```bash
# Voir les logs
./deploy.sh local-dev logs

# Vérifier l'espace disque
df -h

# Redémarrer from scratch
./deploy.sh local-dev down
./deploy.sh local-dev rebuild
```

### Erreur de connexion frontend → backend ?

```bash
# Vérifier l'IP détectée
./deploy.sh local-dev status

# Forcer une IP manuelle
# Éditer docker/.env.local
HOST_IP=192.168.1.100
```

### Base de données corrompue ?

```bash
# Restaurer le dernier backup
cd docker/scripts
./restore.sh ../backups/daily/elisaschool_daily_$(date -d yesterday +%Y%m%d).sql.gz
```

---

## 📊 Monitoring

### Endpoints Backend

```
GET http://<IP>:7000/api/monitoring/health    # Santé globale
GET http://<IP>:7000/api/monitoring/metrics   # Métriques système
GET http://<IP>:7000/api/monitoring/backups   # Statut backups
GET http://<IP>:7000/api/monitoring/updates   # Version et updates
```

### Métriques Docker

```bash
# Utilisation ressources
docker stats

# Logs détaillés
docker logs elisaschool_backend
docker logs elisaschool_frontend
```

---

## 🔐 Sécurité

### Secrets

Les secrets sont **générés automatiquement** au premier démarrage :
- `DB_PASSWORD` (32 caractères)
- `JWT_SECRET` (64 caractères)
- `REDIS_PASSWORD` (32 caractères)
- `ENCRYPTION_KEY` (32 caractères)

⚠️ **CONSERVEZ PRÉCIEUSEMENT `docker/.env.local` !**

### Validation Production

En mode production, le script valide :
- ✅ JWT_SECRET ≥ 64 caractères
- ✅ DB_PASSWORD ≥ 16 caractères
- ✅ ENCRYPTION_KEY ≥ 32 caractères

---

## 📚 Documentation Complète

- **Architecture Docker** : `docker/README.md`
- **Conventions Backend** : `.qoder/rules/elisaschool-conventions.md`
- **Conventions Frontend** : `.qoder/rules/elisaschool-frontend.md`
- **Logique Métier** : Skill `/elisaschool-business-logic`

---

## 🆘 Support

- **GitHub Issues** : <repository-url>/issues
- **Documentation** : <repository-url>/docs
- **Email** : support@elisaschool.cm

---

**Version :** 1.0.0  
**Dernière mise à jour :** 2026-06-27  
**Auteur :** franck arlos chendjou
