# Guide d'Accès Réseau Local - eLISAschool

> **Version**: 1.0.0  
> **Objectif**: Accéder à eLISAschool depuis n'importe quelle machine du réseau local

---

## 🌐 Configuration Réseau

### Architecture

```
┌─────────────────────────────────────────────────────┐
│              RÉSEAU LOCAL (LAN)                      │
│                                                      │
│  IP Serveur: 10.0.0.101 (exemple)                   │
│                                                      │
│  ┌──────────────────────────────────────┐            │
│  │  SERVEUR eLISAschool                 │            │
│  │  IP: 10.0.0.101                      │            │
│  │                                      │            │
│  │  Backend:  0.0.0.0:7000              │            │
│  │  Frontend: 0.0.0.0:7001              │            │
│  │  DB:       0.0.0.0:7002              │            │
│  │  Redis:    0.0.0.0:7003              │            │
│  │  pgAdmin:  0.0.0.0:7004              │            │
│  └──────────────────────────────────────┘            │
│           ↑                    ↑                     │
│           │                    │                     │
│  ┌────────┴──────┐    ┌───────┴────────┐            │
│  │ Machine A     │    │ Machine B      │            │
│  │ 10.0.0.50     │    │ 10.0.0.102     │            │
│  └───────────────┘    └────────────────┘            │
└─────────────────────────────────────────────────────┘
```

### Configuration Active

**docker-compose.yml** :
```yaml
ports:
  - "0.0.0.0:${APP_PORT:-7000}:7000"      # Backend
  - "0.0.0.0:${FRONTEND_PORT:-7001}:7001" # Frontend
```

**✅ `0.0.0.0`** signifie : écouter sur **TOUTES** les interfaces réseau (localhost + LAN)

---

## 🚀 Accès depuis une Autre Machine

### Étape 1: Trouver l'IP du Serveur

**Sur le serveur eLISAschool** :
```bash
# Linux
ip addr show | grep "inet " | grep -v 127.0.0.1
# ou
hostname -I

# Exemple sortie: 10.0.0.101 172.17.0.1
# → IP à utiliser: 10.0.0.101
```

### Étape 2: Configurer CORS

**Fichier** : `/mnt/DONNEES/projets/eLISAschool/.env`

```bash
# Ajouter l'IP du serveur aux origines autorisées
ALLOWED_ORIGINS=http://localhost:7001,http://10.0.0.101:7001
FRONTEND_URL=http://10.0.0.101:7001
```

**Redémarrer** :
```bash
cd /mnt/DONNEES/projets/eLISAschool
docker compose restart backend frontend
```

### Étape 3: Accéder depuis une Autre Machine

**Sur Machine A (10.0.0.50)** :
```
Navigateur → http://10.0.0.101:7001
```

**Sur Machine B (10.0.0.102)** :
```
Navigateur → http://10.0.0.101:7001
```

### Étape 4: Tester la Connectivité

**Depuis une machine cliente** :
```bash
# Test backend
curl http://10.0.0.101:7000/api/health

# Test frontend
curl -I http://10.0.0.101:7001/
```

---

## 🔧 Configuration Multi-IP

### Plusieurs IP sur le Serveur

Si le serveur a plusieurs interfaces réseau :

```bash
# Voir toutes les IPs
ip addr show

# Exemple:
# eth0: 10.0.0.101 (LAN principal)
# wlan0: 192.168.1.50 (WiFi)
# docker0: 172.17.0.1 (Docker bridge)
```

**Configuration** :
```bash
# .env - Autoriser toutes les IPs
ALLOWED_ORIGINS=http://localhost:7001,http://10.0.0.101:7001,http://192.168.1.50:7001
```

### Accès depuis l'Extérieur (Internet)

