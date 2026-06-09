# Guide de Test - Fonctionnalités de Réinitialisation Globale

## Nouvelles Fonctionnalités Implémentées

### 1. Réinitialisation Globale des Paramètres

**Endpoint** : `POST /api/configuration/parametres/reset-all`

**Permission requise** : `SUPER_ADMIN` uniquement

**Body** (optionnel) :
```json
{
  "etablissementId": "uuid-optionnel"
}
```

**Comportement** :
- **Sans `etablissementId`** : Réinitialise TOUS les paramètres globaux vers leur `valeurDefaut`
- **Avec `etablissementId`** : Supprime TOUS les overrides de cet établissement (retour aux valeurs globales)

**Réponse** :
```json
{
  "success": true,
  "data": {
    "resetCount": 45,
    "skippedCount": 55,
    "total": 100
  },
  "message": "45 paramètres réinitialisés sur 100"
}
```

### 2. Seed Forcé (Force Reset)

**Endpoint** : `POST /api/configuration/seed/force`

**Permission requise** : `SUPER_ADMIN` uniquement

**Comportement** :
- Force la réinitialisation de TOUTES les configurations vers les valeurs par défaut
- Écrase les valeurs existantes dans :
  - `ConfigurationApp` (nom établissement, couleurs, langue, etc.)
  - `ConfigurationModule` (paramètres, widgets, champs personnalisés)
  - `ParametreSysteme` (tous les paramètres système)

**Réponse** :
```json
{
  "success": true,
  "data": {
    "app": true,
    "modules": 30,
    "parametres": 100
  },
  "message": "Seeds forcés - toutes les valeurs par défaut restaurées"
}
```

### 3. Réinitialisation Individuelle (existante)

**Endpoint** : `POST /api/configuration/parametres/:cle/reset`

**Permission requise** : `canResetParams`

**Comportement** : Réinitialise UN paramètre spécifique vers sa `valeurDefaut`

---

## Procédure de Test

### Prérequis

1. **Backend en cours d'exécution** :
   ```bash
   cd /home/franckylab/projets/eLISAschool/backend
   npm run dev
   ```

2. **Base de données migrée** :
   ```bash
   # Appliquer la migration 040
   psql -U postgres -d elisaschool -f backend/database/migrations/040-reset-capabilities.sql
   ```

3. **Token SUPER_ADMIN** :
   ```bash
   # Obtenir un token via login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@elisaschool.cm", "motDePasse": "AdminSecret123!"}'
   ```

### Test 1 : Réinitialisation Individuelle

```bash
# 1. Modifier un paramètre
curl -X PUT http://localhost:3000/api/configuration/parametres/auth.session_duration \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"valeur": 2880}'

# 2. Vérifier la modification
curl -X GET http://localhost:3000/api/configuration/parametres/auth.session_duration \
  -H "Authorization: Bearer <TOKEN>"

# 3. Réinitialiser le paramètre
curl -X POST http://localhost:3000/api/configuration/parametres/auth.session_duration/reset \
  -H "Authorization: Bearer <TOKEN>"

# 4. Vérifier la réinitialisation
curl -X GET http://localhost:3000/api/configuration/parametres/auth.session_duration \
  -H "Authorization: Bearer <TOKEN>"
# Devrait retourner: 1440 (valeur par défaut)
```

### Test 2 : Réinitialisation Globale (TOUS les paramètres)

```bash
# 1. Modifier plusieurs paramètres
curl -X PUT http://localhost:3000/api/configuration/parametres/auth.session_duration \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"valeur": 2880}'

curl -X PUT http://localhost:3000/api/configuration/parametres/notifications.enable_push \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"valeur": false}'

curl -X PUT http://localhost:3000/api/configuration/parametres/notes.bareme_defaut \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"valeur": 100}'

# 2. Vérifier le statut des paramètres
psql -U postgres -d elisaschool -c "
SELECT cle, valeur, valeurDefaut, 
       CASE WHEN valeur = valeurDefaut THEN 'CONFORME' ELSE 'MODIFIÉ' END as statut
FROM parametres_systeme
WHERE etablissementId IS NULL
  AND cle IN ('auth.session_duration', 'notifications.enable_push', 'notes.bareme_defaut')
ORDER BY cle;
"

# 3. Réinitialiser TOUS les paramètres
curl -X POST http://localhost:3000/api/configuration/parametres/reset-all \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{}'

# 4. Vérifier la réinitialisation
psql -U postgres -d elisaschool -c "
SELECT cle, valeur, valeurDefaut, 
       CASE WHEN valeur = valeurDefaut THEN 'CONFORME' ELSE 'MODIFIÉ' END as statut
FROM parametres_systeme
WHERE etablissementId IS NULL
  AND cle IN ('auth.session_duration', 'notifications.enable_push', 'notes.bareme_defaut')
ORDER BY cle;
"
# Tous devraient être 'CONFORME'
```

