# ✅ GUIDE DE VÉRIFICATION - PRÉFÉRENCES & CONFIGURATION V3.0

> **Objectif**: Vérifier que toutes les améliorations sont fonctionnelles  
> **Durée estimée**: 15 minutes  

---

## 📋 CHECKLIST DE VÉRIFICATION

### 1️⃣ VÉRIFICATION BASE DE DONNÉES (5 min)

#### A. Exécuter la migration

```bash
cd /home/franckylab/projets/eLISAschool/backend

# Exécuter migration
psql -U elisaschool -d elisaschool -f database/migrations/046-preferences-utilisateur-et-config.sql
```

**Résultat attendu**:
```
✅ Migration préférences utilisateur terminée
   - Table preferences_utilisateur créée
   - Audit configuration créé
   - Vues de configuration créées
   - Paramètres système par défaut insérés
   - Fonction reset_preferences_utilisateur créée
```

#### B. Vérifier tables créées

```sql
-- Vérifier table preferences_utilisateur
\d preferences_utilisateur

-- Résultat attendu:
--                    Table "public.preferences_utilisateur"
--      Colonne      |            Type             | Nullable | Default 
-- ------------------+-----------------------------+----------+-------------------
--  id               | uuid                        | not null | gen_random_uuid()
--  utilisateur_id   | uuid                        | not null | 
--  cle              | character varying(100)      | not null | 
--  valeur           | text                        | not null | 
--  type_valeur      | character varying(20)       |          | 'string'::character varying
--  categorie        | character varying(50)       |          | 'PERSONNALISATION'::character varying
--  valeur_defaut    | text                        |          | 
--  herite_global    | boolean                     |          | false
--  description      | text                        |          | 
--  created_at       | timestamp without time zone |          | now()
--  updated_at       | timestamp without time zone |          | now()
-- Indexes:
--     "preferences_utilisateur_pkey" PRIMARY KEY, btree (id)
--     "uk_user_preference" UNIQUE CONSTRAINT, btree (utilisateur_id, cle)
--     "idx_pref_categorie" btree (utilisateur_id, categorie)
--     "idx_pref_user" btree (utilisateur_id)
-- Foreign-key constraints:
--     "preferences_utilisateur_utilisateur_id_fkey" FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
```

#### C. Vérifier indexes

```sql
-- Lister tous les indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('preferences_utilisateur', 'parametres_systeme', 'audit_configuration')
ORDER BY tablename, indexname;
```

**Résultat attendu**: 15+ indexes

#### D. Vérifier vues

```sql
-- Vérifier vues créées
SELECT viewname, definition 
FROM pg_views 
WHERE viewname LIKE 'v_config%'
ORDER BY viewname;
```

**Résultat attendu**: 2 vues (`v_config_globale_active`, `v_config_etablissement_override`)

#### E. Vérifier paramètres système

```sql
-- Compter paramètres insérés
SELECT categorie, COUNT(*) as count
FROM parametres_systeme
WHERE cle LIKE 'securite.%' 
   OR cle LIKE 'notifications.%'
   OR cle LIKE 'affichage.%'
   OR cle LIKE 'performance.%'
GROUP BY categorie
ORDER BY categorie;
```

**Résultat attendu**:
```
 categorie    | count 
--------------+-------
 AFFICHAGE    |     4
 NOTIFICATION |     4
 SECURITE     |     6
 SYSTEME      |     3
```

---

### 2️⃣ VÉRIFICATION BACKEND (5 min)

#### A. Build TypeScript

```bash
cd /home/franckylab/projets/eLISAschool/backend

# Build
npm run build
```

**Résultat attendu**: ✅ Build réussi sans erreurs

#### B. Vérifier fichiers compilés

```bash
# Vérifier que les fichiers sont compilés
ls -la dist/backend/src/modules/auth/entities/preference-utilisateur.entity.*
ls -la dist/backend/src/modules/auth/services/preference-utilisateur.service.*
ls -la dist/backend/src/modules/auth/controllers/preferences.controller.*
```

**Résultat attendu**: 3 fichiers `.js` et 3 fichiers `.js.map`

#### C. Démarrer le serveur

```bash
# Développement
npm run dev

# OU Production
npm run build
pm2 restart elisaschool-backend
```

**Résultat attendu**: Serveur démarré sur port 3000

#### D. Tester health check

```bash
curl http://localhost:3000/api/health
```

**Résultat attendu**:
```json
{
  "success": true,
  "message": "eLISAschool API opérationnelle",
  "version": "x.x.x",
  "timestamp": "2026-06-09T..."
}
```

