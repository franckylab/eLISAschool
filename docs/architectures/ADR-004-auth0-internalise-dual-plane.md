/**
 * ==================================
 * eLISAschool - ADR-004 — Auth0 Internalisé Dual-Plane
 * ==================================
 *
 * Contexte, décision, modèle de données, flux auth, CASL dual,
 * risques et migration.
 */

# ADR-004 : Auth0 Internalisé — Modèle Dual-Plane

## Statut

**Accepté** — 2025

## Contexte

eLISAschool évolue vers un SaaS professionnel niveau entreprise. La gestion des identités, rôles et permissions doit supporter :

1. **Séparation stricte** entre la plateforme (Control Plane) et les établissements tenants (Data Plane)
2. **Identité globale** : une personne = une identité, N memberships (plateforme + établissements)
3. **6 rôles plateforme** granulaires (SUPER_ADMIN, ADMIN_PLATEFORME, SUPPORT, BILLING_MANAGER, ANALYST, AUDITOR)
4. **~40 permissions plateforme** séparées des permissions tenant
5. **CASL dual** : ability système pour le tenant, ability plateforme pour le Control Plane
6. **Sessions plateforme** avec limite LRU (max 3 par utilisateur)
7. **MFA obligatoire** pour les accès plateforme

## Décision

**Modèle C — Auth0 Internalisé** : reproduire les concepts Auth0 (Organizations, Members, Memberships) en interne avec PostgreSQL + CASL.js, sans dépendance externe.

### Raisons

| Critère | Auth0 Externe (A) | Fork SuperTokens (B) | Auth0 Internalisé (C) |
|---------|-------------------|---------------------|----------------------|
| Coût mensuel | $2,000+/mois | $0 | $0 |
| Contrôle données | Externe | Partiel | Total |
| Personnalisation | Limitée | Moyenne | Totale |
| Maintenance | Faible | Moyenne | Élevée |
| Score total | 5.0 | 6.5 | **8.0** |

## Modèle de données

### 4 nouvelles tables

```
identites                    — Source unique de vérité (email, password, MFA)
├── utilisateurs_plateforme  — Admins plateforme (FK → identites, OneToOne)
├── memberships              — Pivot identité × contexte (FK → identites)
└── permissions_plateforme   — Registre des ~40 permissions Control Plane
```

### Relations

- `identites` 1:1 `utilisateurs_plateforme` (admin si existe)
- `identites` 1:N `memberships` (N contextes)
- `memberships.contexteType` ∈ {PLATEFORME, ETABLISSEMENT}

## Flux d'authentification

```
POST /api/platform/auth/login
  → Résoudre identité par email
  → Vérifier motDePasseHash (bcrypt)
  → Charger utilisateur_plateforme + memberships
  → Construire JWT scopé { platform: { role }, tenant: null }
  → Créer session_plateforme (limite 3 LRU)
  → Retourner accessToken + refreshToken

GET /api/platform/auth/me
  → Vérifier JWT
  → Retourner profil + memberships
```

## CASL Dual

- **Data Plane** : `defineAbility(ctx)` dans `shared/src/casl/abilities.ts` (existant)
- **Control Plane** : `definePlatformAbility(ctx)` dans `shared/src/casl/platform-abilities.ts` (nouveau)
- **Middleware** : `scopeDiscriminationMiddleware` discriminate par préfixe de route `/api/platform/`

## Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Migration big-bang | Interruption service | Transaction + rollback plan |
| Double table utilisateurs | Confusion | Documentation + vue de mapping |
| Sessions LRU | Perte session | Limite 3, notification futur |
| MFA obligatoire | UX friction | Optionnel phase 1, obligatoire phase 2 |

## Migration

Fichier : `backend/database/migrations/168-auth0-internalise-dual-plane.sql`

1. CREATE TABLE identites + migration données depuis utilisateurs
2. CREATE TABLE utilisateurs_plateforme + FK
3. CREATE TABLE memberships + migration depuis utilisateur_etablissements
4. CREATE TABLE permissions_plateforme + seed 40 permissions
5. CREATE TABLE sessions_plateforme
6. Index + triggers updated_at

## Fichiers créés/modifiés

### Backend
- `shared/src/enums/platform-roles.enum.ts` — Enums RolePlateforme, ContexteType, StatutIdentite
- `shared/src/casl/platform-abilities.ts` — definePlatformAbility() pour les 6 rôles
- `backend/src/modules/identite/entities/` — 4 entités TypeORM (identite, utilisateur-plateforme, membership, permission-plateforme)
- `backend/src/modules/identite/services/identite.service.ts` — CRUD identité globale
- `backend/src/modules/identite/services/membership.service.ts` — Gestion memberships + matrice permissions
- `backend/src/modules/identite/controllers/identite.controller.ts` — 9 endpoints REST
- `backend/src/modules/identite/controllers/platform-permissions.controller.ts` — 3 endpoints (liste, matrix, modules)
- `backend/src/modules/identite/dto/identite.dto.ts` — Schémas Zod
- `backend/src/modules/platform-auth/services/platform-auth.service.ts` — Login dual-plane, JWT scopé
- `backend/src/common/middlewares/dual-casl.middleware.ts` — Middleware CASL dual (platform/tenant)
- `backend/src/routes/platform.routes.ts` — Routes /identites et /permissions ajoutées
- `backend/database/migrations/170-identites-global.sql` — Table identites + backfill
- `backend/database/migrations/171-utilisateurs-plateforme.sql` — Table utilisateurs_plateforme + backfill
- `backend/database/migrations/172-memberships-pivot.sql` — Table memberships + backfill
- `backend/database/migrations/173-permissions-plateforme.sql` — Table permissions + seed ~30 permissions

### Frontend
- `frontend/src/components/layout/platform-sidebar.tsx` — Sous-groupes Identité/Surveillance
- `frontend/src/features/admin/components/platform-users-page.tsx` — Connecté aux API hooks
- `frontend/src/features/platform/components/platform-permissions-matrix.tsx` — Matrice permissions × rôles
- `frontend/src/features/platform/hooks/use-platform-users.ts` — Hooks TanStack Query users
- `frontend/src/features/platform/hooks/use-platform-roles.ts` — Hooks TanStack Query roles/permissions
- `frontend/src/routes/platform.roles.tsx` — Route rôles
- `frontend/src/routes/platform.permissions.tsx` — Route permissions
- `frontend/src/locales/fr/admin.json` — +identite.*, +platformPermissions.*, +sidebar.sousGroupe*
- `frontend/src/locales/en/admin.json` — Parité FR/EN

### Tests
- `backend/test/unit/platform-abilities.spec.ts` — CASL pour chaque rôle
- `backend/test/unit/dual-plane-auth.spec.ts` — Résolution identité, JWT, scope discrimination
