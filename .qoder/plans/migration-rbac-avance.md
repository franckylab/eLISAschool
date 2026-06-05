# Migration Système RBAC Avancé eLISAschool

## Contexte

Le système de sécurité actuel d'eLISAschool utilise des **rôles et permissions hardcodés** dans des enums TypeScript, avec **un seul rôle par utilisateur** et **aucune possibilité de permissions personnalisées**. Cette analyse a révélé que le système ne permet pas de :
- Créer des rôles personnalisés (ex: "Enseignant Principal")
- Assigner des permissions spécifiques à un utilisateur
- Supporter le multi-rôles avec héritage
- Couvrir toutes les opérations CRUD des 20+ modules

**Objectif** : Migrer vers un système RBAC dynamique stocké en base de données, supportant rôles personnalisables, multi-rôles, permissions par utilisateur, et couverture complète de ~85 permissions.

---

## Architecture Actuelle (Limites)

### Fichiers Clés Actuels
- **Rôles/Permissions** : `shared/src/enums/roles.enum.ts` (9 rôles, ~30 permissions hardcodées)
- **Utilisateur** : `backend/src/modules/auth/entities/utilisateur.entity.ts` (champ `role: Role` unique)
- **JWT Payload** : `{sub, email, role, etablissementId}` (pas de permissions)
- **Guards** : `backend/src/modules/auth/guards/permission.guard.ts` (utilise `DEFAULT_ROLE_PERMISSIONS[role]`)
- **Middleware** : `backend/src/modules/auth/middlewares/role.middleware.ts` (`requireRoles`, `requireAccess`)

### Limites Identifiées
❌ Rôles non personnalisables (enum TypeScript)  
❌ Un seul rôle par utilisateur  
❌ Pas de permissions custom par utilisateur  
❌ ~55 permissions manquantes (élèves, classes, matières, années, etc.)  
❌ Pas d'héritage de rôles  
❌ Guards utilisent mapping statique  

---

## Plan d'Implémentation

### Phase 1 : Nouvelles Entités TypeORM (Fondation)

**Nouveaux fichiers à créer :**

1. **`backend/src/modules/auth/entities/permission.entity.ts`**
   - Table `permissions` : id, code (unique), libelle, description, module, action, actif
   - ~85 permissions au total

2. **`backend/src/modules/auth/entities/role.entity.ts`**
   - Table `roles` : id, code (unique), libelle, description, estSysteme, estActif, parentId (héritage), etablissementId

3. **`backend/src/modules/auth/entities/utilisateur-role.entity.ts`**
   - Table `utilisateur_roles` : id, utilisateurId, roleId, estPrincipal, dateAttribution, attribuePar

4. **`backend/src/modules/auth/entities/utilisateur-permission.entity.ts`**
   - Table `utilisateur_permissions` : id, utilisateurId, permissionId, type (GRANTED/DENIED), motif

5. **Modifier `backend/src/modules/auth/entities/utilisateur.entity.ts`**
   - Ajouter relations : `@OneToMany(() => UtilisateurRole)` et `@OneToMany(() => UtilisateurPermission)`
   - Conserver champ `role` actuel (backward compatibility)

**Relations ERD :**
```
utilisateurs 1───* utilisateur_roles *───1 roles
                                            │
                                            *───* role_permissions *───1 permissions
utilisateurs 1───* utilisateur_permissions *───1 permissions
roles *───1 roles (héritage via parentId)
```

---

### Phase 2 : Permissions Complètes (~85 total)

**Permissions existantes (~30)** : users, notes, bulletins, cantine, transport, materiel, clubs, documents, cartes, config, monitoring, messages, notifications, requetes, gamification, roles

**Nouvelles permissions (~55)** à ajouter :
- **eleves** : view, create, edit, delete, import, export
- **enseignants/personnel** : view, create, edit, delete, assign
- **classes** : view, create, edit, delete
- **matieres** : view, create, edit, delete, assign
- **annees-scolaires** : view, create, edit, delete, activer
- **periodes** : view, create, edit, delete, cloturer
- **cycles/niveaux** : view, create, edit, delete
- **orientation** : view, create, edit, valider
- **scoring** : view, configurer, generer
- **monitoring** : view, logs, export
- **etablissement** : view, edit
- **impressions** : view, gerer
- **notifications** : view, envoyer, configurer
- **messagerie** : view, envoyer, supprimer

