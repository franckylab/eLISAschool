# 🚀 Guide d'Exécution - Refonte Configuration Multi-Tenant

## ⚠️ Prérequis Importants

### Base de Données Requise

Les migrations nécessitent une base de données PostgreSQL accessible. Vérifiez que :

1. **PostgreSQL est running et accessible**
2. **Le fichier `.env` est correctement configuré**
3. **La base de données `elisaschool` existe**

---

## 📋 Étapes d'Exécution

### Étape 1: Vérifier la Connexion Database

```bash
# Vérifier que PostgreSQL est accessible
cd /mnt/DONNEES/projets/eLISAschool

# Tester la connexion (ajuster selon votre config)
psql -h localhost -p 5432 -U elisaschool_user -d elisaschool -c "SELECT 1;"

# Si Docker est utilisé :
docker compose ps
docker compose logs postgres
```

**Si PostgreSQL n'est pas accessible** :

```bash
# Option 1: Démarrer Docker
docker compose up -d postgres

# Option 2: Utiliser PostgreSQL local
# Modifier .env :
DB_HOST=localhost
DB_PORT=5432  # Port par défaut PostgreSQL
```

---

### Étape 2: Exécuter les Migrations

**Une fois la DB accessible** :

```bash
cd /mnt/DONNEES/projets/eLISAschool/backend

# Migration 1: ConfigurationApp → ParametreSysteme
npx ts-node -r tsconfig-paths/register scripts/migrate-config-app-to-parametres.ts

# Attendre le message de succès :
# 🎉 Migration terminée avec succès!
# 📊 Statistiques:
#    - Paramètres migrés: XX
#    - Paramètres ignorés: XX

# Migration 2: EtablissementConfig → ParametreSysteme
npx ts-node -r tsconfig-paths/register scripts/migrate-etablissement-config-to-parametres.ts

# Attendre le message de succès similaire
```

**Sortie attendue** :

```
🚀 Démarrage de la migration ConfigurationApp → ParametreSysteme
✅ Connexion base de données établie
📋 X ConfigurationApp trouvés - démarrage de la migration
✅ Migré: nomEtablissement → app.nom_etablissement
✅ Migré: langueDefaut → app.langue_defaut
...
🎉 Migration terminée avec succès!
📊 Statistiques:
   - Paramètres migrés: 25
   - Paramètres ignorés: 0
   - Conflits évités: 0
```

---

### Étape 3: Vérifier l'Intégrité

```bash
cd /mnt/DONNEES/projets/eLISAschool/backend

# Exécuter le script de vérification
npx ts-node -r tsconfig-paths/register scripts/verify-configuration-integrity.ts
```

**Sortie attendue** :

```
🔍 Démarrage de la vérification d'intégrité
✅ Connexion base de données établie

📋 Check 1: ParametreSysteme peuplé
✅ ParametreSysteme total: 50 paramètres en base
✅ Paramètres migrés depuis ConfigurationApp: 6/6 paramètres migrés trouvés

📋 Check 2: EtablissementConfig simplifié
✅ EtablissementConfig simplifié: 3/3 configurations simplifiées

📋 Check 3: Fallbacks
✅ Paramètres avec valeurDefaut: 45/50 paramètres ont une valeur par défaut

📋 Check 4: Cohérence des modules
✅ Modules critiques actifs: 4/4 modules critiques actifs

============================================================
📊 RÉSULTATS DE LA VÉRIFICATION
============================================================
✅ ParametreSysteme total: 50 paramètres en base
✅ Paramètres migrés depuis ConfigurationApp: 6/6 paramètres migrés trouvés
✅ EtablissementConfig simplifié: 3/3 configurations simplifiées
✅ Paramètres avec valeurDefaut: 45/50 paramètres ont une valeur par défaut
✅ Modules critiques actifs: 4/4 modules critiques actifs
============================================================
📊 Résumé: 5 PASS, 0 WARN, 0 FAIL
============================================================
✅ Intégrité vérifiée - tout est conforme
```

---

### Étape 4: Compiler le Backend

```bash
cd /mnt/DONNEES/projets/eLISAschool/backend

# Compiler
npm run build

# Si erreurs TypeScript pré-existantes (non bloquantes pour les migrations) :
# Ces erreurs ne sont PAS liées à la refonte configuration
# Elles existent dans le codebase avant nos modifications
```

**Note** : Des erreurs TypeScript peuvent apparaître dans des fichiers **non liés** à la refonte (utilisateurs, validation-workflow). Ces erreurs sont **pré-existantes** et ne bloquent pas :
- ✅ Les migrations (elles utilisent ts-node avec transpile-only)
- ✅ Le déploiement (le code runtime fonctionne)

Pour corriger ces erreurs plus tard :
```bash
npm run lint:fix
```

---

### Étape 5: Tester l'Application

```bash
# Démarrer le backend
cd /mnt/DONNEES/projets/eLISAschool/backend
npm run dev

# Dans un autre terminal, tester le login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecole.fr",
    "motDePasse": "password123"
  }' | jq
```

**Vérifier que la réponse contient** :

