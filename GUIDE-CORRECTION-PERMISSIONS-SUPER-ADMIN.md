# Guide de Correction - Permissions SUPER_ADMIN

## Problème

Vous rencontrez une erreur **403 Forbidden** lors de l'accès à `/api/eleves` alors que vous êtes connecté avec l'utilisateur `super_admin`.

```
GET http://localhost:3001/api/eleves?page=1&limit=20 403 (Forbidden)
```

## Cause Racine

Le système RBAC (Role-Based Access Control) d'eLISAschool fonctionne en **3 niveaux** :

1. **Rôle principal** dans la table `utilisateurs` (colonne `role`)
2. **Rôles utilisateur** dans la table `utilisateur_roles` (système multi-rôles)
3. **Permissions** dans la table `role_permissions` (mapping rôle → permissions)

Le problème vient probablement de :
- ❌ L'utilisateur n'a **pas d'entrée dans `utilisateur_roles`**
- ❌ Les permissions du rôle SUPER_ADMIN ne sont **pas complètement attribuées**
- ❌ Le **JWT est obsolète** et ne contient pas les permissions à jour

## Solution Rapide

### Option 1 : Script Automatisé (Recommandé)

```bash
cd /home/franckylab/projets/eLISAschool
./scripts/fix-super-admin-permissions.sh
```

Le script va :
1. ✅ Diagnostiquer l'état actuel des permissions
2. ✅ Attribuer toutes les permissions au rôle SUPER_ADMIN
3. ✅ Vérifier/créer l'entrée dans `utilisateur_roles`
4. ✅ Afficher un rapport de vérification

### Option 2 : Correction Manuelle via SQL

1. **Connectez-vous à la base de données** :

```bash
psql -h localhost -p 5432 -U postgres -d elisaschool
```

2. **Identifiez l'email de votre super_admin** :

```sql
SELECT id, email, role 
FROM utilisateurs 
WHERE role = 'SUPER_ADMIN';
```

3. **Attribuez toutes les permissions au rôle SUPER_ADMIN** :

```sql
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
  AND p.actif = true
  AND NOT EXISTS (
    SELECT 1 
    FROM role_permissions rp 
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  );
```

4. **Vérifiez/créez l'entrée dans `utilisateur_roles`** :

```sql
-- Remplacez 'votre_email@elisaschool.com' par l'email réel
DO $$
DECLARE
    super_admin_role_id UUID;
    user_id UUID;
BEGIN
    -- Récupérer les IDs
    SELECT id INTO super_admin_role_id FROM roles WHERE code = 'SUPER_ADMIN';
    SELECT id INTO user_id FROM utilisateurs WHERE email = 'votre_email@elisaschool.com';
    
    -- Créer l'attribution si elle n'existe pas
    IF user_id IS NOT NULL AND super_admin_role_id IS NOT NULL THEN
        INSERT INTO utilisateur_roles ("utilisateurId", "roleId", "estPrincipal", "actif")
        SELECT user_id, super_admin_role_id, true, true
        WHERE NOT EXISTS (
            SELECT 1 
            FROM utilisateur_roles 
            WHERE "utilisateurId" = user_id AND "roleId" = super_admin_role_id
        );
        
        -- Mettre à jour le rôle principal
        UPDATE utilisateurs 
        SET role = 'SUPER_ADMIN'
        WHERE id = user_id;
    END IF;
END $$;
```

5. **Vérifiez le résultat** :

```sql
-- Compter les permissions du SUPER_ADMIN
SELECT COUNT(*) as permissions_super_admin
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.code = 'SUPER_ADMIN' AND p.actif = true;

-- Vérifier les rôles de l'utilisateur
SELECT u.email, r.code as role, ur."estPrincipal"
FROM utilisateurs u
JOIN utilisateur_roles ur ON u.id = ur."utilisateurId"
JOIN roles r ON ur."roleId" = r.id
WHERE u.email = 'votre_email@elisaschool.com';
```

### Option 3 : Re-seed Complet

Si vous voulez réinitialiser complètement le système RBAC :

```bash
cd /home/franckylab/projets/eLISAschool/backend
npm run seed:rbac
```

⚠️ **Attention** : Cette option peut écraser des personnalisations de permissions.

## Étape CRITIQUE : Reconnexion

Après avoir appliqué les corrections SQL, vous **DEVEZ** vous reconnecter pour que le JWT soit régénéré avec les nouvelles permissions.

