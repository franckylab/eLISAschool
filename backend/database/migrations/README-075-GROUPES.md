# Migration 075 - Module Groupes d'Établissements

## 📋 Description

Cette migration crée l'infrastructure base de données complète pour le module **groupes d'établissements** d'eLISAschool.

### Tables créées

1. **`groupes_etablissements`** - Groupes logiques d'établissements
   - Colonnes : `id`, `nom`, `description`, `proprietaire_id`, `code`, `actif`, `cree_at`, `maj_at`
   - Index : propriétaire + actif, recherche textuelle (nom, code)

2. **`groupe_etablissement_liens`** - Association groupes ↔ établissements
   - Colonnes : `id`, `groupe_id`, `etablissement_id`, `ajoute_par`, `date_ajout`
   - Contrainte : unicité (groupe_id, etablissement_id)

3. **`groupe_admins`** - Administrateurs des groupes
   - Colonnes : `id`, `groupe_id`, `utilisateur_id`, `assigne_par`, `date_assignation`
   - Contrainte : unicité (groupe_id, utilisateur_id)

### Permissions RBAC

8 permissions créées :
- `groupes-etablissements:create` - Créer un groupe
- `groupes-etablissements:view` - Voir les groupes
- `groupes-etablissements:edit` - Modifier un groupe
- `groupes-etablissements:delete` - Supprimer un groupe
- `groupes-etablissements:manage-etablissements` - Gérer les établissements
- `groupes-etablissements:manage-admins` - Gérer les administrateurs
- `groupes-etablissements:dashboard` - Voir dashboard consolidé
- `groupes-etablissements:rapports` - Voir rapports consolidés

### Rôles configurés

| Rôle | Permissions |
|------|-------------|
| **SUPER_ADMIN** | Toutes les permissions |
| **CHEF_ETABLISSEMENT** | Toutes les permissions |
| **DIRECTEUR** | Toutes les permissions |
| **DIRECTEUR_ADJOINT** | view, dashboard, rapports |

### Fonctions utilitaires

- **`fn_count_etablissements_groupe(groupe_id)`** - Compte les établissements d'un groupe
- **`fn_user_has_groupe_access(groupe_id, utilisateur_id)`** - Vérifie l'accès d'un utilisateur

## 🚀 Exécution

### Méthode 1 : Script automatisé (Recommandé)

```bash
cd /mnt/DONNEES/projets/eLISAschool
./scripts/deploy-migration-075.sh
```

### Méthode 2 : Manuellement avec psql

```bash
# Charger les variables d'environnement
source /mnt/DONNEES/projets/eLISAschool/.env

# Exécuter la migration
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -f /mnt/DONNEES/projets/eLISAschool/backend/database/migrations/075-module-groupes-etablissements.sql
```

### Méthode 3 : Via Docker (si PostgreSQL dans container)

```bash
docker exec -i <postgres_container> psql -U postgres -d elisaschool \
    < /mnt/DONNEES/projets/eLISAschool/backend/database/migrations/075-module-groupes-etablissements.sql
```

## ✅ Vérification

Après l'exécution, vérifier que tout est correctement créé :

```sql
-- Vérifier les tables
\dt groupe*

-- Vérifier les permissions
SELECT cle, nom FROM permissions WHERE cle LIKE 'groupes-etablissements:%';

-- Vérifier les rôles
SELECT r.nom as role, COUNT(rp.permission_id) as permissions
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.cle LIKE 'groupes-etablissements:%'
GROUP BY r.nom;

-- Vérifier les données de test
SELECT id, nom, code, actif FROM groupes_etablissements;
```

## 🔄 Rollback (si nécessaire)

```sql
-- Supprimer les tables (ATTENTION: supprime toutes les données!)
DROP TABLE IF EXISTS groupe_admins CASCADE;
DROP TABLE IF EXISTS groupe_etablissement_liens CASCADE;
DROP TABLE IF EXISTS groupes_etablissements CASCADE;

-- Supprimer les permissions
DELETE FROM role_permissions 
WHERE permission_id IN (
    SELECT id FROM permissions WHERE cle LIKE 'groupes-etablissements:%'
);
DELETE FROM permissions WHERE cle LIKE 'groupes-etablissements:%';

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS fn_count_etablissements_groupe;
DROP FUNCTION IF EXISTS fn_user_has_groupe_access;
```

## 📝 Notes

- ✅ Migration idempotente (peut être exécutée plusieurs fois sans erreur grâce à `IF NOT EXISTS` et `ON CONFLICT`)
- ✅ Crée automatiquement un groupe de démonstration si un SUPER_ADMIN existe
- ✅ Les index sont optimisés pour les requêtes de la refactorisation (pagination, recherche)
- ✅ Trigger automatique sur `maj_at` pour mise à jour du timestamp

## 🎯 Prochaines étapes après migration

1. **Redémarrer le backend** :
   ```bash
   cd /mnt/DONNEES/projets/eLISAschool/backend
   npm run dev
   ```

2. **Vérifier les logs** :
   - Aucune erreur de connexion à la base
   - Les entités TypeORM sont correctement chargées

3. **Tester le module** :
   - Accéder à `http://localhost:7001/groupes-etablissements`
   - Créer un nouveau groupe
   - Vérifier la pagination et la recherche

## 📊 Schéma de la base de données

```
┌─────────────────────────────┐
│  groupes_etablissements     │
│  - id (PK, UUID)            │
│  - nom (VARCHAR)            │
│  - description (TEXT)       │
│  - proprietaire_id (FK)     │
│  - code (VARCHAR, UNIQUE)   │
│  - actif (BOOLEAN)          │
│  - cree_at (TIMESTAMP)      │
│  - maj_at (TIMESTAMP)       │
└──────────┬──────────────────┘
           │
           │ 1
           │
           │ N
┌──────────▼──────────────────┐     ┌─────────────────────────────┐
│  groupe_etablissement_liens │     │  groupe_admins              │
│  - id (PK, UUID)            │     │  - id (PK, UUID)            │
│  - groupe_id (FK, UNIQUE*)  │     │  - groupe_id (FK)           │
│  - etablissement_id (FK)    │     │  - utilisateur_id (FK)      │
│  - ajoute_par (FK)          │     │  - assigne_par (FK)         │
│  - date_ajout (TIMESTAMP)   │     │  - date_assignation (TS)    │
└─────────────────────────────┘     └─────────────────────────────┘

* UNIQUE(groupe_id, etablissement_id)
```

---

**Version** : 1.0.0  
**Auteur** : franck arlos chendjou  
**Date** : 2025-06-17  
**Status** : ✅ Prêt pour exécution