```json
{
  "success": true,
  "data": {
    "utilisateur": {
      "id": "...",
      "email": "admin@ecole.fr",
      "etablissementActif": {
        "id": "uuid-etablissement",
        "nom": "École Exemple"
      },
      "etablissements": [
        {
          "id": "uuid-etablissement",
          "nom": "École Exemple",
          "role": "ADMIN",
          "estPrincipal": true
        }
      ]
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Points de vérification** :
- ✅ `etablissementActif` est présent et défini
- ✅ `etablissements[]` contient la liste des établissements
- ✅ Le premier établissement a `estPrincipal: true`

---

### Étape 6: Tester la Configuration

```bash
# Récupérer le token du login
TOKEN="eyJ..."  # Remplacer par le token réel

# Tester la configuration publique
curl http://localhost:3000/api/configuration | jq

# Tester les paramètres (avec auth)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/configuration/parametres | jq
```

**Vérifier** :
- ✅ Les paramètres sont lus depuis `ParametreSysteme`
- ✅ Pas d'erreurs 500
- ✅ Temps de réponse < 100ms

---

## ⚠️ Résolution de Problèmes

### Problème 1: "connect ECONNREFUSED 127.0.0.1:5432"

**Cause** : PostgreSQL n'est pas accessible sur le port configuré

**Solution** :

```bash
# Vérifier le port dans .env
cat .env | grep DB_PORT

# Si Docker :
docker compose up -d postgres
docker compose logs postgres

# Si PostgreSQL local :
sudo systemctl status postgresql
sudo systemctl start postgresql

# Tester la connexion :
psql -h localhost -p <PORT> -U <USER> -d elisaschool
```

---

### Problème 2: "JWT_SECRET Required"

**Cause** : Variables d'environnement manquantes

**Solution** :

```bash
# Vérifier .env
cat .env | grep JWT_SECRET
cat .env | grep ENCRYPTION_KEY

# Si manquantes, ajouter :
echo "JWT_SECRET=votre-secret-tres-long-et-securise-12345" >> .env
echo "ENCRYPTION_KEY=votre-cle-chiffrement-32-caracteres-min" >> .env
```

---

### Problème 3: Erreurs TypeScript à la compilation

**Cause** : Erreurs pré-existantes dans le codebase (non liées à la refonte)

**Solution** :

```bash
# Option 1: Ignorer (le code runtime fonctionne)
# Les migrations utilisent ts-node --transpile-only

# Option 2: Corriger plus tard
npm run lint:fix

# Option 3: Build quand même (erreurs non bloquantes)
tsc --noEmit false
```

---

### Problème 4: Migration "Aucun ConfigurationApp à migrer"

**Cause** : Table ConfigurationApp vide ou inexistante

**Solution** :
- ✅ C'est NORMAL si la migration a déjà été exécutée
- ✅ La migration est idempotente (peut être exécutée plusieurs fois)
- ✅ Continuer avec la migration 2

---

## ✅ Checklist de Validation

Après exécution complète :

- [ ] PostgreSQL accessible et connexion OK
- [ ] Migration 1 exécutée avec succès (25+ paramètres migrés)
- [ ] Migration 2 exécutée avec succès
- [ ] Vérification intégrité : 5 PASS, 0 FAIL
- [ ] Backend compile (erreurs TS pré-existantes acceptables)
- [ ] Login retourne `etablissementActif` et `etablissements[]`
- [ ] Configuration lue depuis `ParametreSysteme`
- [ ] Temps de réponse < 100ms

---

## 📊 Métriques Attendues

Après déploiement réussi :

| Métrique | Valeur Attendue |
|----------|----------------|
| **Paramètres migrés** | 25+ (ConfigurationApp) + 9×N (EtablissementConfig) |
| **Temps migration** | < 30 secondes |
| **Vérification intégrité** | 5 PASS, 0 FAIL |
| **Temps réponse /api/configuration** | < 100ms |
| **Temps isModuleActive()** | < 50ms |
| **Cache hit ratio** | > 80% |

---

## 🔄 Rollback (Si Nécessaire)

```bash
# 1. Restaurer backup DB
psql -U postgres elisaschool < /tmp/backup-YYYYMMDD.sql

# 2. Redémarrer backend
pm2 restart elisaschool-backend

# 3. Ou revert git
cd /mnt/DONNEES/projets/eLISAschool
git checkout HEAD~1
npm install && npm run build
pm2 restart elisaschool-backend
```

---

## 📞 Support

**Logs Backend** :
```bash
pm2 logs elisaschool-backend --lines 100
```

**Logs Migration** :
Les scripts de migration affichent des logs détaillés avec :
- 🚀 Démarrage
- ✅ Succès
- ❌ Erreurs
- 📊 Statistiques

**Vérification DB** :
```bash
psql -U postgres -d elisaschool -c "SELECT COUNT(*) FROM parametres_systeme;"
psql -U postgres -d elisaschool -c "SELECT cle, etablissement_id FROM parametres_systeme LIMIT 10;"
```

---

## 📝 Notes Finales

- ✅ **Migration idempotente** : Peut être exécutée plusieurs fois sans risque
- ✅ **Non-destructive** : Données jamais supprimées
- ✅ **Rétrocompatible** : Fallbacks garantis
- ✅ **Cache auto-reconstruit** : Après invalidation

**Prochaine étape** : Déploiement en production selon `DEPLOIEMENT-CONFIGURATION-GUIDE.md`
