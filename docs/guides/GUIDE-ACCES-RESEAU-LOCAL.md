# 🌐 Guide Accès Réseau Local Multi-Machine - eLISAschool

> **Version:** 1.0.0  
> **Date:** 27 juin 2026  
> **Auteur:** franck arlos chendjou

---

## 📋 Vue d'Ensemble

Ce guide explique comment configurer eLISAschool pour être accessible depuis **n'importe quelle machine du réseau local** en développement.

### 🎯 Objectifs

- ✅ Accès depuis la machine serveur (localhost)
- ✅ Accès depuis d'autres machines du réseau local (LAN)
- ✅ Déploiement automatique après recréation des conteneurs
- ✅ CORS configurés pour le réseau local
- ✅ Détection automatique de l'IP

---

## 🚀 Configuration Automatique (Recommandé)

### Étape 1 : Exécuter le script de configuration

```bash
# Se placer à la racine du projet
cd /mnt/DONNEES/projets/eLISAschool

# Rendre le script exécutable
chmod +x scripts/config-reseau-multi-machine.sh

# Exécuter le script
./scripts/config-reseau-multi-machine.sh
```

**Ce que fait le script :**
1. ✅ Détecte automatiquement l'IP du serveur
2. ✅ Configure `.env` avec les bonnes URLs
3. ✅ Affiche les URLs d'accès pour toutes les machines
4. ✅ Fournit les commandes de firewall si nécessaire
5. ✅ Teste la connectivité

### Étape 2 : Redémarrer les conteneurs

```bash
# Arrêter les conteneurs
docker compose down

# Redémarrer (déploiement automatique inclus)
docker compose up -d
```

**Déploiement automatique :**
- ✅ Installation des dépendances si nécessaire
- ✅ Exécution des migrations
- ✅ Vérification/création des seeds
- ✅ Démarrage avec hot-reload

### Étape 3 : Tester l'accès

```bash
# Depuis la machine serveur
curl http://localhost:7000/api/health
curl http://localhost:7001

# Depuis une autre machine du réseau
curl http://IP_DU_SERVEUR:7000/api/health
curl http://IP_DU_SERVEUR:7001
```

---

## 📊 URLs d'Accès

### Machine Serveur (localhost)

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:7001 | 7001 |
| Backend API | http://localhost:7000 | 7000 |
| pgAdmin | http://localhost:7004 | 7004 |
| PostgreSQL | localhost:7002 | 7002 |
| Redis | localhost:7003 | 7003 |

### Autres Machines du Réseau Local

| Service | URL | Exemple |
|---------|-----|---------|
| Frontend | http://IP_DU_SERVEUR:7001 | http://192.168.1.100:7001 |
| Backend API | http://IP_DU_SERVEUR:7000 | http://192.168.1.100:7000 |
| pgAdmin | http://IP_DU_SERVEUR:7004 | http://192.168.1.100:7004 |

---

## 🔧 Configuration Manuelle

### 1. Déterminer l'IP du serveur

```bash
# Linux
ip route get 1.1.1.1 | awk '{print $7; exit}'

# Ou
hostname -I | awk '{print $1}'

# macOS
ipconfig getifaddr en0
```

### 2. Configurer .env

```bash
# Éditer .env
nano .env

# Modifier ces lignes :
ALLOWED_ORIGINS=http://localhost:7001,http://127.0.0.1:7001,http://0.0.0.0:7001,http://VOTRE_IP:7001

# Exemple concret :
ALLOWED_ORIGINS=http://localhost:7001,http://127.0.0.1:7001,http://0.0.0.0:7001,http://192.168.1.100:7001
```

### 3. Redémarrer

```bash
docker compose down
docker compose up -d
```

---

## 🔄 Déploiement Automatique

### Fonctionnement

Après chaque recréation de conteneur backend, le script suivant s'exécute automatiquement :

```bash
#!/bin/bash
# Script exécuté dans docker-compose.yml

# 1. Vérifier/installer les dépendances
if [ ! -d 'node_modules' ]; then
    npm install
fi

# 2. Exécuter les migrations
npm run migration:run

# 3. Vérifier/créer les seeds
npx ts-node src/database/seeds/run-seeds.ts

# 4. Démarrer nodemon (hot-reload)
npx nodemon --config nodemon.json
```

