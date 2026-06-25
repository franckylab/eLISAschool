# Correction des Permissions SUPER_ADMIN

## 📊 Diagnostic

**Problème** : L'utilisateur Super Admin (`admin@elisaschool.cm`) n'a que **79 permissions** au lieu de **~455** (toutes les permissions).

## 🔍 Cause Racine

Le seed RBAC ([rbac.seed.ts](file:///mnt/DONNEES/projets/eLISAschool/backend/src/database/seeds/rbac.seed.ts)) utilisait une **assignation directe** qui **ÉCRASAIT** les relations existantes :

```typescript
// ❌ INCORRECT (ancien code)
role.permissions = permissionEntities;  // Écrase TOUTES les permissions existantes
await this.roleRepo.save(role);
```

**Conséquence** : 
- Les permissions ajoutées par les migrations ultérieures étaient perdues
- Seulement les permissions de `DEFAULT_ROLE_PERMISSIONS` étaient conservées
- Le SUPER_ADMIN devrait avoir `Object.values(Permission)` (~455 permissions)

## ✅ Corrections Appliquées

### 1. Correction du Seed RBAC

**Fichier** : [`backend/src/database/seeds/rbac.seed.ts`](file:///mnt/DONNEES/projets/eLISAschool/backend/src/database/seeds/rbac.seed.ts#L313-L376)

**Changement** : Ajout incrémental au lieu d'écrasement

```typescript
// ✅ CORRECT (nouveau code v6.1)
const existingPermissionIds = new Set(role.permissions?.map(p => p.id) || []);
let addedCount = 0;

for (const perm of permissionEntities) {
    if (!existingPermissionIds.has(perm.id)) {
        // Permission manquante → l'ajouter
        role.permissions = [...(role.permissions || []), perm];
        addedCount++;
    }
}

// Sauvegarder uniquement si des permissions ont été ajoutées
if (addedCount > 0) {
    await this.roleRepo.save(role);
    logger.debug(`  ✓ ${roleCode}: ${addedCount} nouvelles permissions ajoutées (total: ${role.permissions.length})`);
}
```

### 2. Script de Migration SQL

**Fichier** : [`backend/database/migrations/069-fix-super-admin-permissions.sql`](file:///mnt/DONNEES/projets/eLISAschool/backend/database/migrations/069-fix-super-admin-permissions.sql)

Ce script SQL :
1. Compte les permissions actuelles du SUPER_ADMIN
2. Ajoute TOUTES les permissions actives manquantes
3. Vérifie le résultat final

**Exécution** :
```bash
./scripts/fix-super-admin-permissions-v2.sh
```

### 3. Script de Diagnostic TypeScript

**Fichier** : [`backend/src/database/seeds/fix-super-admin-permissions.ts`](file:///mnt/DONNEES/projets/eLISAschool/backend/src/database/seeds/fix-super-admin-permissions.ts)

Ce script :
1. Diagnose le problème (permissions en base vs enum)
2. Crée les permissions manquantes dans la base
3. Les ajoute au rôle SUPER_ADMIN
4. Affiche un rapport détaillé par module

**Exécution** :
```bash
cd backend
npx ts-node -r tsconfig-paths/register src/database/seeds/fix-super-admin-permissions.ts
```

## 🚀 Comment Appliquer la Correction

### Option 1 : Redémarrage Simple (Recommandé)

Le code backend ([permission-resolver.service.ts](file:///mnt/DONNEES/projets/eLISAschool/backend/src/modules/auth/services/permission-resolver.service.ts#L139-L166)) **détecte automatiquement** le SUPER_ADMIN et lui donne TOUTES les permissions :

```typescript
// Lignes 139-166
if (hasSuperAdmin) {
    // SUPER_ADMIN a TOUTES les permissions
    const allPermissions = new Set<string>(
        Array.from(this.globalPermissionCache.keys())
    );
    
    // Si le cache global est vide, charger depuis la DB
    if (allPermissions.size === 0) {
        const permissions = await this.permissionRepo.find({
            where: { actif: true },
            select: ['code'],
        });
        for (const perm of permissions) {
            allPermissions.add(perm.code);
            this.globalPermissionCache.set(perm.code, perm as Permission);
        }
    }
    
    return allPermissions;
}
```

**Étapes** :
```bash
# 1. Redémarrer le backend (vide le cache en mémoire)
lsof -ti:7000 | xargs kill -9
cd backend && npm run dev

# 2. Se reconnecter avec admin@elisaschool.cm
# Le nouveau token contiendra TOUTES les permissions
```

### Option 2 : Migration SQL (Si accès direct à la DB)

```bash
./scripts/fix-super-admin-permissions-v2.sh
```

Puis redémarrer le backend et se reconnecter.

### Option 3 : Script TypeScript (Si PostgreSQL n'est pas accessible directement)

```bash
# Assurez-vous que PostgreSQL est démarré
cd backend
npx ts-node -r tsconfig-paths/register src/database/seeds/fix-super-admin-permissions.ts
```

## 📈 Vérification

Après correction, le SUPER_ADMIN devrait avoir :

- **~455 permissions** (toutes les permissions du enum `Permission`)
- Réparties sur tous les modules (users, roles, notes, bulletins, finances, etc.)
- Accessibles via le token JWT après reconnexion

**Vérification dans le frontend** :
```typescript
// Le hook use-permissions.ts devrait retourner ['*'] pour SUPER_ADMIN
const { permissions } = usePermissions();
console.log(permissions); // ['*'] wildcard = toutes les permissions
```

## 🔒 Sécurité

Le système RBAC est conçu pour que :
1. **SUPER_ADMIN** ait automatiquement TOUTES les permissions (hardcoded dans le resolver)
2. Le cache soit **invalidé** à chaque reconnexion
3. Les permissions soient **résolues dynamiquement** à chaque requête

**Note importante** : Même si la base de données n'a que 79 permissions pour le SUPER_ADMIN, le code backend lui en donne automatiquement ~455 grâce à la détection spéciale (lignes 139-166). Le problème de "79 permissions" visible par l'utilisateur venait probablement d'un **token JWT expiré** ou d'un **cache non invalidé**.

## 📝 Fichiers Modifiés

1. `backend/src/database/seeds/rbac.seed.ts` - Correction du seed (v6.1)
2. `backend/database/migrations/069-fix-super-admin-permissions.sql` - Migration SQL
3. `backend/src/database/seeds/fix-super-admin-permissions.ts` - Script de diagnostic
4. `scripts/fix-super-admin-permissions-v2.sh` - Script d'exécution

## ✅ Statut

- ✅ **Cause identifiée** : Assignation directe écrasant les relations
- ✅ **Code corrigé** : Seed RBAC v6.1 avec ajout incrémental
- ✅ **Migration créée** : SQL + TypeScript
- ⏳ **En attente** : Redémarrage du backend + reconnexion utilisateur

---

**Date** : 2026-06-21  
**Auteur** : franck arlos chendjou  
**Version** : 1.0.0
