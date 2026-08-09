-- =============================================
-- eLISAschool — Migration 170 : Table identites
-- =============================================
-- Modèle C — Auth0 Internalisé (Dual-Plane)
-- Source unique de vérité pour l'identité globale.
-- Une identité = un email + credentials + MFA.
-- Peut avoir N memberships (plateforme + établissements).
-- =============================================

-- 1. Création de la table identites
CREATE TABLE IF NOT EXISTS identites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    "emailVerifie"  BOOLEAN DEFAULT false,
    "motDePasseHash" VARCHAR(255),
    "mfaActive"     BOOLEAN DEFAULT false,
    "mfaSecret"     VARCHAR(255),
    "derniereConnexion" TIMESTAMP,
    statut          VARCHAR(20) DEFAULT 'ACTIF',
    "createdAt"     TIMESTAMP DEFAULT NOW(),
    "updatedAt"     TIMESTAMP DEFAULT NOW()
);

-- 2. Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_identites_email ON identites(email);
CREATE INDEX IF NOT EXISTS idx_identites_statut ON identites(statut);
CREATE INDEX IF NOT EXISTS idx_identites_mfa ON identites("mfaActive");

-- 3. Backfill : créer une identité pour chaque utilisateur existant
-- Les utilisateurs existants conservent leur id pour la cohérence des FK.
-- Le mot de passe hashé est copié depuis la colonne "motDePasse" de utilisateurs.
INSERT INTO identites (id, email, "emailVerifie", "motDePasseHash", statut, "createdAt", "updatedAt")
SELECT id, email, "emailVerifie", "motDePasse", statut, "createdAt", "updatedAt"
FROM utilisateurs
ON CONFLICT (id) DO NOTHING;

-- 4. Trigger auto-update updatedAt
CREATE OR REPLACE FUNCTION update_identites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_identites_updated_at ON identites;
CREATE TRIGGER trg_identites_updated_at
    BEFORE UPDATE ON identites
    FOR EACH ROW
    EXECUTE FUNCTION update_identites_updated_at();

-- 5. Vérification post-migration
DO $$
DECLARE
    nb_utilisateurs INTEGER;
    nb_identites INTEGER;
BEGIN
    SELECT COUNT(*) INTO nb_utilisateurs FROM utilisateurs;
    SELECT COUNT(*) INTO nb_identites FROM identites;
    RAISE NOTICE 'Migration 170 terminée : % utilisateurs → % identités créées', nb_utilisateurs, nb_identites;
END $$;
