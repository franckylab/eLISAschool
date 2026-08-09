-- =============================================
-- eLISAschool — Migration 171 : Table utilisateurs_plateforme
-- =============================================
-- Modèle C — Auth0 Internalisé (Dual-Plane)
-- Admins plateforme séparés des utilisateurs tenant.
-- Chaque ligne référence une identité globale.
-- =============================================

-- 1. Création de la table utilisateurs_plateforme
CREATE TABLE IF NOT EXISTS utilisateurs_plateforme (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "identiteId"    UUID NOT NULL REFERENCES identites(id) ON DELETE CASCADE,
    "rolePlateforme" VARCHAR(30) NOT NULL DEFAULT 'SUPPORT',
    prenom          VARCHAR(100),
    nom             VARCHAR(100),
    "avatarUrl"     VARCHAR(500),
    "dernierAcces"  TIMESTAMP,
    "estActif"      BOOLEAN DEFAULT true,
    "createdAt"     TIMESTAMP DEFAULT NOW(),
    "updatedAt"     TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_plateforme_identite UNIQUE ("identiteId")
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_up_role ON utilisateurs_plateforme("rolePlateforme");
CREATE INDEX IF NOT EXISTS idx_up_actif ON utilisateurs_plateforme("estActif");
CREATE INDEX IF NOT EXISTS idx_up_identite ON utilisateurs_plateforme("identiteId");

-- 3. Backfill : créer les entrées plateforme pour les SUPER_ADMIN existants
-- Les anciens rôles plateforme (ADMINISTRATION_PLATEFORME, SECURITE_PLATEFORME, etc.)
-- sont mappés vers le nouveau système de rôles.
INSERT INTO utilisateurs_plateforme (id, "identiteId", "rolePlateforme", prenom, nom, "estActif", "createdAt", "updatedAt")
SELECT
    u.id,
    u.id AS "identiteId",
    CASE
        WHEN u.role = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'
        WHEN u.role = 'ADMINISTRATION_PLATEFORME' THEN 'ADMIN_PLATEFORME'
        WHEN u.role = 'SECURITE_PLATEFORME' THEN 'SUPPORT'
        WHEN u.role = 'SUPPORT_PLATEFORME' THEN 'SUPPORT'
        WHEN u.role = 'COMMERCIAL_PLATEFORME' THEN 'BILLING_MANAGER'
        WHEN u.role = 'MONITORING_PLATEFORME' THEN 'ANALYST'
        ELSE 'SUPPORT'
    END AS "rolePlateforme",
    p.prenom,
    p.nom,
    CASE WHEN u.statut = 'ACTIF' THEN true ELSE false END AS "estActif",
    u."createdAt",
    u."updatedAt"
FROM utilisateurs u
LEFT JOIN profils_utilisateurs p ON p."utilisateurId" = u.id
WHERE u.role IN (
    'SUPER_ADMIN',
    'ADMINISTRATION_PLATEFORME',
    'SECURITE_PLATEFORME',
    'SUPPORT_PLATEFORME',
    'COMMERCIAL_PLATEFORME',
    'MONITORING_PLATEFORME'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Trigger auto-update updatedAt
CREATE OR REPLACE FUNCTION update_utilisateurs_plateforme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_up_updated_at ON utilisateurs_plateforme;
CREATE TRIGGER trg_up_updated_at
    BEFORE UPDATE ON utilisateurs_plateforme
    FOR EACH ROW
    EXECUTE FUNCTION update_utilisateurs_plateforme_updated_at();

-- 5. Vérification
DO $$
DECLARE
    nb_up INTEGER;
BEGIN
    SELECT COUNT(*) INTO nb_up FROM utilisateurs_plateforme;
    RAISE NOTICE 'Migration 171 terminée : % utilisateurs plateforme créés', nb_up;
END $$;