**⚠️ Nécessite** :
1. IP publique fixe ou DynDNS
2. Configuration routeur (port forwarding)
3. Certificat SSL (Let's Encrypt)
4. Reverse proxy (Nginx/Traefik)

**Exemple avec Nginx** :
```nginx
server {
    listen 80;
    server_name elisaschool.example.com;

    location / {
        proxy_pass http://localhost:7001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:7000;
        proxy_set_header Host $host;
    }
}
```

---

## 🛡️ Sécurité Réseau

### Firewall (UFW)

**Autoriser les ports nécessaires** :
```bash
# Backend API
sudo ufw allow 7000/tcp comment 'eLISAschool Backend'

# Frontend
sudo ufw allow 7001/tcp comment 'eLISAschool Frontend'

# PostgreSQL (optionnel, pour admin distant)
sudo ufw allow from 10.0.0.0/24 to any port 7002 comment 'PostgreSQL LAN only'

# pgAdmin (optionnel)
sudo ufw allow from 10.0.0.0/24 to any port 7004 comment 'pgAdmin LAN only'

# Vérifier
sudo ufw status
```

### Restriction par IP (Optionnel)

**docker-compose.yml** - Limiter au LAN :
```yaml
ports:
  # Au lieu de 0.0.0.0, spécifier le subnet
  - "10.0.0.101:7000:7000"  # Uniquement accessible depuis cette IP
  - "10.0.0.101:7001:7001"
```

---

## 📱 Accès Mobile

### Smartphone/Tablette sur le Même WiFi

1. **Connecter le mobile au même WiFi** que le serveur
2. **Trouver l'IP du serveur** (ex: 10.0.0.101)
3. **Ouvre le navigateur mobile** :
   ```
   http://10.0.0.101:7001
   ```

### PWA (Progressive Web App)

L'application peut être installée sur mobile :

1. Ouvrir `http://10.0.0.101:7001`
2. Menu navigateur → "Ajouter à l'écran d'accueil"
3. L'app fonctionne comme une app native

---

## 🐛 Troubleshooting

### Problème 1: "Connexion refusée"

**Diagnostic** :
```bash
# Sur le serveur
netstat -tlnp | grep 7001
# Doit afficher: 0.0.0.0:7001

# Si affiché 127.0.0.1:7001 → problème de config
```

**Solution** :
```bash
# Vérifier docker-compose.yml
grep "0.0.0.0" docker-compose.yml

# Redémarrer
docker compose up -d --force-recreate frontend backend
```

### Problème 2: Erreur CORS

**Symptôme** :
```
Access to fetch at 'http://10.0.0.101:7000/api/...' 
from origin 'http://10.0.0.101:7001' has been blocked by CORS policy
```

**Solution** :
```bash
# .env - Ajouter l'IP
ALLOWED_ORIGINS=http://localhost:7001,http://10.0.0.101:7001

# Redémarrer backend
docker compose restart backend
```

### Problème 3: Frontend charge mais pas de données

**Cause** : Le frontend utilise toujours `localhost` pour appeler le backend

**Vérification** :
```bash
# Dans le navigateur (F12 → Network)
# Vérifier l'URL des requêtes API
# Doit être: http://10.0.0.101:7000/api/...
# Pas: http://localhost:7000/api/...
```

**Solution** :
```bash
# docker-compose.yml - VITE_API_URL correct
environment:
  VITE_API_URL: http://backend:7000  # Pour Docker

# Redémarrer frontend (rebuild nécessaire)
docker compose up -d --force-recreate frontend
```

### Problème 4: Lentesse réseau

**Diagnostic** :
```bash
# Test latence
ping 10.0.0.101

# Test débit
iperf3 -s  # Sur serveur
iperf3 -c 10.0.0.101  # Sur client
```

**Optimisations** :
1. **Backend** : Activer gzip compression
2. **Frontend** : Activer cache navigateur
3. **Base de données** : Index sur colonnes fréquentes
4. **Images** : Compression avant upload

---

## ✅ Checklist de Configuration

- [ ] IP du serveur identifiée (ex: 10.0.0.101)
- [ ] `docker-compose.yml` utilise `0.0.0.0` pour les ports
- [ ] `.env` contient `ALLOWED_ORIGINS` avec l'IP du serveur
- [ ] Firewall autorise les ports 7000-7001
- [ ] Test depuis une autre machine réussi
- [ ] Test mobile sur le même WiFi réussi
- [ ] Pas d'erreur CORS dans la console navigateur

---

## 🔗 URLs d'Accès

| Service | Local | Réseau Local |
|---------|-------|--------------|
| **Frontend** | http://localhost:7001 | http://10.0.0.101:7001 |
| **Backend API** | http://localhost:7000 | http://10.0.0.101:7000 |
| **pgAdmin** | http://localhost:7004 | http://10.0.0.101:7004 |
| **API Health** | http://localhost:7000/api/health | http://10.0.0.101:7000/api/health |

---

## 📊 Performance Attendue

| Métrique | Localhost | Réseau Local (LAN) |
|----------|-----------|-------------------|
| **Latence** | < 5ms | 1-10ms |
| **Temps chargement page** | < 500ms | 500-1500ms |
| **API response** | < 100ms | 100-300ms |
| **HMR detection** | < 200ms | 200-500ms |

**Optimisations actives** :
- ✅ Compression gzip activée (backend)
- ✅ Cache navigateur (PWA)
- ✅ HMR avec polling (frontend)
- ✅ Index base de données
- ✅ Connexions pool PostgreSQL

---

## 🎯 Résumé

**Pour accéder depuis une autre machine** :

1. **Trouver l'IP du serveur** : `hostname -I` → `10.0.0.101`
2. **Configurer CORS** : `ALLOWED_ORIGINS=http://localhost:7001,http://10.0.0.101:7001`
3. **Redémarrer** : `docker compose restart backend frontend`
4. **Accéder** : `http://10.0.0.101:7001` depuis n'importe quelle machine du réseau

**C'est tout !** 🚀