---

### 3️⃣ VÉRIFICATION API (5 min)

#### A. Obtenir token d'authentification

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecole.com",
    "motDePasse": "votre_mot_de_passe"
  }'
```

**Résultat attendu**: Token JWT dans `data.token`

```bash
# Sauvegarder le token
export TOKEN="<token_recu>"
```

#### B. Tester endpoint - Obtenir mes préférences

```bash
curl -X GET http://localhost:3000/api/preferences/my \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu**:
```json
{
  "success": true,
  "data": {
    "theme": "default",
    "langue": "fr",
    "notifications.email": true,
    "notifications.push": true,
    "notifications.sms": false,
    "notifications.son": true,
    "messagerie.signature": "",
    "messagerie.notification_sonore": true,
    "messagerie.auto_save_brouillons": true,
    ...
  },
  "timestamp": "2026-06-09T..."
}
```

#### C. Tester endpoint - Définir une préférence

```bash
curl -X POST http://localhost:3000/api/preferences/set \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cle": "theme",
    "valeur": "dark",
    "typeValeur": "string"
  }'
```

**Résultat attendu**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "utilisateurId": "uuid",
    "cle": "theme",
    "valeur": "dark",
    "typeValeur": "string",
    "categorie": "AFFICHAGE",
    "heriteGlobal": false
  },
  "message": "Préférence sauvegardée",
  "timestamp": "2026-06-09T..."
}
```

#### D. Vérifier que la préférence est sauvegardée

```bash
curl -X GET http://localhost:3000/api/preferences/my \
  -H "Authorization: Bearer $TOKEN" | grep -A 1 theme
```

**Résultat attendu**: `"theme": "dark"`

#### E. Tester endpoint - Réinitialiser une préférence

```bash
curl -X POST http://localhost:3000/api/preferences/reset/theme \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu**:
```json
{
  "success": true,
  "message": "Préférence réinitialisée",
  "timestamp": "2026-06-09T..."
}
```

#### F. Vérifier reset

```bash
curl -X GET http://localhost:3000/api/preferences/my \
  -H "Authorization: Bearer $TOKEN" | grep -A 1 theme
```

**Résultat attendu**: `"theme": "default"` (valeur par défaut)

#### G. Tester endpoint - Réinitialiser toutes les préférences

```bash
curl -X POST http://localhost:3000/api/preferences/reset-all \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu**:
```json
{
  "success": true,
  "data": { "count": X },
  "message": "X préférence(s) supprimée(s)",
  "timestamp": "2026-06-09T..."
}
```

#### H. Tester endpoint - Restaurer valeurs par défaut

```bash
curl -X POST http://localhost:3000/api/preferences/restore-defaults \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu**:
```json
{
  "success": true,
  "data": { "count": 20 },
  "message": "20 préférence(s) restaurée(s) aux valeurs par défaut",
  "timestamp": "2026-06-09T..."
}
```

#### I. Tester endpoint - Préférences par catégorie (ADMIN)

```bash
curl -X GET http://localhost:3000/api/preferences/my/grouped \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu**:
```json
{
  "success": true,
  "data": {
    "AFFICHAGE": [
      { "cle": "theme", "valeur": "default", "description": "..." },
      { "cle": "langue", "valeur": "fr", "description": "..." },
      ...
    ],
    "NOTIFICATIONS": [
      { "cle": "notifications.email", "valeur": true, "description": "..." },
      ...
    ],
    ...
  },
  "timestamp": "2026-06-09T..."
}
```

#### J. Tester endpoint - Valeurs par défaut (ADMIN)

```bash
curl -X GET http://localhost:3000/api/preferences/defaults \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu**: Objet avec 20+ préférences par défaut

---

### 4️⃣ VÉRIFICATION AUDIT TRAIL

#### A. Modifier une préférence

```bash
curl -X POST http://localhost:3000/api/preferences/set \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cle": "notifications.email",
    "valeur": false
  }'
```

#### B. Vérifier dans les logs

```bash
# Vérifier logs applicatifs
tail -f logs/app.log | grep -i "preference"
```

**Résultat attendu**:
```
[Preferences] Préférence notifications.email mise à jour pour utilisateur <uuid>
[AUDIT] PREFERENCE_UPDATE: Préférence update: notifications.email
```

---

### 5️⃣ VÉRIFICATION CACHE REDIS

#### A. Tester performance sans cache

