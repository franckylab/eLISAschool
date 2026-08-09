-- ==================================
-- eLISAschool — Migration 166
-- ==================================
-- Rôles plateforme (Control Plane) — Panel Admin v7
-- 
-- Ajoute 5 nouveaux rôles plateforme + table RolePlateforme
-- pour le Role Builder (rôles personnalisés).
-- ==================================

-- 1. Ajout des rôles plateforme dans la table des utilisateurs (colonne role)
-- Les rôles sont stockés en varchar, pas de contrainte CHECK à modifier.
-- Nouveaux rôles :
--   ADMINISTRATION_PLATEFORME — Gestion quotidienne
--   SECURITE_PLATEFORME       — Sécurité, RBAC, audit
--   SUPPORT_PLATEFORME        — Support technique
--   COMMERCIAL_PLATEFORME     — Commercial, plans, revenus
--   MONITORING_PLATEFORME     — Monitoring, alertes, metrics

-- 2. Table des rôles plateforme personnalisés (Role Builder)
CREATE TABLE IF NOT EXISTS role_plateforme (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom             VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    est_systeme     BOOLEAN NOT NULL DEFAULT false,
    permissions     TEXT[] NOT NULL DEFAULT '{}',
    scope_type      VARCHAR(20) NOT NULL DEFAULT 'global' CHECK (scope_type IN ('global', 'groupe')),
    etablissement_id UUID REFERENCES etablissements(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_role_plateforme_scope ON role_plateforme(scope_type);
CREATE INDEX IF NOT EXISTS idx_role_plateforme_systeme ON role_plateforme(est_systeme);

-- 4. Colonne scope groupe pour les utilisateurs plateforme
-- Permet de restreindre le périmètre d'un admin à des groupes d'établissements
ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS groupe_etablissement_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN utilisateurs.groupe_etablissement_ids IS 'Scope par groupe d''établissements pour les rôles plateforme. Vide = global.';

-- 5. Seed des rôles système plateforme (non supprimables)
INSERT INTO role_plateforme (nom, description, est_systeme, permissions, scope_type) VALUES
    ('SUPER_ADMIN', 'Accès total plateforme — tous les droits', true,
     '{platform:*:*}', 'global'),
    ('ADMINISTRATION_PLATEFORME', 'Gestion quotidienne — établissements, facturation, modules, config', true,
     '{platform:administration:*,platform:audit:read}', 'groupe'),
    ('SECURITE_PLATEFORME', 'Sécurité — RBAC, audit, MFA, utilisateurs plateforme', true,
     '{platform:securite:*,platform:audit:*}', 'groupe'),
    ('SUPPORT_PLATEFORME', 'Support technique — monitoring, providers, debugging', true,
     '{platform:support:*,platform:monitoring:*,platform:audit:read}', 'groupe'),
    ('COMMERCIAL_PLATEFORME', 'Commercial — plans, tarifs, offres, revenus', true,
     '{platform:commercial:*,platform:audit:read}', 'groupe'),
    ('MONITORING_PLATEFORME', 'Monitoring — dashboards, alertes, metrics (read-only)', true,
     '{platform:monitoring:*,platform:audit:read}', 'global')
ON CONFLICT (nom) DO NOTHING;

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION update_role_plateforme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_role_plateforme_updated_at ON role_plateforme;
CREATE TRIGGER trg_role_plateforme_updated_at
    BEFORE UPDATE ON role_plateforme
    FOR EACH ROW
    EXECUTE FUNCTION update_role_plateforme_updated_at();