---

### Phase 3 : Migration des Données

**Fichier : `backend/src/database/migrations/XXX-create-rbac-system.ts`**

Ordre des opérations :
1. Créer les 5 tables (permissions, roles, role_permissions, utilisateur_roles, utilisateur_permissions)
2. Insérer les 9 rôles système depuis l'enum actuel (estSysteme=true)
3. Insérer les ~85 permissions (parser module:action depuis les codes)
4. Peupler `role_permissions` depuis `DEFAULT_ROLE_PERMISSIONS` (mapping statique actuel)
5. Peupler `utilisateur_roles` : pour chaque utilisateur existant, créer entrée avec estPrincipal=true
6. Préserver le champ `role` sur utilisateurs (transition)

**Modifier : `backend/src/database/seeds/initial.seed.ts`**
- Ajouter fonction `seedRBAC()` pour initialiser rôles/permissions dans nouvelles DB

---

### Phase 4 : Service de Résolution des Permissions

**Fichier : `backend/src/modules/auth/services/permission-resolver.service.ts`**

**Algorithme :**
```
resolvePermissions(utilisateurId):
  1. Charger UtilisateurRole (principal + secondaires)
  2. Pour chaque rôle, charger permissions via role_permissions
  3. Si rôle a parent (héritage), charger récursivement permissions du parent
  4. Fusionner toutes les permissions (union)
  5. Appliquer permissions custom utilisateur :
     - GRANTED → Ajouter
     - DENIED → Retirer (override)
  6. Retourner Set<string> de codes
  7. Cache in-memory avec TTL 5min
```

**Méthodes :**
- `resolvePermissions(utilisateurId): Promise<Set<string>>`
- `hasPermission(utilisateurId, permission): Promise<boolean>`
- `hasAnyPermission(utilisateurId, permissions[]): Promise<boolean>`
- `hasAllPermissions(utilisateurId, permissions[]): Promise<boolean>`
- `invalidateCache(utilisateurId): void`
- `invalidateAllCache(): void`

**Stratégie de Cache :**
- Cache global permissions (refresh 5min ou invalidation manuelle)
- Cache par utilisateur (TTL 5min)
- Invalidation quand rôle/permission modifié

---

### Phase 5 : Mise à jour JWT et Auth

**Modifier : `backend/src/modules/auth/dto/auth.dto.ts`**
```typescript
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;            // Rôle principal (backward compat)
  roles?: string[];        // NOUVEAU : tous les codes de rôles
  permissions?: string[];  // NOUVEAU : permissions résolues au login
  etablissementId?: string;
}

export interface UtilisateurAuth {
  id: string;
  email: string;
  role: string;
  roles?: string[];        // Tous les rôles
  permissions?: string[];  // Permissions résolues
  etablissementId?: string;
}
```

**Modifier : `backend/src/modules/auth/services/auth.service.ts`**
- Dans `login()` : appeler `PermissionResolverService.resolvePermissions(utilisateur.id)`
- Inclure rôles et permissions dans payload JWT
- Dans `refreshTokens()` : re-résolver les permissions

---

### Phase 6 : Mise à jour Guards et Middlewares

**Modifier : `backend/src/modules/auth/guards/permission.guard.ts`**
```typescript
// Stratégie de fallback (backward compatibility)
function hasPermission(req, permission): boolean {
  // Mode 1 : permissions dans le JWT (nouveau système)
  if (req.utilisateur.permissions) {
    return req.utilisateur.permissions.includes(permission);
  }
  
  // Mode 2 : fallback sur ancien système statique
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[req.utilisateur.role];
  return rolePermissions?.includes(permission) || false;
}
```

**Modifier : `backend/src/modules/auth/middlewares/role.middleware.ts`**
```typescript
// Support multi-rôles
const userRoles = req.utilisateur.roles || [req.utilisateur.role];
const hasRole = roles.some(r => userRoles.includes(r));
```

---

### Phase 7 : API de Gestion RBAC

**Créer module : `backend/src/modules/rbac/`**

