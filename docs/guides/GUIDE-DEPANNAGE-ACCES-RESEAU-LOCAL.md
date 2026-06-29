# 🔧 Guide Dépannage - Accès Réseau Local Multi-Machine

> **Version:** 2.0.0  
> **Date:** 28 juin 2026  
> **Auteur:** franck arlos chendjou

---

## 🐛 Problème Rencontré

**Symptômes :**
```
POST http://172.18.0.1:7000/api/auth/login
net::ERR_CONNECTION_REFUSED

Erreur de connexion, vérifiez votre connexion internet
```

**Contexte :**
- Serveur eLISAschool : `10.0.0.1`
- Machine cliente : `10.0.0.101`
- Les deux machines sont sur le même réseau local

---

## 🎯 Cause Racine

**`172.18.0.1` est l'IP de la gateway Docker**, qui est :
- ✅ Accessible **depuis l'hôte lui-même** (10.0.0.1)
- ❌ **INaccessible depuis d'autres machines** du réseau local (10.0.0.101)

**Pourquoi ?**
- `172.18.0.1` est une adresse privée Docker interne
- Elle n'existe que sur l'hôte Docker, pas sur le réseau local
- Quand une machine externe (10.0.0.101) essaie d'atteindre `172.18.0.1`, elle cherche cette IP sur **son propre réseau**, où elle n'existe pas

---

## ✅ Solution

### Règle d'Or

**TOUJOURS utiliser l'IP du serveur sur le réseau local, JAMAIS la gateway Docker (172.18.0.1)**

```bash
# ❌ INCORRECT (inaccessible depuis le réseau)
VITE_API_URL=http://172.18.0.1:7000

# ✅ CORRECT (accessible depuis toutes les machines du réseau)
VITE_API_URL=http://10.0.0.1:7000
```

---

## 🚀 Configuration Correcte

### Étape 1 : Trouver l'IP du Serveur

```bash
# Sur le serveur eLISAschool
hostname -I | awk '{print $1}'

# Résultat attendu : 10.0.0.1 (ou similaire)
```

### Étape 2 : Configurer frontend/.env.local

```bash
# Sur le serveur
cd /mnt/DONNEES/projets/eLISAschool

# Créer/modifier .env.local
cat > frontend/.env.local << EOF
# URL du backend - IP du serveur sur le réseau local
VITE_API_URL=http://10.0.0.1:7000
EOF

# Vérifier
cat frontend/.env.local
```

### Étape 3 : Configurer les CORS

```bash
# Dans .env
ALLOWED_ORIGINS=http://localhost:7001,http://127.0.0.1:7001,http://0.0.0.0:7001,http://10.0.0.1:7001
```

### Étape 4 : Redémarrer le Frontend

```bash
# IMPORTANT: Supprimer le cache Vite
docker exec elisaschool_frontend sh -c "rm -rf /app/node_modules/.vite"

# Redémarrer
docker compose restart frontend

# Attendre 15 secondes
sleep 15
```

### Étape 5 : Tester

```bash
# Depuis le serveur
curl -s http://10.0.0.1:7001/api/health

# Depuis une autre machine (10.0.0.101)
# Ouvrir dans le navigateur : http://10.0.0.1:7001
```

---

## 🔧 Script de Configuration Automatique

```bash
# Rendre le script exécutable
chmod +x scripts/config-acces-reseau-local.sh

# Exécuter
./scripts/config-acces-reseau-local.sh
```

**Ce que fait le script :**
1. ✅ Détecte automatiquement l'IP du serveur
2. ✅ Configure `frontend/.env.local` avec la bonne IP
3. ✅ Met à jour les CORS dans `.env`
4. ✅ Nettoie le cache Vite
5. ✅ Redémarre le frontend
6. ✅ Teste la connectivité
7. ✅ Affiche les URLs d'accès

---

## 📊 Architecture de Connexion

### ❌ Incorrect (172.18.0.1)

```
Machine cliente (10.0.0.101)
    ↓ Tente: http://172.18.0.1:7000
    ❌ ERREUR: 172.18.0.1 n'existe pas sur ce réseau
    ❌ net::ERR_CONNECTION_REFUSED
```