### Logs

```bash
# Voir les logs du backend (inclut le déploiement)
docker logs -f elisaschool_backend

# Exemple de sortie :
# 🚀 Démarrage du backend eLISAschool...
# 📦 Vérification des dépendances...
# ✅ Dépendances déjà installées
# 🔄 Exécution des migrations...
# ✅ 0 migrations exécutées
# 🌱 Vérification des seeds...
# ✅ Seeds déjà exécutés
# ✅ Backend prêt, démarrage de nodemon...
```

---

## 🔒 Configuration du Firewall

### Ubuntu/Debian (UFW)

```bash
# Ouvrir les ports
sudo ufw allow 7000:7004/tcp

# Recharger
sudo ufw reload

# Vérifier
sudo ufw status
```

### CentOS/RHEL (firewalld)

```bash
# Ouvrir les ports
sudo firewall-cmd --permanent --add-port=7000-7004/tcp

# Recharger
sudo firewall-cmd --reload

# Vérifier
sudo firewall-cmd --list-ports
```

### iptables (Toutes distributions)

```bash
# Ouvrir les ports
sudo iptables -A INPUT -p tcp --dport 7000:7004 -j ACCEPT

# Sauvegarder (Ubuntu/Debian)
sudo iptables-save | sudo tee /etc/iptables/rules.v4

# Ou (CentOS/RHEL)
sudo service iptables save
```

---

## 🧪 Tests de Connectivité

### Test 1 : Depuis la machine serveur

```bash
# Backend
curl -s http://localhost:7000/api/health | jq

# Frontend
curl -s http://localhost:7001 | head -20

# pgAdmin
curl -s http://localhost:7004 | head -20
```

### Test 2 : Depuis une autre machine

```bash
# Sur une AUTRE machine du réseau local

# Backend
curl -s http://IP_DU_SERVEUR:7000/api/health

# Frontend
# Ouvrir dans le navigateur : http://IP_DU_SERVEUR:7001

# pgAdmin
# Ouvrir dans le navigateur : http://IP_DU_SERVEUR:7004
```

### Test 3 : Depuis le conteneur frontend

```bash
# Accéder au conteneur frontend
docker exec -it elisaschool_frontend sh

# Tester l'accès au backend
wget -qO- http://backend:7000/api/health

# Sortir du conteneur
exit
```

---

## 🐛 Troubleshooting

### Problème 1 : CORS Error

**Symptôme :**
```
Access to fetch at 'http://localhost:7000/api/auth/login' from origin 'http://192.168.1.50:7001' 
has been blocked by CORS policy
```

**Solution :**
```bash
# 1. Ajouter l'IP à ALLOWED_ORIGINS dans .env
ALLOWED_ORIGINS=http://localhost:7001,http://192.168.1.50:7001

# 2. Redémarrer le backend
docker compose restart backend
```

### Problème 2 : Conteneur inaccessible depuis le réseau

**Symptôme :**
```
curl: (7) Failed to connect to IP_DU_SERVEUR port 7000: Connection refused
```

**Diagnostic :**
```bash
# 1. Vérifier que les ports sont exposés
docker compose ps

# 2. Vérifier le binding
netstat -tlnp | grep 7000
# Devrait afficher: 0.0.0.0:7000 (pas 127.0.0.1:7000)

# 3. Vérifier le firewall
sudo ufw status
# ou
sudo iptables -L -n
```

**Solution :**
```bash
# Vérifier docker-compose.yml
# Les ports doivent être : "0.0.0.0:7000:7000" (pas "127.0.0.1:7000:7000")

# Redémarrer
docker compose down
docker compose up -d
```

### Problème 3 : Seeds non exécutés

**Symptôme :**
```
⚠️  Seeds déjà exécutés (mais base vide)
```

