# ADR-005 — Unification du Système d'Authentification (Source Unique de Vérité)

## Statut

**PROPOSÉ** — En attente de validation et backup préalable

## Contexte

### Problème identifié

Le système d'authentification eLISAschool souffre d'une **duplication massive** des tables et entités liées aux utilisateurs, introduite par le Modèle C (Auth0 Internalisé — Dual-Plane Auth v10). Cette architecture à 2 plans a créé **6 tables redondantes** qui stockent les mêmes informations (email, mot de passe, MFA) dans des systèmes parallèles sans cohérence garantie.

### Inventaire des tables (avant refonte)

| # | Table | Entity | Plan | Lignes |
|---|-------|--------|------|--------|
| 1 | `utilisateurs` | Utilisateur | Tenant | Auth principale |
| 2 | `profils_utilisateurs` | ProfilUtilisateur | Tenant | Infos personnelles |
| 3 | `roles` | Role | Tenant | RBAC dynamique (67 valeurs) |
| 4 | `permissions` | Permission | Tenant | Permissions granulaires |
| 5 | `utilisateur_permissions` | UtilisateurPermission | Tenant | Overrides GRANTED/DENIED |
| 6 | `utilisateur_etablissements` | UtilisateurEtablissement | Tenant | Pivot user × établissement |
| 7 | `mfa_configs` | MfaConfig | Tenant | MFA TOTP |
| 8 | `refresh_tokens` | RefreshToken | Tenant | Token rotation (family) |
| 9 | `tentatives_connexion` | TentativeConnexion | Shared | Blocage brute-force |
| 10 | **`identites`** | Identite | **Platform** | **Doublon auth** |
| 11 | **`utilisateurs_plateforme`** | UtilisateurPlateforme | **Platform** | **Couche fantôme** |
| 12 | **`memberships`** | Membership | **Platform** | **Doublon pivot** |
| 13 | **`permissions_plateforme`** | PermissionPlateforme | **Platform** | **Doublon registre** |
| 14 | `sessions_plateforme` | SessionPlateforme | Platform | Sessions LRU |
| 15 | `ip_autorisees` | IpAutorisee | Platform | Whitelist IP |
| 16 | `audit_logs` | AuditLog | Shared | Journal d'audit |

### Failles critiques identifiées

1. **Double stockage du mot de passe** — Même password hashé dans `utilisateurs.motDePasse` ET `identites.motDePasseHash`. Au login : 2 bcrypt.compare sur le même mot de passe. Surface d'attaque doublée, divergence possible.

2. **Double stockage email** — Même email dans `utilisateurs.email` ET `identites.email`, sans contrainte d'unicité cross-table.

3. **Entité fantôme `UtilisateurPlateforme`** — Table intermédiaire inutile. `rolePlateforme` pourrait vivre directement dans `Identite` ou `Membership`.

4. **Entity dupliquée `PermissionPlateforme`** — Existe dans 2 modules différents (`identite/entities/` et `permissions-plateforme/entities/`).

5. **Confusion Membership vs UtilisateurEtablissement** — Les 2 sont des pivots. `Membership` peut lier à un établissement (`contexteType=ETABLISSEMENT`), tout comme `UtilisateurEtablissement`.

6. **MFA split** — `mfa_configs` (tenant) vs `identites.mfaActive/mfaSecret` (platform). Logique différente, pas de source unique.

7. **Statuts incohérents** — `StatutUtilisateur` (ACTIF/INACTIF/SUSPENDU/EN_ATTENTE_VALIDATION) vs `StatutIdentite` (ACTIF/SUSPENDU/DESACTIVE).

8. **Pas de FK Membership → UtilisateurPlateforme** — Intégrité référentielle non assurée.

## Décision

### Architecture cible v11 — Source unique de vérité

**Principe** : Une seule table `utilisateurs` pour les 2 plans (plateforme + tenant), un seul pivot `utilisateur_etablissements` étendu, un seul système de permissions, un seul système MFA.

### Tables supprimées (6)

| Table | Données migrées vers |
|-------|---------------------|
| `identites` | `utilisateurs` (email, motDePasse, MFA) |
| `utilisateurs_plateforme` | `utilisateurs.role` (enum étendu) |
| `memberships` | `utilisateur_etablissements` (pivot étendu) |
| `permissions_plateforme` | `permissions` (module='PLATEFORME') |
| `mfa_configs` | `utilisateurs` (colonnes MFA inline) |
| `sessions_plateforme` | `refresh_tokens` (discriminateur `plane`) |

### Modifications de `utilisateurs`

