# Système RBAC Avancé - eLISAschool v2.0

## Vue d'ensemble

Le système RBAC (Role-Based Access Control) d'eLISAschool a été complètement repensé pour offrir une gestion **dynamique**, **flexible** et **granulaire** des permissions et des rôles.

### 🎯 Fonctionnalités Principales

✅ **Rôles dynamiques en base de données** (plus d'enum hardcodé)  
✅ **Multi-rôles par utilisateur** (rôle principal + rôles secondaires)  
✅ **Permissions personnalisées par utilisateur** (GRANTED/DENIED)  
✅ **Héritage de rôles** (un rôle peut hériter d'un rôle parent)  
✅ **~85 permissions granulaires** couvrant tous les modules  
✅ **Cache intelligent** (TTL 5min) pour les performances  
✅ **Backward compatibility** avec l'ancien système  

---

## 📊 Architecture

### Entités

```
┌─────────────────┐
│   Utilisateur   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────────┐  ┌──────────────────────┐
│  Role    │  │ UtilisateurPermission│
└────┬─────┘  └──────────┬───────────┘
     │                   │
     │        ┌──────────┘
     ▼        ▼
┌──────────────────┐
│   Permission     │
└──────────────────┘
```

### Tables Créées

1. **`permissions`** : Permissions granulaires (format: `module:action`)
2. **`roles`** : Rôles dynamiques avec support d'héritage
3. **`role_permissions`** : Table de jointure rôle ↔ permissions
4. **`utilisateur_roles`** : Table de jointure utilisateur ↔ rôles (multi-rôles)
5. **`utilisateur_permissions`** : Permissions personnalisées utilisateur (GRANTED/DENIED)

---

## 🔑 Permissions

### Format

Toutes les permissions suivent le format : `module:action`

**Exemples :**
- `notes:create` - Créer des notes
- `eleves:view` - Voir les élèves
- `bulletins:generate` - Générer des bulletins
- `roles:manage` - Gérer les rôles

### Liste Complète (~85 permissions)

#### Utilisateurs & Rôles
- `utilisateurs:view`, `utilisateurs:create`, `utilisateurs:edit`, `utilisateurs:delete`
- `roles:view`, `roles:manage`

#### Académique
- `eleves:view`, `eleves:create`, `eleves:edit`, `eleves:delete`, `eleves:import`, `eleves:export`
- `enseignants:view`, `enseignants:create`, `enseignants:edit`, `enseignants:delete`, `enseignants:assign`
- `classes:view`, `classes:create`, `classes:edit`, `classes:delete`
- `matieres:view`, `matieres:create`, `matieres:edit`, `matieres:delete`, `matieres:assign`
- `annees:view`, `annees:create`, `annees:edit`, `annees:delete`, `annees:activate`
- `periodes:view`, `periodes:create`, `periodes:edit`, `periodes:delete`, `periodes:activate`
- `cycles:view`, `cycles:create`, `cycles:edit`, `cycles:delete`
- `niveaux:view`, `niveaux:create`, `niveaux:edit`, `niveaux:delete`

#### Notes & Bulletins
- `notes:view`, `notes:create`, `notes:edit`, `notes:delete`, `notes:validate`
- `bulletins:view`, `bulletins:generate`, `bulletins:print`

#### Orientation & Scoring
- `orientation:view`, `orientation:manage`, `orientation:recommend`, `orientation:decide`
- `scoring:view`, `scoring:calculate`, `scoring:configure`

#### Monitoring & Configuration
- `monitoring:view`, `monitoring:manage`, `monitoring:export`
- `etablissement:view`, `etablissement:manage`

#### Autres Modules
- `impressions:view`, `impressions:manage`
- `notifications:view`, `notifications:send`, `notifications:manage`
- `messagerie:view`, `messagerie:send`, `messagerie:manage`
- `requetes:*` (complément de permissions)
- `cantine:*`, `transport:*`, `materiel:*`, `clubs:*`, `cartes:*`, `gamification:*`

---

## 👥 Rôles Système (9 rôles par défaut)

| Rôle | Code | Description | Permissions Clés |
|------|------|-------------|------------------|
| Super Admin | `SUPER_ADMIN` | Accès total | Toutes les permissions |
| Chef d'Établissement | `CHEF_ETABLISSEMENT` | Direction | Gestion complète établissement |
| Administrateur | `ADMIN` | Administration | Gestion utilisateurs, configuration |
| Enseignant Principal | `ENSEIGNANT_PRINCIPAL` | Enseignant + responsabilités | Notes + Gestion classe |
| Enseignant | `ENSEIGNANT` | Enseignement | Notes, bulletins (sa classe) |
| Parent | `PARENT` | Parent d'élève | Voir enfants, bulletins |
| Élève | `ELEVE` | Étudiant | Voir notes, bulletins |
| Personnel | `PERSONNEL` | Staff non-enseignant | Permissions limitées |
| Censeur | `CENSEUR` | Discipline | Gestion discipline, absences |

---

## 🎨 Fonctionnalités Avancées

### 1. Multi-Rôles

Un utilisateur peut avoir **plusieurs rôles** :

```json
{
  "utilisateurId": "uuid-123",
  "roles": [
    { "code": "ENSEIGNANT", "estPrincipal": true },
    { "code": "CENSEUR", "estPrincipal": false }
  ]
}
```

**Résultat** : L'utilisateur a les permissions **combinées** de ses deux rôles.

### 2. Permissions Personnalisées

On peut **ajouter** ou **retirer** des permissions spécifiques à un utilisateur :

```json
{
  "permissionId": "uuid-perm",
  "type": "GRANTED"  // ou "DENIED"
}
```

- **GRANTED** : Ajoute la permission (même si le rôle ne l'a pas)
- **DENIED** : Retire la permission (override le rôle)

**Exemple** :
```
Enseignant + GRANT(roles:manage) → Peut gérer les rôles
Enseignant + DENY(notes:delete)  → Ne peut PAS supprimer de notes
```

### 3. Héritage de Rôles

Un rôle peut hériter des permissions d'un rôle parent :

```
ENSEIGNANT_PRINCIPAL (parent: ENSEIGNANT)
  → Hérite toutes les permissions d'ENSEIGNANT
  → Plus ses permissions spécifiques
```

---

## 🔐 Algorithme de Résolution des Permissions

```typescript
1. Charger tous les rôles de l'utilisateur
2. Pour chaque rôle :
   a. Charger ses permissions directes
   b. Si le rôle a un parent, charger récursivement les permissions du parent
3. Fusionner toutes les permissions dans un Set
4. Appliquer les permissions personnalisées :
   - GRANTED → Ajouter au Set
   - DENIED  → Retirer du Set
5. Cacher le résultat (TTL 5min)
6. Retourner le Set final
```

---

## 🚀 API Endpoints

### Gestion des Rôles

```
GET    /api/rbac/roles                      # Lister tous les rôles
GET    /api/rbac/roles/:id                  # Voir un rôle
POST   /api/rbac/roles                      # Créer un rôle
PATCH  /api/rbac/roles/:id                  # Modifier un rôle
DELETE /api/rbac/roles/:id                  # Supprimer un rôle
GET    /api/rbac/roles/:id/permissions      # Voir permissions d'un rôle
POST   /api/rbac/roles/:id/permissions      # Assigner permissions à un rôle
GET    /api/rbac/roles/:id/users            # Voir utilisateurs avec ce rôle
```

### Gestion des Permissions

```
GET    /api/rbac/permissions                # Lister toutes les permissions
GET    /api/rbac/permissions/modules        # Grouper par module
GET    /api/rbac/permissions/:id            # Voir une permission
POST   /api/rbac/permissions                # Créer une permission
PATCH  /api/rbac/permissions/:id            # Modifier une permission
DELETE /api/rbac/permissions/:id            # Supprimer une permission
```

### Gestion des Rôles/Permissions Utilisateur

```
GET    /api/rbac/users/:userId/roles                    # Rôles d'un utilisateur
POST   /api/rbac/users/:userId/roles                    # Assigner un rôle
DELETE /api/rbac/users/:userId/roles/:roleId            # Retirer un rôle
PUT    /api/rbac/users/:userId/roles/replace            # Remplacer tous les rôles
GET    /api/rbac/users/:userId/permissions              # Permissions custom
GET    /api/rbac/users/:userId/permissions/effective    # Permissions effectives
POST   /api/rbac/users/:userId/permissions              # Assigner permission custom
DELETE /api/rbac/users/:userId/permissions/:permissionId # Retirer permission custom
GET    /api/rbac/users/:userId/permissions/check/:code  # Vérifier une permission
```

---

## 📝 Exemples d'Utilisation

### Créer un rôle personnalisé

```bash
curl -X POST http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "COORDINATEUR",
    "libelle": "Coordinateur Pédagogique",
    "description": "Coordinateur avec accès aux notes et bulletins",
    "permissionIds": ["uuid-1", "uuid-2", "uuid-3"]
  }'
```

### Assigner un rôle à un utilisateur

```bash
curl -X POST http://localhost:3000/api/rbac/users/user-123/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "uuid-role",
    "estPrincipal": true,
    "motif": "Promotion interne"
  }'
```

### Ajouter une permission personnalisée

```bash
curl -X POST http://localhost:3000/api/rbac/users/user-123/permissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionId": "uuid-permission",
    "type": "GRANTED",
    "motif": "Accès temporaire pour projet spécial"
  }'
```

---

## ⚡ Performances

### Cache

- **TTL** : 5 minutes
- **Scope** : Par utilisateur
- **Invalidation** :
  - Automatique après modification de rôle/permission
  - Manuelle via API si nécessaire

### Benchmark Estimé

| Opération | Sans Cache | Avec Cache |
|-----------|-----------|------------|
| Résolution permissions | ~50ms | ~2ms |
| Login (avec résolution) | ~100ms | ~50ms |
| Vérification permission | ~5ms | <1ms |

---

## 🔄 Migration depuis l'Ancien Système

### Étapes Automatiques

1. **Seed RBAC** : Crée les 9 rôles système et ~85 permissions
2. **Migration des utilisateurs** : Copie `role` → `utilisateur_roles` avec `estPrincipal=true`
3. **Mapping automatique** : Assigne les permissions aux rôles via `DEFAULT_ROLE_PERMISSIONS`
4. **Backward compat** : Les guards supportent l'ancien et le nouveau système

### Vérification

```bash
# Vérifier que les rôles sont créés
curl http://localhost:3000/api/rbac/roles

# Vérifier les permissions d'un utilisateur
curl http://localhost:3000/api/rbac/users/:id/permissions/effective
```

---

## 🛡️ Sécurité

### Protection des Rôles Système

- Les rôles avec `estSysteme=true` **ne peuvent pas** être modifiés ou supprimés
- Seules leurs permissions peuvent être ajustées (via seed)

### Validation des Données

- Tous les DTOs utilisent **Zod** pour la validation
- Codes de rôle : majuscules + underscores uniquement (`^[A-Z_]+$`)
- UUIDs validés pour tous les IDs

### Audit

- Toutes les actions RBAC sont loguées avec `logger.info()`
- Traçabilité : `attribuePar`, `dateAttribution`, `motif`

---

## 📦 Structure du Module

```
backend/src/modules/rbac/
├── controllers/
│   ├── roles.controller.ts          # CRUD rôles
│   ├── permissions.controller.ts    # CRUD permissions
│   └── user-roles.controller.ts     # Gestion rôles/permissions utilisateur
├── services/
│   ├── roles.service.ts             # Logique métier rôles
│   ├── permissions.service.ts       # Logique métier permissions
│   └── user-roles.service.ts        # Assignation rôles/permissions
├── dto/
│   └── create-role.dto.ts           # Schémas de validation Zod
└── index.ts                         # Point d'entrée du module
```

---

## 🎯 Cas d'Usage

### Scénario 1 : Enseignant avec responsabilités temporaires

**Problème** : Un enseignant doit pouvoir valider des notes pendant 1 mois.

**Solution** :
```bash
# Ajouter la permission temporairement
POST /api/rbac/users/teacher-123/permissions
{
  "permissionId": "uuid-notes-validate",
  "type": "GRANTED",
  "motif": "Remplacement coordinateur - Mars 2026"
}

# Retirer après 1 mois
DELETE /api/rbac/users/teacher-123/permissions/uuid-notes-validate
```

### Scénario 2 : Créer un rôle sur mesure

**Problème** : Besoin d'un rôle "Assistant Administratif" avec accès limité.

**Solution** :
```bash
# 1. Créer le rôle
POST /api/rbac/roles
{
  "code": "ASSISTANT_ADMIN",
  "libelle": "Assistant Administratif",
  "permissionIds": [
    "uuid-eleves-view",
    "uuid-impressions-view",
    "uuid-messagerie-send"
  ]
}

# 2. Assigner à l'utilisateur
POST /api/rbac/users/user-456/roles
{
  "roleId": "uuid-new-role",
  "estPrincipal": true
}
```

### Scénario 3 : Restreindre un utilisateur spécifique

**Problème** : Un enseignant ne doit PAS pouvoir supprimer de notes (mais son rôle le permet).

**Solution** :
```bash
# Override avec DENIED
POST /api/rbac/users/teacher-789/permissions
{
  "permissionId": "uuid-notes-delete",
  "type": "DENIED",
  "motif": "Restriction disciplinaire"
}
```

---

## 🔮 Évolutions Futures Possibles

- [ ] Permissions conditionnelles (basées sur le contexte)
- [ ] Workflows d'approbation pour l'assignation de rôles
- [ ] Expiration automatique des permissions temporaires
- [ ] Interface d'administration frontend
- [ ] Audit avancé avec historique des modifications
- [ ] Import/export de configurations de rôles

---

## 📚 Références

- **Documentation technique** : `/docs/technical.md`
- **Guide utilisateur** : `/docs/user-guide.fr.md`
- **Code source** : `/backend/src/modules/rbac/`
- **Seed** : `/backend/src/database/seeds/rbac.seed.ts`

---

**Version** : 2.0.0  
**Dernière mise à jour** : Juin 2026  
**Auteur** : franck arlos chendjou