### ✅ Correct (10.0.0.1)

```
Machine cliente (10.0.0.101)
    ↓ Tente: http://10.0.0.1:7001
Serveur (10.0.0.1)
    ↓ Frontend reçoit la requête
    ↓ Fetch: http://10.0.0.1:7000/api/auth/login
    ↓ Backend reçoit et répond
    ✅ Connexion réussie !
```

---

## 🧪 Tests de Validation

### Test 1 : Depuis le Serveur

```bash
# Backend
curl -s http://localhost:7000/api/health
# Attendu: {"success":true,...}

# Frontend
curl -s http://localhost:7001/api/health
# Attendu: {"success":true,...}

# Login
curl -s http://localhost:7001/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"identifiant":"test","motDePasse":"test"}'
# Attendu: {"success":false,"error":{"code":"VALIDATION_ERROR"}}
```

### Test 2 : Depuis une Autre Machine

```bash
# Sur la machine 10.0.0.101

# Backend
curl -s http://10.0.0.1:7000/api/health
# Attendu: {"success":true,...}

# Frontend
curl -s http://10.0.0.1:7001
# Attendu: Code HTML de la page d'accueil

# Dans le navigateur
# Ouvrir: http://10.0.0.1:7001
# Attendu: Page de login eLISAschool s'affiche
```

### Test 3 : Depuis le Navigateur (Machine Distante)

1. **Ouvrir** : `http://10.0.0.1:7001`
2. **Vérifier** : La page de login s'affiche
3. **Ouvrir la console** (F12)
4. **Essayer de se connecter**
5. **Vérifier les erreurs** :
   - ✅ Pas d'erreur `ERR_CONNECTION_REFUSED`
   - ✅ Pas d'erreur `500 Internal Server Error`
   - ❌ Erreur `INVALID_CREDENTIALS` est normale (mauvais login)

---

## 🐛 Troubleshooting

### Problème 1 : Toujours ERR_CONNECTION_REFUSED

**Vérification :**
```bash
# 1. Vérifier .env.local
cat frontend/.env.local
# Doit contenir: VITE_API_URL=http://10.0.0.1:7000
# PAS: VITE_API_URL=http://172.18.0.1:7000

# 2. Vérifier que le cache est supprimé
docker exec elisaschool_frontend ls -la /app/node_modules/.vite
# Doit retourner: No such file or directory

# 3. Vérifier les logs
docker logs elisaschool_frontend 2>&1 | grep "VITE_API_URL"
```

**Solution :**
```bash
# Recréer .env.local
cat > frontend/.env.local << EOF
VITE_API_URL=http://10.0.0.1:7000
EOF

# Supprimer le cache
docker exec elisaschool_frontend sh -c "rm -rf /app/node_modules/.vite"

# Redémarrer
docker compose restart frontend
sleep 15
```

### Problème 2 : CORS Error

**Symptôme :**
```
Access to fetch at 'http://10.0.0.1:7000/api/auth/login' from origin 
'http://10.0.0.1:7001' has been blocked by CORS policy
```

**Solution :**
```bash
# Ajouter l'IP dans .env
ALLOWED_ORIGINS=http://localhost:7001,http://127.0.0.1:7001,http://0.0.0.0:7001,http://10.0.0.1:7001

# Redémarrer le backend
docker compose restart backend
```

### Problème 3 : Page Blanche ou Erreur de Chargement

**Cause :** Le navigateur a mis en cache l'ancienne version avec `172.18.0.1`

**Solution :**
```bash
# Sur la machine cliente (10.0.0.101)

# Option 1: Hard refresh
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Option 2: Vider le cache du navigateur
# Chrome: Paramètres > Confidentialité > Effacer les données de navigation
# Firefox: Options > Vie privée > Effacer l'historique

# Option 3: Navigation privée
Ctrl + Shift + P (Windows/Linux)
Cmd + Shift + P (Mac)
```

### Problème 4 : Firewall Bloque les Ports

**Symptôme :**
```
curl: (7) Failed to connect to 10.0.0.1 port 7000: Connexion refusée
```

