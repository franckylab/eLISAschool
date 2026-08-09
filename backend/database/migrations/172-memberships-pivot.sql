-- =============================================
-- eLISAschool — Migration 172 : Table memberships
-- =============================================
-- Modèle C — Auth0 Internalisé (Dual-Plane)
-- Pivot identité × contexte (plateforme OU établissement).
-- Permet le multi-rôle : même user = admin plateforme + enseignant dans étab A.
-- Inspiré du modèle Auth0 Organizations (member × org × role).
-- =============================================

-- 1. Création de la table memberships
CREATE TABLE IF NOT EXISTS memberships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "identiteId"        UUID NOT NULL REFERENCES identites(id) ON DELETE CASCADE,
    "contexteType"      VARCHAR(20) NOT NULL,  -- 'PLATEFORME' | 'ETABLISSEMENT'
    "contexteId"        UUID,                   -- NULL si PLATEFORME, etablissementId si ETABLISSEMENT
    role                VARCHAR(50) NOT NULL,
    "permissionsCustom" JSONB,
    "estActif"          BOOLEAN DEFAULT true,
    "dateActivation"    TIMESTAMP DEFAULT NOW(),
    "createdAt"         TIMESTAMP DEFAULT NOW(),
    "updatedAt"         TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_membership UNIQUE ("identiteId", "contexteType", "contexteId")
);

-- 2. Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_mem_identite ON memberships("identiteId");
CREATE INDEX IF NOT EXISTS idx_mem_contexte ON memberships("contexteType", "contexteId");
CREATE INDEX IF NOT EXISTS idx_mem_role ON memberships(role);
CREATE INDEX IF NOT EXISTS idx_mem_actif ON memberships("estActif");

-- 3. Backfill : migrer les utilisateurs existants vers des memberships ETABLISSEMENT
-- Chaque utilisateur avec un etablissementId devient un membership.
INSERT INTO memberships ("identiteId", "contexteType", "contexteId", role, "estActif", "dateActivation")
SELECT
    u.id AS "identiteId",
    'ETABLISSEMENT' AS "contexteType",
    ue."etablissementId" AS "contexteId",
    u.role,
    CASE WHEN u.statut = 'ACTIF' THEN true ELSE false END AS "estActif",
    u."createdAt" AS "dateActivation"
FROM utilisateurs u
INNER JOIN utilisateur_etablissements ue ON ue."utilisateurId" = u.id
WHERE ue."etablissementId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Backfill : memberships PLATEFORME pour les admins
INSERT INTO memberships ("identiteId", "contexteType", "contexteId", role, "estActif", "dateActivation")
SELECT
    up."identiteId",
    'PLATEFORME' AS "contexteType",
    NULL AS "contexteId",
    up."rolePlateforme" AS role,
    up."estActif",
    up."createdAt" AS "dateActivation"
FROM utilisateurs_plateforme up
ON CONFLICT DO NOTHING;

-- 5. Trigger auto-update updatedAt
CREATE OR REPLACE FUNCTION update_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mem_updated_at ON memberships;
CREATE TRIGGER trg_mem_updated_at
    BEFORE UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_memberships_updated_at();

-- 6. Vérification
DO $$
DECLARE
    nb_mem INTEGER;
    nb_plat INTEGER;
    nb_etab INTEGER;
BEGIN
    SELECT COUNT(*) INTO nb_mem FROM memberships;
    SELECT COUNT(*) INTO nb_plat FROM memberships WHERE "contexteType" = 'PLATEFORME';
    SELECT COUNT(*) INTO nb_etab FROM memberships WHERE "contexteType" = 'ETABLISSEMENT';
    RAISE NOTICE 'Migration 172 terminée : % memberships (% plateforme, % établissement)', nb_mem, nb_plat, nb_etab;
END $$;