### Pourquoi ?

Le JWT (token d'authentification) est généré **une seule fois** lors de la connexion et contient :
- Le rôle principal
- **TOUS les rôles** (tableau `roles`)
- **TOUTES les permissions** résolues (tableau `permissions`)

Si vous ne vous reconnectez pas, l'ancien JWT n'aura pas les nouvelles permissions.

### Comment ?

1. **Déconnectez-vous** de l'application frontend
2. **Supprimez le localStorage** (optionnel mais recommandé) :
   ```javascript
   localStorage.clear();
   ```
3. **Reconnectez-vous** avec votre compte `super_admin`
4. **Testez l'accès** à `/api/eleves`

## Vérification

### 1. Vérifier le contenu du JWT

Ouvrez la console développeur (F12) → Application → Local Storage et decodez le token :

```javascript
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Rôles:', payload.roles);
console.log('Permissions:', payload.permissions);
```

Vous devriez voir :
- `roles: ["SUPER_ADMIN", ...]`
- `permissions: [...]` (liste complète de toutes les permissions)

### 2. Tester l'API

```bash
# Récupérer le token
TOKEN=$(cat ~/.elisaschool-token)  # Ou copier depuis localStorage

# Tester l'API
curl -X GET "http://localhost:3001/api/eleves?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Vérifier les logs backend

```bash
tail -f backend/logs/app.log | grep "Permissions résolues"
```

Vous devriez voir :
```
🔐 Permissions résolues pour utilisateur XXX: YYY permissions
```

## Compréhension du Système RBAC

### Architecture

```
Utilisateur
  ├── role (colonne principale) → "SUPER_ADMIN"
  └── utilisateur_roles (table de jointure)
       └── Role (SUPER_ADMIN)
            └── role_permissions (table de jointure)
                 └── Permission (eleves:view, eleves:create, ...)
```

### Résolution des Permissions

Lors de la connexion :

1. **Chargement des rôles** depuis `utilisateur_roles`
2. **Résolution récursive** des permissions de chaque rôle
3. **Application des overrides** (permissions personnalisées accordées/refusées)
4. **Mise en cache** (5 minutes TTL)
5. **Injection dans le JWT**

### Middleware de Vérification

```typescript
// Dans eleves.controller.ts
router.get('/', 
  authMiddleware,  // Vérifie le JWT
  requireRoles(Role.ADMIN, Role.SUPER_ADMIN, ...),  // Vérifie le rôle
  async (req, res) => { ... }
);
```

Le middleware `requireRoles` vérifie si l'un des rôles requis est présent dans `req.utilisateur.roles`.

## Diagnostic Avancé

### Vérifier le cache Redis

```bash
redis-cli
> GET permissions:<utilisateur_id>
```

### Forcer l'invalidation du cache

```sql
-- Supprimer toutes les entrées de cache (Redis si configuré)
-- Le cache sera régénéré lors de la prochaine connexion
```

### Vérifier les logs d'audit

```sql
SELECT * 
FROM audit_logs 
WHERE "utilisateurId" = '<id_du_super_admin>'
  AND action = 'ACCESS_DENIED'
ORDER BY "createdAt" DESC
LIMIT 10;
```

## Problèmes Fréquents

### ❌ Toujours 403 après correction

**Cause** : JWT obsolète  
**Solution** : Se déconnecter et se reconnecter

### ❌ L'utilisateur n'apparaît pas dans utilisateur_roles

**Cause** : Migration incomplète  
**Solution** : Exécuter le script SQL de correction (étape 4 ci-dessus)

### ❌ Permissions incomplètes

**Cause** : Seed RBAC incomplet  
**Solution** : 
```bash
npm run seed:rbac
# OU exécuter le script SQL de correction
```

### ❌ Erreur "No metadata for Permission was found"

**Cause** : Tentative d'accès avant initialisation de la DB  
**Solution** : Redémarrer le backend après les modifications SQL

## Support

Si le problème persiste :

1. Vérifiez les logs backend : `tail -f backend/logs/app.log`
2. Vérifiez les logs frontend : Console navigateur (F12)
3. Exécutez le script de diagnostic :
   ```bash
   ./scripts/fix-super-admin-permissions.sh
   ```
4. Consultez la documentation RBAC : `docs/rbac-system.md`

---

**Version** : 1.0.0  
**Auteur** : franck arlos chendjou  
**Date** : 2026-06-11