**Solution :**
```bash
# Sur le serveur (10.0.0.1)

# Vérifier le firewall
sudo ufw status

# Ouvrir les ports
sudo ufw allow 7000:7004/tcp
sudo ufw reload

# Ou avec iptables
sudo iptables -A INPUT -p tcp --dport 7000:7004 -j ACCEPT
```

### Problème 5 : IP du Serveur a Changé

**Symptôme :** L'IP n'est plus `10.0.0.1`

**Solution :**
```bash
# Trouver la nouvelle IP
hostname -I | awk '{print $1}'
# Exemple: 10.0.0.5

# Mettre à jour .env.local
cat > frontend/.env.local << EOF
VITE_API_URL=http://10.0.0.5:7000
EOF

# Mettre à jour .env (CORS)
sed -i 's|http://10.0.0.1:|http://10.0.0.5:|g' .env

# Redémarrer
docker exec elisaschool_frontend sh -c "rm -rf /app/node_modules/.vite"
docker compose down
docker compose up -d
```

---

## 📝 Checklist de Vérification

Avant de tester depuis une autre machine :

- [ ] `frontend/.env.local` contient `VITE_API_URL=http://10.0.0.1:7000`
- [ ] **PAS** `VITE_API_URL=http://172.18.0.1:7000`
- [ ] Cache Vite supprimé : `rm -rf frontend/node_modules/.vite`
- [ ] Frontend redémarré : `docker compose restart frontend`
- [ ] Backend accessible : `curl http://10.0.0.1:7000/api/health`
- [ ] Frontend accessible : `curl http://10.0.0.1:7001`
- [ ] CORS configurés dans `.env`
- [ ] Firewall ouvert (ports 7000-7004)
- [ ] Navigateur cache vidé (sur machine cliente)

---

## 🎯 Commandes Rapides

### Reconfiguration Complète

```bash
# Script automatique
./scripts/config-acces-reseau-local.sh
```

### Reconfiguration Manuelle

```bash
# 1. Trouver l'IP
hostname -I | awk '{print $1}'

# 2. Configurer
cat > frontend/.env.local << EOF
VITE_API_URL=http://$(hostname -I | awk '{print $1}'):7000
EOF

# 3. Nettoyer et redémarrer
docker exec elisaschool_frontend sh -c "rm -rf /app/node_modules/.vite"
docker compose restart frontend
sleep 15

# 4. Tester
curl -s http://localhost:7001/api/health | jq
```

### Vérification Rapide

```bash
# Tout vérifier en une commande
echo "=== IP du serveur ===" && \
hostname -I | awk '{print $1}' && \
echo "" && \
echo "=== .env.local ===" && \
cat frontend/.env.local && \
echo "" && \
echo "=== Tests ===" && \
echo -n "Backend local: " && curl -s http://localhost:7000/api/health | jq -r '.success' && \
echo -n "Backend réseau: " && curl -s http://$(hostname -I | awk '{print $1}'):7000/api/health | jq -r '.success' && \
echo -n "Frontend local: " && curl -s -o /dev/null -w "%{http_code}" http://localhost:7001 && \
echo "" && \
echo -n "Frontend réseau: " && curl -s -o /dev/null -w "%{http_code}" http://$(hostname -I | awk '{print $1}'):7001 && \
echo ""
```

---

## 📚 Ressources

- **Documentation Docker Network :** https://docs.docker.com/network/
- **Vite Environment Variables :** https://vitejs.dev/guide/env-and-mode.html
- **CORS Express :** https://github.com/expressjs/cors
- **Script de configuration :** `scripts/config-acces-reseau-local.sh`

---

## ⚠️ Règles à Retenir

1. **JAMAIS utiliser `172.18.0.1`** pour l'accès réseau local
2. **TOUJOURS utiliser l'IP du serveur** (ex: `10.0.0.1`)
3. **SUPPRIMER le cache Vite** après chaque modification de `.env.local`
4. **REDÉMARRER le frontend** après modification
5. **VIDER le cache du navigateur** sur les machines clientes
6. **CONFIGURER les CORS** pour l'IP du serveur

---

**Dernière mise à jour :** 28 juin 2026  
**Auteur :** franck arlos chendjou  
**Statut :** ✅ Guide Validé et Testé