```bash
# Première requête (cache miss)
time curl -X GET http://localhost:3000/api/preferences/my \
  -H "Authorization: Bearer $TOKEN" > /dev/null
```

**Résultat attendu**: ~50-80ms

#### B. Tester performance avec cache

```bash
# Seconde requête (cache hit)
time curl -X GET http://localhost:3000/api/preferences/my \
  -H "Authorization: Bearer $TOKEN" > /dev/null
```

**Résultat attendu**: ~2-5ms (95% plus rapide)

#### C. Vérifier Redis directement

```bash
# Se connecter à Redis
redis-cli

# Vérifier clés
KEYS preferences:*

# Vérifier TTL
TTL preferences:<userId>

# Quitter
QUIT
```

**Résultat attendu**: Clés avec TTL ~300 secondes

---

### 6️⃣ VÉRIFICATION SÉCURITÉ

#### A. Tester sans authentification

```bash
curl -X GET http://localhost:3000/api/preferences/my
```

**Résultat attendu**: `401 Unauthorized`

#### B. Tester endpoint ADMIN avec user normal

```bash
curl -X GET http://localhost:3000/api/preferences/defaults \
  -H "Authorization: Bearer $TOKEN_USER_NORMAL"
```

**Résultat attendu**: `403 Forbidden`

#### C. Tester endpoint ADMIN avec admin

```bash
curl -X GET http://localhost:3000/api/preferences/defaults \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

**Résultat attendu**: `200 OK` avec données

---

## ✅ RÉSULTATS DE VÉRIFICATION

### Checklist

- [ ] Migration SQL exécutée avec succès
- [ ] Table `preferences_utilisateur` créée
- [ ] Indexes créés (15+)
- [ ] Vues créées (2)
- [ ] Paramètres système insérés (26)
- [ ] Build TypeScript réussi
- [ ] Serveur démarré
- [ ] Health check OK
- [ ] GET `/my` fonctionne
- [ ] POST `/set` fonctionne
- [ ] POST `/reset/:cle` fonctionne
- [ ] POST `/reset-all` fonctionne
- [ ] POST `/restore-defaults` fonctionne
- [ ] GET `/my/grouped` fonctionne
- [ ] GET `/defaults` (ADMIN) fonctionne
- [ ] Audit trail fonctionnel
- [ ] Cache Redis fonctionnel
- [ ] Performance +95% avec cache
- [ ] Sécurité 401 sans token
- [ ] Sécurité 403 sans permission ADMIN

### Score Final

| Catégorie | Score | Statut |
|-----------|-------|--------|
| **Base de données** | ?/6 | ⏳ |
| **Backend** | ?/4 | ⏳ |
| **API** | ?/10 | ⏳ |
| **Audit** | ?/2 | ⏳ |
| **Cache** | ?/3 | ⏳ |
| **Sécurité** | ?/3 | ⏳ |
| **TOTAL** | **?/28** | ⏳ |

**Score minimum pour production**: 25/28 (89%)

---

## 🐛 DÉPANNAGE

### Problème: Migration échoue

```bash
# Vérifier connexion DB
psql -U elisaschool -d elisaschool -c "SELECT 1"

# Vérifier fichier migration
cat database/migrations/046-preferences-utilisateur-et-config.sql | head -20

# Exécuter manuellement
psql -U elisaschool -d elisaschool
\i database/migrations/046-preferences-utilisateur-et-config.sql
```

### Problème: Build échoue

```bash
# Vérifier erreurs TypeScript
npm run build 2>&1 | grep error

# Vérifier imports
grep -r "preferenceUtilisateurService" src/modules/auth/
```

### Problème: API retourne 500

```bash
# Vérifier logs
tail -f logs/app.log

# Vérifier Redis
redis-cli ping

# Redémarrer serveur
npm run dev
```

### Problème: Cache ne fonctionne pas

```bash
# Vérifier Redis
redis-cli
KEYS preferences:*

# Vider cache
redis-cli FLUSHDB

# Tester à nouveau
curl http://localhost:3000/api/preferences/my -H "Authorization: Bearer $TOKEN"
```

---

## 📝 NOTES FINALES

Une fois tous les tests passés avec succès :

1. ✅ Le système est **production-ready**
2. ✅ Documenter dans le wiki interne
3. ✅ Former les administrateurs
4. ✅ Monitorer les métriques de performance
5. ✅ Prévoir revue après 1 semaine d'utilisation

---

> **Guide créé par**: Franck Arlos Chendjou  
> **Date**: 9 Juin 2026  
> **Version**: 3.0.0