### Test 3 : Seed Forcé

```bash
# 1. Modifier la configuration de l'application
curl -X PATCH http://localhost:3000/api/configuration \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "nomEtablissement": "Mon Établissement Modifié",
    "couleurPrimaire": "#FF0000",
    "langueDefaut": "en"
  }'

# 2. Vérifier la modification
curl -X GET http://localhost:3000/api/configuration/full \
  -H "Authorization: Bearer <TOKEN>"

# 3. Forcer le seed (réinitialisation complète)
curl -X POST http://localhost:3000/api/configuration/seed/force \
  -H "Authorization: Bearer <TOKEN>"

# 4. Vérifier la réinitialisation
curl -X GET http://localhost:3000/api/configuration/full \
  -H "Authorization: Bearer <TOKEN>"
# Devrait retourner les valeurs par défaut
```

### Test 4 : Réinitialisation des Overrides Multi-Tenant

```bash
# 1. Créer un override pour un établissement
curl -X PUT http://localhost:3000/api/configuration/parametres/auth.session_duration \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"valeur": 720, "etablissementId": "<UUID_ETABLISSEMENT>"}'

# 2. Vérifier l'override
psql -U postgres -d elisaschool -c "
SELECT cle, valeur, etablissementId
FROM parametres_systeme
WHERE cle = 'auth.session_duration'
  AND etablissementId = '<UUID_ETABLISSEMENT>';
"

# 3. Réinitialiser TOUS les overrides de l'établissement
curl -X POST http://localhost:3000/api/configuration/parametres/reset-all \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"etablissementId": "<UUID_ETABLISSEMENT>"}'

# 4. Vérifier que les overrides ont été supprimés
psql -U postgres -d elisaschool -c "
SELECT COUNT(*) as override_count
FROM parametres_systeme
WHERE etablissementId = '<UUID_ETABLISSEMENT>';
"
# Devrait retourner 0
```

### Test 5 : Vérification SQL avec la Vue

```bash
# Utiliser la vue v_parametres_statut pour vérifier l'état
psql -U postgres -d elisaschool -c "
SELECT cle, categorie, statut, valeur, valeurDefaut
FROM v_parametres_statut
WHERE etablissementId IS NULL
  AND statut = 'MODIFIE'
LIMIT 10;
"

# Compter les paramètres conformes vs modifiés
psql -U postgres -d elisaschool -c "
SELECT statut, COUNT(*) as nombre
FROM v_parametres_statut
WHERE etablissementId IS NULL
GROUP BY statut;
"
```

---

## Migration de la Base de Données

### Appliquer la Migration

```bash
# Via psql direct
psql -U postgres -d elisaschool -f backend/database/migrations/040-reset-capabilities.sql

# Via npm script (si configuré)
npm run db:migrate
```

### Vérifier la Migration

```bash
# Vérifier les colonnes ajoutées
psql -U postgres -d elisaschool -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'configuration_app'
  AND column_name = 'valeurDefaut';
"

psql -U postgres -d elisaschool -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'configuration_modules'
  AND column_name = 'valeurDefaut';
"

# Vérifier la vue
psql -U postgres -d elisaschool -c "
SELECT * FROM v_parametres_statut LIMIT 5;
"

# Vérifier les fonctions
psql -U postgres -d elisaschool -c "
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'reset_%';
"
```

---

## Scénarios d'Utilisation

### Scénario 1 : Recovery après Modification Accidentelle

**Situation** : Un admin a modifié accidentellement 50 paramètres

**Solution** :
```bash
# Option 1: Réinitialisation globale (rapide)
curl -X POST http://localhost:3000/api/configuration/parametres/reset-all \
  -H "Authorization: Bearer <TOKEN>"

# Option 2: Seed forcé (complet, inclut ConfigurationApp/Module)
curl -X POST http://localhost:3000/api/configuration/seed/force \
  -H "Authorization: Bearer <TOKEN>"
```

### Scénario 2 : Test en Environnement de Développement

**Situation** : Vous voulez revenir à l'état initial après des tests

**Solution** :
```bash
# 1. Seed forcé
curl -X POST http://localhost:3000/api/configuration/seed/force \
  -H "Authorization: Bearer <TOKEN>"

# 2. Invalider le cache
curl -X POST http://localhost:3000/api/configuration/cache/invalidate \
  -H "Authorization: Bearer <TOKEN>"
```