```sql
-- Nouvelles colonnes
ALTER TABLE utilisateurs ADD COLUMN "estPlateforme" boolean DEFAULT false;
CREATE INDEX idx_utilisateurs_est_plateforme ON utilisateurs("estPlateforme");

ALTER TABLE utilisateurs ADD COLUMN "mfaActif" boolean DEFAULT false;
ALTER TABLE utilisateurs ADD COLUMN "mfaSecretHash" varchar(255);
ALTER TABLE utilisateurs ADD COLUMN "mfaBackupCodesHash" text;
ALTER TABLE utilisateurs ADD COLUMN "mfaDerniereVerification" timestamp;

-- matricule : auto-généré PLF-XXXXXX pour les users plateforme
-- motDePasse : source UNIQUE (plus de double hash)
```

### Modifications de `utilisateur_etablissements`

```sql
-- Pivot unique multi-contexte
ALTER TABLE utilisateur_etablissements ADD COLUMN "contexteType" varchar(20) DEFAULT 'ETABLISSEMENT';
CREATE INDEX idx_ue_contexte ON utilisateur_etablissements("contexteType");

-- etablissementId devient nullable (null si contexteType=PLATEFORME)
ALTER TABLE utilisateur_etablissements ALTER COLUMN "etablissementId" DROP NOT NULL;

-- Contrainte unique adaptative
CREATE UNIQUE INDEX idx_ue_unique_contexte 
ON utilisateur_etablissements("utilisateurId", "contexteType", COALESCE("etablissementId", '00000000-0000-0000-0000-000000000000'));
```

### Modifications de `permissions`

```sql
-- Permissions plateforme migrées avec module='PLATEFORME'
INSERT INTO permissions (code, libelle, module, action, actif)
SELECT code, libelle, 'PLATEFORME', code, true
FROM permissions_plateforme;
```

### Modifications de `refresh_tokens`

```sql
-- Discriminateur de plan
ALTER TABLE refresh_tokens ADD COLUMN "plane" varchar(10) DEFAULT 'tenant';
CREATE INDEX idx_refresh_tokens_plane ON refresh_tokens("plane");
```

### Enum `Role` étendu (+6 valeurs)

```typescript
// Ajouts à l'enum Role existant
PLATEFORME_SUPER_ADMIN = 'PLATEFORME_SUPER_ADMIN',
PLATEFORME_ADMIN = 'PLATEFORME_ADMIN',
PLATEFORME_SUPPORT = 'PLATEFORME_SUPPORT',
PLATEFORME_BILLING = 'PLATEFORME_BILLING',
PLATEFORME_ANALYST = 'PLATEFORME_ANALYST',
PLATEFORME_AUDITOR = 'PLATEFORME_AUDITOR',
```

### Flux login unifié

```
POST /api/auth/login { identifiant, motDePasse }
  → 1. Blocage check (tentatives_connexion)
  → 2. SELECT dans utilisateurs (email/matricule/pseudonyme/qrCodeId)
  → 3. bcrypt.compare (UN SEUL)
  → 4. Si utilisateur.estPlateforme ET pas de utilisateurEtablissements
       → redirect frontend vers /platform/dashboard
  → 5. Si utilisateur a des etablissements
       → redirect vers modal sélection + bouton plateforme si estPlateforme
  → 6. MFA check (utilisateurs.mfaActif) — UN SEUL système
  → 7. Génération tokens (plane='tenant' ou 'platform' dans JWT)
```

## Conséquences

### Positives

- **Source unique de vérité** : 1 table auth au lieu de 2
- **Performance** : 1 bcrypt.compare au lieu de 2
- **Sécurité** : surface d'attaque réduite, pas de divergence de password
- **Simplicité** : 6 tables supprimées, code réduit de ~1500 lignes
- **Cohérence** : 1 seul système MFA, 1 seul pivot, 1 seul RBAC
- **Maintenance** : 1 seul service auth au lieu de 2 systèmes parallèles

### Négatives

- **Migration atomique obligatoire** : pas de rollback partiel possible
- **Breaking change** : tous les services/frontend doivent être mis à jour simultanément
- **Enum Role plus large** : 73 valeurs au lieu de 67 (gérable)
- **Table `utilisateurs` plus large** : +6 colonnes MFA (acceptable)

### Risques mitigés

- **Backup préalable obligatoire** : la migration est irréversible sans backup
- **Tests exhaustifs requis** : tous les flux auth doivent être re-testés
- **Documentation à mettre à jour** : skills, règles, AGENTS.md

## Sécurité préservée

