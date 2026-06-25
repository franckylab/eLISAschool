# Migration 082 - Fix Erreur 500 Préférences Utilisateur

## 📋 Problème Identifié

**Erreur** : `POST http://localhost:7000/api/preferences/set` retourne **500 Internal Server Error**

**Message d'erreur** :
```
QueryFailedError: duplicate key value violates unique constraint "IDX_53ac290b84fcb99dccdb6f668b"
```

## 🔍 Analyse en Profondeur

### Cause Racine

L'entité `PreferenceUtilisateur` avait **DEUX contraintes uniques conflictuelles** :

```typescript
// Ligne 43 - CONTRAINTE PROBLÉMATIQUE
@Index(['utilisateurId', 'cle'], { unique: true })

// Ligne 44 - Contrainte correcte
@Index(['utilisateurId', 'cle', 'etablissementId'], { unique: true })
```

### Scénario d'Échec

1. **Préférence existante** : `(user123, 'theme', NULL)` - préférence globale
2. **Nouvelle requête** : `POST /api/preferences/set` avec `{ cle: 'theme', valeur: 'dark', etablissementId: 'etab456' }`
3. **Logique du service** :
   ```typescript
   const whereClause = { utilisateurId: 'user123', cle: 'theme', etablissementId: 'etab456' };
   let pref = await this.preferenceRepo.findOne({ where: whereClause });
   // → pref = undefined (car l'entrée existante a etablissementId = NULL)
   ```
4. **Tentative d'INSERT** :
   ```sql
   INSERT INTO preferences_utilisateur (utilisateurId, cle, etablissementId, ...)
   VALUES ('user123', 'theme', 'etab456', ...)
   ```
5. **Violation de contrainte** : La contrainte `['utilisateurId', 'cle']` (ligne 43) bloque car `(user123, 'theme')` existe déjà, peu importe la valeur de `etablissementId`.

### Pourquoi C'était Incorrect ?

La contrainte `['utilisateurId', 'cle']` **ne permet pas** de distinguer :
- Préférence **globale** (`etablissementId = NULL`)
- Préférence **par établissement** (`etablissementId = 'etab456'`)

Cela empêche un utilisateur d'avoir :
- Un thème global par défaut
- Un thème différent par établissement

## ✅ Corrections Appliquées

### 1. Entity - Suppression Contrainte Conflictuelle

**Fichier** : `backend/src/modules/auth/entities/preference-utilisateur.entity.ts`

```diff
 @Entity('preferences_utilisateur')
-@Index(['utilisateurId', 'cle'], { unique: true })
-@Index(['utilisateurId', 'cle', 'etablissementId'], { unique: true })
+@Index(['utilisateurId', 'cle', 'etablissementId'], { unique: true }) // Contrainte unique composite (supporte NULL et non-NULL)
 @Index(['utilisateurId', 'categorie'])
```

**Résultat** : Une seule contrainte unique à 3 colonnes qui permet :
- `(user123, 'theme', NULL)` ✅
- `(user123, 'theme', 'etab456')` ✅
- `(user123, 'theme', 'etab789')` ✅

### 2. Service - Logique de Recherche Améliorée

**Fichier** : `backend/src/modules/auth/services/preference-utilisateur.service.ts`

**Avant** (buggy) :
```typescript
const whereClause: any = { utilisateurId, cle };
if (etablissementId) {
    whereClause.etablissementId = etablissementId;
} else {
    whereClause.etablissementId = null;
}

let pref = await this.preferenceRepo.findOne({ where: whereClause });
```

**Après** (corrigé) :
```typescript
// Essayer d'abord avec etablissementId
let pref = await this.preferenceRepo.findOne({
    where: { utilisateurId, cle, etablissementId },
});

if (!pref && etablissementId) {
    // Si pas trouvé, chercher la préférence globale (fallback)
    pref = await this.preferenceRepo.findOne({
        where: { utilisateurId, cle, etablissementId: null },
    });
}
```

**Avantages** :
- Recherche précise d'abord avec le contexte établissement
- Fallback intelligent sur la préférence globale si pas de préférence spécifique
- Compatible avec la nouvelle contrainte unique composite