Structure :
```
rbac/
  controllers/
    roles.controller.ts
    permissions.controller.ts
  services/
    roles.service.ts
    permissions.service.ts
  dto/
    create-role.dto.ts
    update-role.dto.ts
    assign-permissions.dto.ts
    assign-role.dto.ts
  index.ts
```

**Endpoints Roles** (protégé par SUPER_ADMIN ou permission `roles:manage`) :
- `GET /api/rbac/roles` - Lister tous les rôles
- `GET /api/rbac/roles/:id` - Détail d'un rôle
- `POST /api/rbac/roles` - Créer un rôle custom
- `PATCH /api/rbac/roles/:id` - Modifier un rôle custom
- `DELETE /api/rbac/roles/:id` - Supprimer un rôle custom (pas système)
- `POST /api/rbac/roles/:id/permissions` - Assigner permissions à un rôle
- `GET /api/rbac/roles/:id/permissions` - Lister permissions d'un rôle

**Endpoints Permissions** :
- `GET /api/rbac/permissions` - Lister toutes les permissions
- `POST /api/rbac/permissions` - Créer une permission custom

**Endpoints Utilisateur Roles/Permissions** (dans utilisateurs.controller.ts) :
- `POST /api/utilisateurs/:id/roles` - Assigner un rôle (principal ou secondaire)
- `DELETE /api/utilisateurs/:id/roles/:roleId` - Retirer un rôle
- `POST /api/utilisateurs/:id/permissions` - Permission custom (GRANTED/DENIED)
- `DELETE /api/utilisateurs/:id/permissions/:permId` - Retirer permission custom
- `GET /api/utilisateurs/:id/effective-permissions` - Voir permissions effectives

---

### Phase 8 : Mise à jour Utilisateurs Service

**Modifier : `backend/src/modules/utilisateurs/services/utilisateurs.service.ts`**
- Créer : accepter `roleIds[]` au lieu de `role` unique
- Premier rôle de la liste = rôle principal
- Champ `role` (legacy) = code du rôle principal

**Modifier : `backend/src/modules/utilisateurs/dto/utilisateur.dto.ts`**
- Ajouter dans response : `roles: {code, libelle, estPrincipal}[]`
- Optionnel : `effectivePermissions: string[]`

---

### Phase 9 : Nettoyage Progressif (Post-Migration)

Après migration complète et testée :
1. Déprécier champ `role` sur Utilisateur (garder mais marquer comme déprécié)
2. Supprimer `DEFAULT_ROLE_PERMISSIONS` du code (remplacé par données en base)
3. Garder enums `Role` et `Permission` dans `shared/` comme constantes de référence uniquement
4. Optionnel : supprimer enum Role et utiliser string types

---

## Estimation de l'Effort

| Phase | Description | Fichiers | Effort |
|-------|-------------|----------|--------|
| 1 | Créer 5 entités TypeORM | 5 créés, 1 modifié | 2h |
| 2 | Définir ~85 permissions | 1 fichier (seed) | 1h |
| 3 | Écrire migration DB | 1 migration, 1 seed | 2h |
| 4 | Service PermissionResolver + cache | 1 créé | 3h |
| 5 | Mise à jour JWT + auth.service | 3 modifiés | 2h |
| 6 | Mise à jour guards/middlewares | 2 modifiés | 2h |
| 7 | API CRUD roles/permissions | ~8 créés | 6h |
| 8 | Update utilisateurs service | 2 modifiés | 2h |
| 9 | Tests + validation | - | 4h |

**Total estimé : ~24 heures de développement**

---

## Points d'Attention Critiques

### Performance
- **JWT size** : ~85 permissions = ~1-2KB supplémentaires. Acceptable.
- **Cache obligatoire** : Sans cache, chaque vérification = 3-4 requêtes SQL. Resolver avec cache in-memory TTL 5min essentiel.
- **Invalidation selective** : Quand un rôle est modifié, invalider cache de TOUS les utilisateurs ayant ce rôle.

### Sécurité
- **Bypass SUPER_ADMIN** : Conserver le bypass actuel, mais basé sur le code du rôle en base, pas sur enum.
- **DENIED override** : Permissions DENIED custom priment toujours sur permissions héritées (même pour SUPER_ADMIN).
- **Scope établissement** : Un rôle avec etablissementId ne s'applique qu'aux utilisateurs de cet établissement.
- **Audit** : Logger toute modification de rôle/permission dans l'audit log existant.

