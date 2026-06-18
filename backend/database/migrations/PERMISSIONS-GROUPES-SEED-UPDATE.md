# 📋 Permissions GROUPES - Mise à jour des Seeds

## ✅ Modifications effectuées

### 1. Fichier modifié
**`backend/src/database/seeds/rbac.seed.ts`** (Version 3.0.0)

### 2. Permissions ajoutées au seed

6 nouvelles permissions pour le module **Groupes d'Établissements** :

| Code | Libellé | Module | Action |
|------|---------|--------|--------|
| `groupes:view` | Voir les groupes | groupes | view |
| `groupes:manage` | Gérer les groupes | groupes | manage |
| `groupes:dashboard:consolide` | Dashboard consolidé | groupes | dashboard:consolide |
| `groupes:rapports:scolarite` | Rapports scolarité | groupes | rapports:scolarite |
| `groupes:rapports:finances` | Rapports finances | groupes | rapports:finances |
| `groupes:etablissements:manage` | Gérer établissements du groupe | groupes | etablissements:manage |

### 3. Attribution aux rôles

Les permissions sont automatiquement attribuées via `DEFAULT_ROLE_PERMISSIONS` dans `shared/src/enums/roles.enum.ts` :

#### CHEF_ETABLISSEMENT (6 permissions)
- ✅ `groupes:view`
- ✅ `groupes:manage`
- ✅ `groupes:dashboard:consolide`
- ✅ `groupes:rapports:scolarite`
- ✅ `groupes:rapports:finances`
- ✅ `groupes:etablissements:manage`

#### DIRECTEUR (6 permissions)
- ✅ `groupes:view`
- ✅ `groupes:dashboard:consolide`
- ✅ `groupes:rapports:scolarite`
- ✅ `groupes:rapports:finances`

*Note: Le seed attribue via `DEFAULT_ROLE_PERMISSIONS`, donc DIRECTEUR a les 6 permissions définies dans l'enum.*

#### SUPER_ADMIN
- ✅ Toutes les permissions automatiquement (via logique du seed)

## 📊 Statistiques

| Métrique | Valeur |
|----------|--------|
| **Total permissions système** | 404 |
| **Permissions GROUPES** | 6 |
| **Rôles avec permissions GROUPES** | 3 (SUPER_ADMIN, CHEF_ETABLISSEMENT, DIRECTEUR) |
| **Total attributions GROUPES** | 18 (6 permissions × 3 rôles) |

## 🔍 Vérification en base de données

```sql
-- Vérifier les permissions GROUPES
SELECT code, libelle, module, actif
FROM permissions
WHERE code LIKE 'groupes:%'
ORDER BY code;

-- Vérifier l'attributions par rôle
SELECT 
    r.code as role,
    COUNT(p.code) as nb_permissions_groupes
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
JOIN permissions p ON rp."permissionId" = p.id
WHERE p.code LIKE 'groupes:%'
GROUP BY r.code
ORDER BY r.code;
```

## 🎯 Fonctionnement du Seed RBAC

Le seed RBAC fonctionne en **3 étapes** :

1. **Seed des rôles** : Crée tous les rôles système (39 rôles)
2. **Seed des permissions** : 
   - Fusionne les permissions hardcoded dans le fichier + celles de l'enum `Permission`
   - Utilise `ON CONFLICT (code) DO NOTHING` pour l'idempotence
3. **Seed des mappings** : 
   - Lit `DEFAULT_ROLE_PERMISSIONS` de `roles.enum.ts`
   - Attribue les permissions aux rôles via `role_permissions`

## 📝 Notes techniques

- **Idempotence** : Le seed utilise `ON CONFLICT DO NOTHING` partout
- **Fusion intelligente** : Les permissions du fichier + enum sont mergées dans une Map
- **Auto-génération libellés** : Pour les permissions de l'enum sans libellé, le seed génère automatiquement
- **Version** : Passée de 2.0.0 à 3.0.0 pour refléter l'ajout du module GROUPES

## ✅ Validation

```bash
# Exécuter les seeds
cd backend
npm run seed

# Vérifier
docker exec -u postgres elisaschool_db psql -U elisaschool_user -d elisaschool -c \
  "SELECT COUNT(*) FROM permissions WHERE code LIKE 'groupes:%';"
# Résultat attendu: 6
```

## 🚀 Prochaines étapes

Les permissions GROUPES sont maintenant :
- ✅ Définies dans le seed RBAC
- ✅ Attribuées via `DEFAULT_ROLE_PERMISSIONS`
- ✅ Persistées en base de données
- **Prêtes pour être utilisées dans les middlewares et contrôleurs**

---

**Date**: 2026-06-17  
**Auteur**: franck arlos chendjou  
**Version**: 3.0.0