### Scénario 3 : Reset d'un Établissement Spécifique

**Situation** : Un établissement a des configurations erronées

**Solution** :
```bash
curl -X POST http://localhost:3000/api/configuration/parametres/reset-all \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"etablissementId": "<UUID_ETABLISSEMENT>"}'
```

---

## Notes Importantes

### ⚠️ Avertissements

1. **`reset-all` est IRREVERSIBLE** : Toujours créer un backup avant
   ```bash
   curl -X POST http://localhost:3000/api/configuration/sauvegardes \
     -H "Authorization: Bearer <TOKEN>"
   ```

2. **`seed/force` écrase TOUT** : Inclut ConfigurationApp et ConfigurationModule
   - Perte des personnalisations (couleurs, nom établissement, etc.)
   - Perte des widgets et champs personnalisés

3. **Historique conservé** : Toutes les réinitialisations sont loguées dans `historique_configuration`

### ✅ Bonnes Pratiques

1. **Toujours tester en développement d'abord**
2. **Créer un backup avant toute réinitialisation**
3. **Utiliser `reset-all` pour les paramètres uniquement**
4. **Utiliser `seed/force` pour un reset complet (y compris config app/module)**
5. **Vérifier avec la vue `v_parametres_statut` après réinitialisation**

---

## Dépannage

### Problème : "Aucune valeur par défaut définie"

**Cause** : Le paramètre n'a pas de `valeurDefaut` en base

**Solution** :
```bash
# Vérifier
psql -U postgres -d elisaschool -c "
SELECT cle, valeurDefaut
FROM parametres_systeme
WHERE cle = '<CLE_PARAMETRE>';
"

# Si NULL, exécuter le seed forcé
curl -X POST http://localhost:3000/api/configuration/seed/force \
  -H "Authorization: Bearer <TOKEN>"
```

### Problème : Les paramètres ne sont pas réinitialisés

**Cause** : Le cache n'a pas été invalidé

**Solution** :
```bash
curl -X POST http://localhost:3000/api/configuration/cache/invalidate \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type": "parametres"}'
```

### Problème : Migration non appliquée

**Vérifier** :
```bash
psql -U postgres -d elisaschool -c "
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'configuration_app'
  AND column_name = 'valeurDefaut';
"
```

**Appliquer** :
```bash
psql -U postgres -d elisaschool -f backend/database/migrations/040-reset-capabilities.sql
```

---

## Résumé des Endpoints

| Endpoint | Méthode | Permission | Description |
|----------|---------|------------|-------------|
| `/parametres/:cle/reset` | POST | `canResetParams` | Reset UN paramètre |
| `/parametres/reset-all` | POST | `SUPER_ADMIN` | Reset TOUS les paramètres |
| `/seed` | POST | `SUPER_ADMIN` | Seed normal (skip si existe) |
| `/seed/force` | POST | `SUPER_ADMIN` | Seed forcé (écrase tout) |
| `/cache/invalidate` | POST | `canInvalidateCache` | Invalider le cache |
| `/sauvegardes` | POST | `canCreateBackup` | Créer un backup |

---

## Fichiers Modifiés

1. `backend/src/modules/configuration/services/configuration.service.ts`
   - Ajouté : `resetAllParametres()`

2. `backend/src/modules/configuration/controllers/configuration.controller.ts`
   - Ajouté : `POST /parametres/reset-all`
   - Ajouté : `POST /seed/force`

3. `backend/src/modules/configuration/services/configuration-seed.service.ts`
   - Modifié : `runAllSeeds(force: boolean)`
   - Modifié : `seedConfigurationApp(force: boolean)`
   - Modifié : `seedConfigurationModules(force: boolean)`
   - Modifié : `seedParametresSysteme(force: boolean)`

4. `backend/src/modules/configuration/entities/configuration-app.entity.ts`
   - Ajouté : colonne `valeurDefaut`

5. `backend/src/modules/configuration/entities/configuration-module.entity.ts`
   - Ajouté : colonne `valeurDefaut`

6. `backend/database/migrations/040-reset-capabilities.sql`
   - Nouveau fichier : Migration complète

---

## Prochaines Étapes Recommandées

1. **Tests automatisés** : Ajouter des tests unitaires pour `resetAllParametres()`
2. **Documentation API** : Mettre à jour Swagger/OpenAPI
3. **Interface Admin** : Ajouter un bouton "Réinitialiser tout" dans le frontend
4. **Notifications** : Envoyer un email après un reset global
5. **Audit renforcé** : Logger l'IP et le user-agent dans l'historique