### 3. Migration SQL - Nettoyage Base de Données

**Fichier** : `backend/database/migrations/082-fix-contrainte-unique-preferences.sql`

**Actions** :
1. Détecter et supprimer la contrainte unique conflictuelle sur `(utilisateurId, cle)`
2. Vérifier que la contrainte composite `(utilisateurId, cle, etablissementId)` existe
3. Recréer la contrainte composite si nécessaire
4. Afficher un rapport de vérification

## 🚀 Instructions d'Exécution

### Option 1 : Script Automatisé (Recommandé)

```bash
cd /mnt/DONNEES/projets/eLISAschool
./scripts/run-migration-082.sh
```

### Option 2 : Exécution Manuelle (Docker)

```bash
# 1. Trouver le container PostgreSQL
docker ps | grep postgres

# 2. Copier la migration
docker cp backend/database/migrations/082-fix-contrainte-unique-preferences.sql <container_name>:/tmp/migration082.sql

# 3. Exécuter
docker exec -u postgres <container_name> psql -d elisaschool -f /tmp/migration082.sql

# 4. Nettoyer
docker exec <container_name> rm /tmp/migration082.sql
```

### Option 3 : Exécution Manuelle (PostgreSQL Local)

```bash
PGPASSWORD=postgres psql -U postgres -h localhost -d elisaschool \
  -f backend/database/migrations/082-fix-contrainte-unique-preferences.sql
```

### Option 4 : Via pnpm (si backend tourne)

```bash
cd backend
pnpm typeorm migration:run
```

## ✅ Vérification Post-Migration

### 1. Vérifier les Contraintes

```sql
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'preferences_utilisateur'::regclass
  AND contype = 'u';
```

**Résultat attendu** : Une seule contrainte unique :
```
uq_preferences_utilisateur_user_cle_etablissement | UNIQUE (utilisateurId, cle, etablissementId)
```

### 2. Tester l'API

```bash
# Créer une préférence globale
curl -X POST http://localhost:7000/api/preferences/set \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"cle": "theme", "valeur": "dark"}'

# Créer une préférence par établissement (NE DOIT PLUS PLANTER)
curl -X POST http://localhost:7000/api/preferences/set \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"cle": "theme", "valeur": "light", "etablissementId": "<id>"}'
```

### 3. Vérifier les Logs Backend

```bash
tail -f backend/logs/combined1.log | grep -i "preference"
```

**Message attendu** :
```
[Preferences] Préférence theme mise à jour pour utilisateur <id> (établissement: <id>)
```

## 🎯 Bénéfices

1. **Multi-tenant amélioré** : Un utilisateur peut avoir des préférences différentes par établissement
2. **Fallback intelligent** : Si pas de préférence spécifique, utilise la préférence globale
3. **Plus d'erreurs 500** : La contrainte unique ne bloque plus les insertions légitimes
4. **Logique métier cohérente** : Alignée avec le pattern multi-tenant d'eLISAschool

## 📁 Fichiers Modifiés

| Fichier | Modification | Lignes |
|---------|-------------|--------|
| `backend/src/modules/auth/entities/preference-utilisateur.entity.ts` | Suppression contrainte conflictuelle | 43-44 |
| `backend/src/modules/auth/services/preference-utilisateur.service.ts` | Logique recherche améliorée | 315-330 |
| `backend/database/migrations/082-fix-contrainte-unique-preferences.sql` | Migration SQL (nouveau) | 1-97 |
| `scripts/run-migration-082.sh` | Script d'exécution (nouveau) | 1-35 |

## ⚠️ Notes Importantes

1. **Backup** : Toujours faire un backup avant d'exécuter la migration
2. ** downtime** : La migration est rapide (<1s), aucun downtime significatif
3. **Rollback** : En cas de problème, la migration peut être annulée en recréant la contrainte supprimée
4. **Impact** : Les préférences existantes ne sont PAS modifiées, seulement la contrainte change

---

**Date** : 25 Juin 2026  
**Auteur** : franck arlos chendjou  
**Version** : 1.0.0  
**Statut** : ✅ Code corrigé, migration prête à exécuter
