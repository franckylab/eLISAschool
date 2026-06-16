# Configuration de Sécurité - Durée de Blocage Réduite à 2 Minutes

**Date:** 16 juin 2025  
**Version:** 1.0.0  
**Statut:** ✅ Appliqué

---

## 📋 Résumé

La durée de blocage après 20 tentatives de connexion échouées a été réduite de **15 minutes** à **2 minutes**.

---

## 🔧 Modifications Effectuées

### 1. Configuration par défaut (Seed)

**Fichier :** `backend/src/modules/configuration/services/configuration-seed.service.ts`

```typescript
// AVANT
{ cle: 'auth.lockout_duration', valeur: 15, ... }

// APRÈS
{ cle: 'auth.lockout_duration', valeur: 2, ... }
```

### 2. Message du Rate Limiter

**Fichier :** `backend/src/app.ts`

```typescript
// AVANT
message: 'Trop de tentatives de connexion. Veuillez patienter 15 minutes.',

// APRÈS
message: 'Trop de tentatives de connexion. Veuillez patienter 2 minutes.',
```

### 3. Migration pour installations existantes

**Fichier :** `backend/src/database/migrations/017-reduction-duree-blocage-auth.ts`

Migration TypeORM pour mettre à jour la base de données existante.

### 4. Script SQL alternatif

**Fichier :** `backend/src/database/migrations/017-reduction-duree-blocage-auth.sql`

Pour exécution manuelle si nécessaire.

---

## 📊 Configuration Actuelle

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| `auth.max_login_attempts` | **20** | Nombre max de tentatives avant blocage |
| `auth.lockout_duration` | **2 minutes** | Durée de blocage après échecs |
| Rate limiter window | **2 minutes** | Fenêtre de temps du rate limiter |
| Rate limiter max | **20** | Max requêtes par fenêtre |

---

## 🚀 Application de la Migration

### Option 1 : Via TypeORM (Recommandé)

```bash
cd backend
npm run migration:run
```

### Option 2 : Via SQL direct

```bash
# Se connecter à PostgreSQL
docker exec -it elisaschool-postgres psql -U elisaschool_user -d elisaschool_db

# Exécuter la migration
\i /docker-entrypoint-initdb.d/017-reduction-duree-blocage-auth.sql

# Ou copier-coller le contenu du fichier SQL
```

### Option 3 : Via le script fourni

```bash
cd backend/src/database/migrations
psql -U elisaschool_user -d elisaschool_db -f 017-reduction-duree-blocage-auth.sql
```

---

## ✅ Vérification

### 1. Vérifier en base de données

```sql
SELECT cle, valeur, description 
FROM parametres_systeme 
WHERE cle = 'auth.lockout_duration';
```

**Résultat attendu :**
```
cle                  | valeur | description
auth.lockout_duration | 2      | Durée de blocage après échecs (minutes)
```

### 2. Tester le comportement

```bash
# 1. Tenter 20 connexions échouées
for i in {1..20}; do
  curl -X POST http://localhost:7000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"identifiant":"test@test.com","motDePasse":"wrong"}'
done

# 2. La 20ème tentative doit retourner:
# {
#   "success": false,
#   "error": {
#     "code": "ACCOUNT_LOCKED",
#     "message": "Compte temporairement bloqué. Veuillez réessayer dans 2:00."
#   }
# }

# 3. Après 2 minutes, le compte est débloqué automatiquement
```

---

## 🎯 Impact sur l'UX

### Avant (15 minutes)
- ❌ Blocage trop long
- ❌ Frustration utilisateur
- ❌ Support technique sollicité
- ⏱️ Temps d'attente : 15:00

### Après (2 minutes)
- ✅ Blocage raisonnable
- ✅ Utilisateur patiente facilement
- ✅ Moins de tickets support
- ⏱️ Temps d'attente : 2:00 (87% de réduction)

---

## 🔒 Considérations de Sécurité

### Pourquoi 2 minutes ?

1. **Protection brute-force** : Suffisant pour ralentir les attaques
2. **UX acceptable** : L'utilisateur ne quitte pas la page
3. **Équilibre sécurité/confort** : Compromis optimal

### Comparaison avec les standards

| Service | Durée de blocage | Tentatives max |
|---------|------------------|----------------|
| **Google** | Variable (5-30 min) | 10 |
| **Microsoft** | 15 minutes | 10 |
| **Apple** | Progressive | 6 |
| **eLISAschool** | **2 minutes** | **20** |

**Notre approche est plus permissive mais acceptable pour un contexte scolaire.**

---

## 📝 Configuration Avancée

### Modifier la durée via l'interface admin

Les administrateurs peuvent ajuster ce paramètre dans :

```
Paramètres → Sécurité → Durée de blocage après échecs (minutes)
```

Le paramètre est :
- ✅ Modifiable à runtime
- ✅ Visible dans l'interface
- ✅ Scopé par établissement (multi-tenant)

### Exemples de valeurs recommandées

| Contexte | Durée | Tentatives |
|----------|-------|------------|
| **École primaire** | 2 min | 20 |
| **Lycée** | 5 min | 15 |
| **Université** | 10 min | 10 |
| **Administration** | 15 min | 5 |

---

## 🔄 Rollback (si nécessaire)

Si vous devez revenir à 15 minutes :

### Via SQL

```sql
UPDATE parametres_systeme
SET valeur = '15',
    updated_at = NOW()
WHERE cle = 'auth.lockout_duration';
```

### Via TypeORM

```bash
cd backend
npm run migration:revert  # Revert la dernière migration
```

---

## 📚 Fichiers Modifiés

| Fichier | Ligne | Modification |
|---------|-------|--------------|
| `configuration-seed.service.ts` | 185 | `valeur: 15` → `valeur: 2` |
| `app.ts` | 137 | Message 15 min → 2 min |
| `017-reduction-duree-blocage-auth.ts` | - | **Nouveau** |
| `017-reduction-duree-blocage-auth.sql` | - | **Nouveau** |

---

## ✅ Checklist de Validation

- [x] Configuration par défaut mise à jour (seed)
- [x] Message du rate limiter mis à jour
- [x] Migration TypeORM créée
- [x] Script SQL alternatif créé
- [x] Documentation à jour
- [x] Tests de vérification documentés
- [x] Rollback documenté

---

**Fin du document**

*Configuration appliquée le 16 juin 2025 - eLISAschool v3.0*  
*Durée de blocage : 2 minutes (au lieu de 15)*