### Backward Compatibility
- **Pendant transition** : Guards supportent les 2 modes (permissions dans JWT vs enum statique).
- **Anciens tokens** : Tokens sans champ `permissions` utilisent le fallback.
- **Champ `role`** : Conservé sur Utilisateur pendant au moins 2 sprints après migration.

---

## Vérification

### Tests à Effectuer

1. **Migration** :
   - Exécuter la migration sur une copie de la DB de production
   - Vérifier que tous les utilisateurs ont un rôle principal assigné
   - Vérifier que les 9 rôles système ont les bonnes permissions

2. **Authentification** :
   - Tester login avec ancien compte → vérifier que permissions sont dans JWT
   - Tester refresh token → vérifier re-résolution des permissions
   - Tester avec token ancien format (sans permissions) → vérifier fallback

3. **Guards** :
   - Tester requireRoles() avec multi-rôles
   - Tester requirePermissions() avec permissions custom
   - Tester requireAccess() avec rôles ET permissions
   - Tester SUPER_ADMIN bypass

4. **API RBAC** :
   - Créer un rôle custom avec permissions spécifiques
   - Assigner le rôle à un utilisateur (secondaire)
   - Vérifier que l'utilisateur a les permissions du rôle custom + rôle principal
   - Assigner une permission DENIED → vérifier qu'elle est retirée

5. **Performance** :
   - Mesurer temps de résolution des permissions (avec et sans cache)
   - Vérifier taille des JWT (avant/après)
   - Tester invalidation du cache après modification de rôle

6. **Scénarios Métier** :
   - Créer "Enseignant Principal" = ENSEIGNANT + permissions supplémentaires
   - Assigner à un utilisateur : rôle ENSEIGNANT (principal) + ENSEIGNANT_PRINCIPAL (secondaire)
   - Vérifier que l'utilisateur peut voir élèves, enseignants, ET ajouter notes

---

## Fichiers à Créer

1. `backend/src/modules/auth/entities/permission.entity.ts`
2. `backend/src/modules/auth/entities/role.entity.ts`
3. `backend/src/modules/auth/entities/utilisateur-role.entity.ts`
4. `backend/src/modules/auth/entities/utilisateur-permission.entity.ts`
5. `backend/src/modules/auth/services/permission-resolver.service.ts`
6. `backend/src/database/migrations/XXX-create-rbac-system.ts`
7. `backend/src/modules/rbac/controllers/roles.controller.ts`
8. `backend/src/modules/rbac/controllers/permissions.controller.ts`
9. `backend/src/modules/rbac/services/roles.service.ts`
10. `backend/src/modules/rbac/services/permissions.service.ts`
11. `backend/src/modules/rbac/dto/create-role.dto.ts`
12. `backend/src/modules/rbac/dto/update-role.dto.ts`
13. `backend/src/modules/rbac/dto/assign-permissions.dto.ts`
14. `backend/src/modules/rbac/dto/assign-role.dto.ts`
15. `backend/src/modules/rbac/index.ts`

## Fichiers à Modifier

1. `backend/src/modules/auth/entities/utilisateur.entity.ts` (ajouter relations)
2. `backend/src/modules/auth/entities/index.ts` (export nouvelles entités)
3. `backend/src/modules/auth/dto/auth.dto.ts` (JwtPayload + UtilisateurAuth)
4. `backend/src/modules/auth/services/auth.service.ts` (résolver permissions au login)
5. `backend/src/modules/auth/guards/permission.guard.ts` (utiliser permissions dynamique)
6. `backend/src/modules/auth/middlewares/role.middleware.ts` (utiliser rôles multiples)
7. `backend/src/modules/auth/middlewares/auth.middleware.ts` (interface UtilisateurAuth)
8. `backend/src/database/seeds/initial.seed.ts` (ajouter seed RBAC)
9. `backend/src/modules/utilisateurs/services/utilisateurs.service.ts` (support multi-rôles)
10. `backend/src/modules/utilisateurs/controllers/utilisateurs.controller.ts` (endpoints assignation)
11. `shared/src/enums/roles.enum.ts` (marquer comme déprécié - commentaires)