| Couche | Avant | Après |
|--------|-------|-------|
| Blocage brute-force | tentatives_connexion | ✅ Inchangé |
| MFA TOTP | mfa_configs + identites.mfa | ✅ Unifié dans utilisateurs |
| JWT secrets séparés | 2 secrets | ✅ 2 secrets (inchangé) |
| RLS multi-tenant | middleware RLS | ✅ Inchangé |
| CASL abilities | 2 fichiers | ✅ Unifié avec discrimination plane |
| Refresh token rotation | family-based | ✅ Étendu avec `plane` |
| Rate limiting | par plan | ✅ Inchangé |
| Audit logs | audit_logs | ✅ Inchangé |
| IP whitelist | ip_autorisees | ✅ Inchangé |

## Plan d'implémentation

### Phase 0 — Backup

- Backup complet via l'API applicative (`POST /api/backups/trigger`)
- Vérification intégrité du backup

### Phase 1 — Migration SQL atomique

Migration `174-unified-auth.sql` :
1. Ajouter colonnes à `utilisateurs`
2. Migrer données depuis `identites` → `utilisateurs`
3. Migrer rôles depuis `utilisateurs_plateforme.rolePlateforme` → `utilisateurs.role`
4. Étendre `utilisateur_etablissements` (contexteType, etablissementId nullable)
5. Migrer `memberships` → `utilisateur_etablissements`
6. Migrer `permissions_plateforme` → `permissions`
7. Migrer `mfa_configs` → `utilisateurs` (colonnes MFA)
8. Étendre `refresh_tokens` (colonne `plane`)
9. Migrer `sessions_plateforme` → `refresh_tokens`
10. Supprimer les 6 tables

### Phase 2 — Backend

- Supprimer modules `identite/`, `permissions-plateforme/`, `platform-sessions/`
- Réécrire `auth.service.ts` (login unifié, 1 bcrypt)
- Réécrire `mfa.service.ts` (unifié, colonnes dans utilisateurs)
- Mettre à jour `token.service.ts` (claim `plane` dans JWT)
- Mettre à jour CASL (`shared/src/casl/abilities.ts`)
- Supprimer `dual-casl.middleware.ts` (un seul middleware)

### Phase 3 — Frontend

- Réécrire `auth.store.ts` (login unifié)
- Supprimer `EtablissementSelectionModal` props plateforme
- Mettre à jour `LoginPage.tsx` (flux unifié)
- Supprimer hooks plateforme obsolètes

### Phase 4 — Tests

- Tests unitaires auth unifié
- Tests E2E login plateforme
- Tests E2E login tenant
- Tests E2E login dual-plane

### Phase 5 — Documentation

- Mettre à jour `AGENTS.md`
- Mettre à jour `.qoder/rules/elisaschool-conventions.md`
- Mettre à jour skills

## Fichiers impactés

### Backend (suppressions)

- `backend/src/modules/identite/` — **SUPPRIMÉ** (4 entities, 2 services, 3 controllers)
- `backend/src/modules/permissions-plateforme/` — **SUPPRIMÉ**
- `backend/src/modules/platform-sessions/` — **SUPPRIMÉ**
- `backend/src/common/middlewares/dual-casl.middleware.ts` — **SUPPRIMÉ**

### Backend (modifications)

- `backend/src/modules/auth/entities/utilisateur.entity.ts` — +6 colonnes MFA + estPlateforme
- `backend/src/modules/auth/entities/utilisateur-etablissement.entity.ts` — +contexteType, etablissementId nullable
- `backend/src/modules/auth/entities/refresh-token.entity.ts` — +plane
- `backend/src/modules/auth/services/auth.service.ts` — login unifié (1 bcrypt)
- `backend/src/modules/auth/services/mfa.service.ts` — unifié (colonnes dans utilisateurs)
- `backend/src/modules/auth/services/token.service.ts` — claim `plane`
- `shared/src/enums/roles.enum.ts` — +6 valeurs RolePlateforme dans Role
- `shared/src/casl/abilities.ts` — discrimination par plane

### Frontend (modifications)

- `frontend/src/stores/auth.store.ts` — login unifié
- `frontend/src/features/auth/LoginPage.tsx` — flux unifié
- `frontend/src/components/auth/EtablissementSelectionModal.tsx` — simplifié

### Migration

- `backend/database/migrations/174-unified-auth.sql` — **NOUVEAU** (atomique)

## Alternatives rejetées

### Option B — Unification partielle

Garder 2 tables auth (`utilisateurs` + `identites`) mais éliminer les tables fantômes.
**Rejetée** : ne résout pas le problème du double password et de la double email.

### Option C — Garder Modèle C actuel

Corriger les failles sans unifier.
**Rejetée** : complexité maintenue, 2 systèmes parallèles, risque de divergence permanent.

## Références

- ADR-004 — Auth0 Internalisé Dual-Plane (Modèle C)
- AGENTS.md — Section v10.1 Dual-Plane Auth
- `.qoder/rules/elisaschool-conventions.md` — Section 11.1
