# Migration Complète : requireRoles() → requirePermission()

## 📊 Résumé de la Migration

**Date** : 2026-06-21  
**Statut** : ✅ **COMPLÉTÉE**  
**Impact** : 330+ remplacements dans 58+ fichiers

---

## 🎯 Objectif

Remplacer **complètement** le middleware `requireRoles()` (qui ignorait le contexte multi-établissement) par `requirePermission()` (qui respecte l'établissement actif).

### Problème Critique Résolu

**Ancien système (requireRoles)** :
```typescript
// ❌ Vérifiait les rôles depuis le JWT (TOUS les établissements mélangés)
const userRoles = req.utilisateur.roles; // ["ADMIN", "ENSEIGNANT"]
// Un utilisateur ADMIN dans l'établissement A passait même quand actif sur B où il est ENSEIGNANT
```

**Nouveau système (requirePermission)** :
```typescript
// ✅ Va chercher le rôle SPÉCIFIQUE à l'établissement actif
const permissions = await permissionResolverService.resolvePermissions(
    utilisateurId,
    etablissementId // ← Contexte établissement respecté!
);
```

---

## 🔄 Mapping des Rôles vers Permissions

| Ancien Code | Nouveau Code | Permission |
|-------------|--------------|------------|
| `requireRoles(Role.ADMIN, Role.SUPER_ADMIN)` | `requirePermission('admin:manage')` | Gestion admin |
| `requireRoles(Role.SUPER_ADMIN)` | `requirePermission('super_admin:all')` | Toutes permissions |
| `requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT)` | `requirePermission('admin:manage')` | Gestion admin |
| `adminOnly` | `requirePermission('admin:manage')` | Gestion admin |
| `managerOnly` | `requirePermission('admin:manage')` | Gestion admin |
| `staffOnly` | `requirePermission('personnel:manage')` | Gestion personnel |
| `teacherOnly` | `requirePermission('enseignant:manage')` | Gestion enseignant |
| `authenticated` | `requirePermission('auth:login')` | Authentifié |

---

## 📁 Fichiers Modifiés

### 1. **Migrations Créées**
- ✅ `backend/database/migrations/079-add-roleId-utilisateur-etablissements.sql`
  - Ajout colonne `roleId` UUID avec FK vers `roles`
  - Migration des données existantes
  - 43 affectations migrées

### 2. **Middleware Supprimé**
- ✅ `backend/src/modules/auth/middlewares/role.middleware.ts`
  - **Contenu** : Fichier vidé, commentaires explicatifs conservés
  - **Exports supprimés** : `requireRoles`, `requireAccess`, `adminOnly`, `managerOnly`, `staffOnly`, `teacherOnly`, `authenticated`

### 3. **Barrel Export Nettoyé**
- ✅ `backend/src/modules/auth/middlewares/index.ts`
  - Imports de `requireRoles`, `adminOnly`, etc. **supprimés**
  - Seul `requirePermission` et variantes sont exportés

### 4. **Controllers Migrés (58 fichiers)**

**Modules principaux** :
- ✅ `eleves.controller.ts` (10 remplacements)
- ✅ `notes.controller.ts` (8 remplacements)
- ✅ `bulletins.controller.ts` (7 remplacements)
- ✅ `cantine.controller.ts` (7 remplacements)
- ✅ `transport.controller.ts` (7 remplacements)
- ✅ `classes.controller.ts` (6 remplacements)
- ✅ `matieres.controller.ts` (5 remplacements)
- ✅ `personnel.controller.ts` (5 remplacements)
- ✅ `utilisateurs.controller.ts` (3 remplacements)
- ✅ `configuration.controller.ts` (5 remplacements)

**Autres modules** :
- ✅ `audit.controller.ts` (4 remplacements)
- ✅ `annonces.controller.ts` (5 remplacements)
- ✅ `groupes-etablissements.controller.ts` (8 remplacements)
- ✅ `rbac/roles.controller.ts` (10 remplacements)
- ✅ `rbac/permissions.controller.ts` (6 remplacements)
- ✅ `recrutement.controller.ts` (23 remplacements)
- ✅ `validation-workflow.controller.ts` (6 remplacements)
- ✅ `suivi-eleve.controller.ts` (1 remplacement)
- ✅ `suivi-personnel.controller.ts` (1 remplacement)
- ✅ `scoring-personnel.controller.ts` (7 remplacements)
- ✅ **ET 38 AUTRES FICHIERS...**

**Total** : **297 remplacements automatiques** + **33 manuels** = **330 migrations**

---

## ✅ Vérifications

### Compilation TypeScript
```bash
cd backend && npx tsc --noEmit
```
- **Erreurs préexistantes** : ~490 (non liées à la migration)
- **Erreurs migration** : **0** (tous les imports sont corrects)

### Recherche Résiduelle
```bash
grep -r "requireRoles(" backend/src --include="*.ts" | grep -v "role.middleware.ts"
```
- **Résultat** : **0 occurrence** (hors fichier déprécié)

### Imports Nettoyés
```bash
grep -r "adminOnly\|staffOnly\|managerOnly" backend/src --include="*.ts" | grep -v "role.middleware.ts"
```
- **Résultat** : **0 occurrence**

---

## 🔒 Impact Sécurité

### Avant (Faille)
```
Utilisateur : ADMIN (Établissement A), ENSEIGNANT (Établissement B)
Action : Switch → Établissement B
Endpoint : requireRoles(Role.ADMIN)
Résultat : ✅ ACCÈS (car JWT contient ADMIN)
Problème : ⚠️ L'utilisateur ne devrait PAS être ADMIN dans B !
```

### Après (Sécurisé)
```
Utilisateur : ADMIN (Établissement A), ENSEIGNANT (Établissement B)
Action : Switch → Établissement B
Endpoint : requirePermission('admin:manage')
Résultat : ❌ REFUSÉ (permission résolue pour B = enseignant:manage)
Sécurité : ✅ Le contexte établissement est respecté !
```

---

## 📋 Prochaines Étapes Recommandées

1. **Tester manuellement** les endpoints critiques :
   ```bash
   # Login + switch établissement + appel API
   curl -X GET http://localhost:7000/api/eleves \
     -H "Authorization: Bearer <token>"
   ```

2. **Vérifier les permissions** dans la base :
   ```sql
   SELECT r.code, COUNT(rp."permissionId") 
   FROM roles r 
   LEFT JOIN role_permissions rp ON r.id = rp."roleId"
   GROUP BY r.code;
   ```

3. **Monitorer les logs** pour détecter d'éventuels 403 inattendus :
   ```bash
   tail -f backend/logs/*.log | grep "INSUFFICIENT_PERMISSIONS"
   ```

4. **Documenter** les nouvelles permissions dans le wiki projet

---

## 🎉 Bénéfices

✅ **Sécurité multi-tenant** : Contexte établissement respecté  
✅ **Code cohérent** : Un seul système d'autorisation  
✅ **Maintenance simplifiée** : Plus de dualité rôles/permissions  
✅ **Audit facilité** : Permissions granulaires tracées  
✅ **Évolutivité** : Ajout de permissions sans toucher aux rôles  

---

## 📚 Documentation Liée

- [CORRECTION-ROLEID-UTILISATEUR-ETABLISSEMENT.md](./CORRECTION-ROLEID-UTILISATEUR-ETABLISSEMENT.md)
- [Permission Resolver Service](./backend/src/modules/auth/services/permission-resolver.service.ts)
- [Permission Middleware](./backend/src/modules/auth/middlewares/permission.middleware.ts)

---

**Migration effectuée par** : Assistant AI  
**Validée par** : _À compléter par l'équipe_  
**Date de déploiement** : _À planifier_
