# 🔧 Configuration Redis - Guide Rapide

## 📋 Résumé

Redis est maintenant configuré pour eLISAschool avec :
- ✅ Cache distribué pour le dashboard
- ✅ Fallback in-memory automatique
- ✅ Support mot de passe (production)
- ✅ Limits de mémoire (256MB)
- ✅ Policy LRU (Least Recently Used)
- ✅ Persistance AOF (Append Only File)

---

## 🚀 Configuration Rapide

### 1. Développement (Docker)

**Fichier `.env` (déjà configuré) :**
```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Tester la connexion :**
```bash
npm run redis:test
```

**Démarrer Redis :**
```bash
npm run docker:dev
```

---

### 2. Développement (Local)

**Installer Redis :**

macOS :
```bash
brew install redis
brew services start redis
```

Ubuntu/Debian :
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

**Modifier `.env` :**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**Tester :**
```bash
npm run redis:test
```

---

### 3. Production

**⚠️ IMPORTANT : Sécuriser Redis**

1. **Définir un mot de passe fort dans `.env` :**
```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=votre_mot_de_passe_tres_securise_32_caracteres
```

2. **Exemples de mots de passe forts :**
```bash
# Générer un mot de passe aléatoire
openssl rand -base64 32

# Ou utiliser un mot de passe d'au moins 32 caractères
REDIS_PASSWORD=pr0d_r3d1s_s3cur3_2024_el1sasch00l!
```

3. **Redémarrer avec la nouvelle config :**
```bash
npm run docker:prod:build
```

4. **Vérifier :**
```bash
npm run redis:test
```

---

## 🔍 Vérification

### Tester manuellement

```bash
# Avec redis-cli
redis-cli -h redis -p 6379 ping
# Devrait retourner : PONG

# Avec mot de passe
redis-cli -h redis -p 6379 -a votre_password ping
```

### Via Docker

```bash
# Vérifier que le container tourne
docker ps | grep redis

# Voir les logs
docker logs elisaschool_redis

# Tester la connexion
docker exec elisaschool_redis redis-cli ping
```

### Dans l'application

Au démarrage de l'application, chercher dans les logs :

```
[Redis] Connecté et prêt
[DashboardCache] Mode: Redis (distribué)
```

Si Redis n'est pas disponible :
```
[DashboardCache] Mode: In-memory (local)
```

---

## 📊 Monitoring

### Statistiques Redis

```bash
# Via redis-cli
redis-cli INFO stats

# Métriques importantes
redis-cli INFO memory    # Utilisation mémoire
redis-cli INFO clients   # Clients connectés
redis-cli INFO server    # Version, uptime
```

### Via l'API eLISAschool

```bash
# Statistiques du service Redis
curl http://localhost:3000/api/monitoring/redis

# Statistiques du cache dashboard
curl http://localhost:3000/api/dashboard/cache/stats
```

---

## ⚙️ Configuration Docker

Redis est configuré dans `docker/docker-compose.yml` :

```yaml
redis:
  image: redis:7-alpine
  command: >
    redis-server
    --appendonly yes              # Persistance
    --requirepass ${REDIS_PASSWORD:-}  # Mot de passe (optionnel)
    --maxmemory 256mb             # Limite mémoire
    --maxmemory-policy allkeys-lru  # Policy LRU
```

### Options de Configuration

| Option | Description | Valeur |
|--------|-------------|--------|
| `--appendonly yes` | Persistance des données | Activé |
| `--requirepass` | Mot de passe | `${REDIS_PASSWORD}` |
| `--maxmemory` | Limite mémoire | `256mb` |
| `--maxmemory-policy` | Policy d'éviction | `allkeys-lru` |

---

## 🛠️ Dépannage

### Redis ne se connecte pas

**1. Vérifier que Redis tourne :**
```bash
docker ps | grep redis
# ou
systemctl status redis-server
```

**2. Vérifier la configuration :**
```bash
cat .env | grep REDIS
```

**3. Tester la connexion :**
```bash
npm run redis:test
```

**4. Redémarrer Redis :**
```bash
# Docker
docker restart elisaschool_redis

# Local
sudo systemctl restart redis-server
```

### Erreur "NOAUTH Authentication required"

Le mot de passe est requis mais non fourni :

```bash
# Vérifier que REDIS_PASSWORD est défini dans .env
cat .env | grep REDIS_PASSWORD

# Redémarrer l'application
npm run dev
```

### Redis consomme trop de mémoire

La limite est fixée à 256MB. Pour l'augmenter :

1. Modifier `docker/docker-compose.yml` :
```yaml
--maxmemory 512mb
```

2. Redémarrer :
```bash
npm run docker:prod:build
```

---

## 📚 Ressources

- [Documentation Redis](https://redis.io/documentation)
- [Redis Security](https://redis.io/docs/manual/security/)
- [Redis Memory Optimization](https://redis.io/docs/manual/optimization/)

---

## ✅ Checklist Production

- [ ] `REDIS_PASSWORD` défini (min 32 caractères)
- [ ] Port Redis non exposé publiquement
- [ ] Limite mémoire configurée (256MB+)
- [ ] Backup Redis activé (AOF)
- [ ] Monitoring configuré
- [ ] Tests de connexion passent
- [ ] Logs Redis surveillés

---

**Version :** 1.0.0  
**Dernière mise à jour :** 6 juin 2026
