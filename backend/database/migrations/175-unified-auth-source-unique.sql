-- ==================================
-- eLISAschool - Migration 175
-- ADR-005 : Unification Auth Source Unique
-- ==================================
-- Supprime 6 tables redondantes (identites, utilisateurs_plateforme, memberships,
-- permissions_plateforme, mfa_configs, sessions_plateforme).
-- Étend utilisateurs (MFA inline + estPlateforme), utilisateur_etablissements (contexteType),
-- et refresh_tokens (plane).
-- Ajoute 6 rôles plateforme à l'enum DB.
-- Transaction atomique — tout ou rien.
-- ==================================

BEGIN;

-- =============================================
-- ÉTAPE 1 : Ajouter 6 rôles plateforme à l'enum
-- =============================================
-- Les valeurs PLATEFORME_* sont ajoutées à l'enum PostgreSQL
ALTER TYPE utilisateurs_role_enum ADD VALUE IF NOT EXISTS 'PLATEFORME_SUPER_ADMIN';
ALTER TYPE utilisateurs_role_enum ADD VALUE IF NOT EXISTS 'PLATEFORME_ADMIN';
ALTER TYPE utilisateurs_role_enum ADD VALUE IF NOT EXISTS 'PLATEFORME_SUPPORT';
ALTER TYPE utilisateurs_role_enum ADD VALUE IF NOT EXISTS 'PLATEFORME_BILLING';
ALTER TYPE utilisateurs_role_enum ADD VALUE IF NOT EXISTS 'PLATEFORME_ANALYST';
ALTER TYPE utilisateurs_role_enum ADD VALUE IF NOT EXISTS 'PLATEFORME_AUDITOR';

-- =============================================
-- ÉTAPE 2 : Étendre la table utilisateurs
-- =============================================

-- 2a. Flag plateforme (détection rapide sans parser le role)
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS "estPlateforme" boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "IDX_utilisateurs_est_plateforme" ON utilisateurs ("estPlateforme");

-- 2b. Colonnes MFA inline (source unique — remplace mfa_configs + identites.mfa*)
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS "mfaActif" boolean NOT NULL DEFAULT false;
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS "mfaSecretHash" varchar(255);
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS "mfaBackupCodesHash" text;
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS "mfaDerniereVerification" timestamp;

-- =============================================
-- ÉTAPE 3 : Étendre utilisateur_etablissements (pivot unique)
-- =============================================

-- 3a. Discriminateur de contexte (ETABLISSEMENT ou PLATEFORME)
ALTER TABLE utilisateur_etablissements ADD COLUMN IF NOT EXISTS "contexteType" varchar(20) NOT NULL DEFAULT 'ETABLISSEMENT';
CREATE INDEX IF NOT EXISTS "IDX_ue_contexte_type" ON utilisateur_etablissements ("contexteType");

-- 3b. etablissementId devient nullable (null si contexteType=PLATEFORME)
-- D'abord supprimer les contraintes NOT NULL existantes si présentes
ALTER TABLE utilisateur_etablissements ALTER COLUMN "etablissementId" DROP NOT NULL;

-- 3c. Index composite pour le pivot multi-contexte
CREATE INDEX IF NOT EXISTS "IDX_ue_utilisateur_contexte" ON utilisateur_etablissements ("utilisateurId", "contexteType", "actif");

-- =============================================
-- ÉTAPE 4 : Étendre refresh_tokens (sessions unifiées)
-- =============================================

-- 4a. Discriminateur de plan (tenant ou platform)
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS "plane" varchar(10) NOT NULL DEFAULT 'tenant';
CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_plane" ON refresh_tokens ("plane");
CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_utilisateur_plane" ON refresh_tokens ("utilisateurId", "plane");

-- =============================================
-- ÉTAPE 5 : Migrer les données MFA existantes
-- =============================================

-- 5a. Migrer mfa_configs → utilisateurs (colonnes MFA inline)
-- (mfa_configs est vide — cette requête est un no-op mais assure la robustesse)
UPDATE utilisateurs u
SET
    "mfaActif" = mc.actif,
    "mfaSecretHash" = mc."secretHash",
    "mfaBackupCodesHash" = mc."backupCodesHash",
    "mfaDerniereVerification" = mc."derniereVerification"
FROM mfa_configs mc
WHERE mc."utilisateurId" = u.id AND mc.actif = true;

-- 5b. Migrer identites.mfaActive → utilisateurs (si des identités existent)
-- (identites est vide — no-op)
UPDATE utilisateurs u
SET
    "mfaActif" = i."mfaActive",
    "mfaSecretHash" = i."mfaSecret"
FROM identites i
WHERE i.email = u.email AND i."mfaActive" = true;

-- =============================================
-- ÉTAPE 6 : Migrer les permissions plateforme
-- =============================================

-- Migrer permissions_plateforme → permissions (module='PLATEFORME')
-- (permissions_plateforme est vide — no-op)
INSERT INTO permissions (code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT
    pp.code,
    pp.libelle,
    pp.description,
    'PLATEFORME' AS module,
    pp.code AS action,
    true AS actif,
    NOW() AS "createdAt",
    NOW() AS "updatedAt"
FROM permissions_plateforme pp
WHERE NOT EXISTS (
    SELECT 1 FROM permissions p WHERE p.code = pp.code
);

-- =============================================
-- ÉTAPE 7 : Supprimer les 6 tables redondantes
-- =============================================

-- 7a. Supprimer sessions_plateforme (FK vers utilisateurs_plateforme)
DROP TABLE IF EXISTS sessions_plateforme CASCADE;

-- 7b. Supprimer mfa_configs (FK vers utilisateurs)
DROP TABLE IF EXISTS mfa_configs CASCADE;

-- 7c. Supprimer permissions_plateforme (pas de FK)
DROP TABLE IF EXISTS permissions_plateforme CASCADE;

-- 7d. Supprimer memberships (FK vers identites)
DROP TABLE IF EXISTS memberships CASCADE;

-- 7e. Supprimer utilisateurs_plateforme (FK vers identites)
DROP TABLE IF EXISTS utilisateurs_plateforme CASCADE;

-- 7f. Supprimer identites (table source)
DROP TABLE IF EXISTS identites CASCADE;

-- =============================================
-- ÉTAPE 8 : Nettoyage index redondants
-- =============================================

-- Supprimer les index qui référençaient les tables supprimées
-- (PostgreSQL les supprime automatiquement avec CASCADE, mais vérifions)

-- =============================================
-- ÉTAPE 9 : Commentaires documentation
-- =============================================

COMMENT ON COLUMN utilisateurs."estPlateforme" IS 'ADR-005: true si utilisateur a accès au panel plateforme (Control Plane)';
COMMENT ON COLUMN utilisateurs."mfaActif" IS 'ADR-005: MFA TOTP activé (source unique — remplace mfa_configs)';
COMMENT ON COLUMN utilisateurs."mfaSecretHash" IS 'ADR-005: Secret TOTP hashé (source unique)';
COMMENT ON COLUMN utilisateurs."mfaBackupCodesHash" IS 'ADR-005: Backup codes MFA hashés (JSON array)';
COMMENT ON COLUMN utilisateur_etablissements."contexteType" IS 'ADR-005: ETABLISSEMENT (tenant) ou PLATEFORME (control plane)';
COMMENT ON COLUMN refresh_tokens."plane" IS 'ADR-005: tenant ou platform — discrimine les sessions par plan';

COMMIT;