**Solution :**
```bash
# Exécuter manuellement
docker exec -w /app/backend elisaschool_backend \
  npx ts-node -r tsconfig-paths/register src/database/seeds/run-seeds.ts

# Ou forcer la recréation
docker compose down -v
docker compose up -d
```

### Problème 4 : Migrations échouées

**Symptôme :**
```
❌ Erreur: relation "xxx" already exists
```

**Solution :**
```bash
# Voir les migrations déjà exécutées
docker exec -w /app/backend elisaschool_backend \
  npx typeorm migration:show

# Revenir en arrière si nécessaire
docker exec -w /app/backend elisaschool_backend \
  npm run migration:revert

# Re-exécuter
docker exec -w /app/backend elisaschool_backend \
  npm run migration:run
```

---

## 📝 Fichiers Modifiés

### docker-compose.yml

**Backend :**
- ✅ Commande de démarrage avec déploiement automatique
- ✅ CORS élargis pour réseau local
- ✅ Installation auto des dépendances
- ✅ Exécution auto des migrations
- ✅ Vérification auto des seeds

**Frontend :**
- ✅ Détection automatique de l'IP du serveur
- ✅ Configuration dynamique de VITE_API_URL
- ✅ Binding sur 0.0.0.0 (toutes les interfaces)

### .env

```bash
# CORS multi-machine
ALLOWED_ORIGINS=http://localhost:7001,http://127.0.0.1:7001,http://0.0.0.0:7001,http://IP_DU_SERVEUR:7001
```

### scripts/config-reseau-multi-machine.sh

- ✅ Script de configuration automatique
- ✅ Détection de l'IP du serveur
- ✅ Configuration de .env
- ✅ Tests de connectivité
- ✅ Instructions de firewall

---

## 🎯 Cas d'Utilisation

### Cas 1 : Développement en équipe

```
Serveur de développement (192.168.1.100)
├── Développeur 1: http://192.168.1.101 → Frontend/Backend
├── Développeur 2: http://192.168.1.102 → Frontend/Backend
├── Développeur 3: http://192.168.1.103 → Frontend/Backend
└── Testeur QA:      http://192.168.1.104 → Frontend uniquement
```

### Cas 2 : Démonstration client

```
Votre laptop (192.168.1.50)
├── Client tablette: http://192.168.1.50:7001 → Accès frontend
├── Client mobile:   http://192.168.1.50:7001 → Accès frontend
└── Client desktop:  http://192.168.1.50:7001 → Accès frontend
```

### Cas 3 : Tests multi-navigateurs

```
Machine de test (192.168.1.200)
├── Chrome:      http://192.168.1.200:7001
├── Firefox:     http://192.168.1.200:7001
├── Safari:      http://192.168.1.200:7001
└── Edge:        http://192.168.1.200:7001
```

---

## 📊 Vérification Finale

```bash
# Checklist de vérification
echo "✅ Configuration Multi-Machine - Vérification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Docker en cours d'exécution
docker ps | grep elisaschool

# 2. Ports ouverts (0.0.0.0)
netstat -tlnp | grep -E "700[0-4]"

# 3. Backend accessible
curl -s http://localhost:7000/api/health | jq .success

# 4. Frontend accessible
curl -s -o /dev/null -w "%{http_code}" http://localhost:7001

# 5. CORS configurés
grep ALLOWED_ORIGINS .env

# 6. Seeds exécutés
docker exec -w /app/backend elisaschool_backend \
  npx ts-node -r tsconfig-paths/register src/database/seeds/check-seeds-status.ts

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Tout est configuré!"
```

---

## 📚 Ressources

- **Docker Compose Docs:** https://docs.docker.com/compose/
- **CORS:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **Express CORS:** https://github.com/expressjs/cors
- **Vite Server Options:** https://vitejs.dev/config/server-options.html

---

## 📝 Historique des Modifications

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0.0 | 27/06/2026 | - Déploiement automatique backend<br>- Accès réseau multi-machine<br>- Script de configuration<br>- Documentation complète |

---

**Dernière mise à jour :** 27 juin 2026  
**Auteur :** franck arlos chendjou  
**Statut :** ✅ Production Ready
