-- ==================================
-- eLISAschool - Migration 157: MFA Config
-- ==================================
-- Table de configuration MFA (Multi-Factor Authentication)
-- Stocke le secret TOTP hashé et les codes de secours pour chaque utilisateur.
--
-- Phase P1 — Refonte SaaS v6
-- ==================================

-- Table mfa_configs : configuration MFA par utilisateur
CREATE TABLE IF NOT EXISTS mfa_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID NOT NULL UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    secret_hash VARCHAR(255) NOT NULL,
    backup_codes_hash TEXT NOT NULL, -- JSON array de codes hashés, sérialisé
    actif BOOLEAN NOT NULL DEFAULT false,
    derniere_verification TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour recherche par utilisateur
CREATE INDEX IF NOT EXISTS idx_mfa_configs_utilisateur ON mfa_configs(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_mfa_configs_actif ON mfa_configs(actif) WHERE actif = true;

-- Fonction auto-update timestamp
CREATE OR REPLACE FUNCTION update_mfa_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mfa_configs_updated_at
    BEFORE UPDATE ON mfa_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_mfa_configs_updated_at();

-- Commentaire
COMMENT ON TABLE mfa_configs IS 'Configuration MFA TOTP par utilisateur — Refonte SaaS v6';
COMMENT ON COLUMN mfa_configs.secret_hash IS 'Secret TOTP hashé (HMAC-SHA256 avec pepper)';
COMMENT ON COLUMN mfa_configs.backup_codes_hash IS 'JSON array de backup codes hashés';
COMMENT ON COLUMN mfa_configs.actif IS 'MFA actif uniquement après vérification du premier code';
