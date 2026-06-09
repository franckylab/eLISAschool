-- ==================================
-- eLISAschool - Migration Dashboard Layouts
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Description: Crée la table pour stocker les layouts de dashboard personnalisés

-- Table dashboard_layouts
CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    etablissement_id UUID REFERENCES etablissements(id) ON DELETE CASCADE, -- NULL = global
    nom VARCHAR(100) NOT NULL,
    widgets JSONB NOT NULL DEFAULT '[]',
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX idx_dashboard_layouts_utilisateur ON dashboard_layouts(utilisateur_id);
CREATE INDEX idx_dashboard_layouts_utilisateur_etablissement ON dashboard_layouts(utilisateur_id, etablissement_id);
CREATE INDEX idx_dashboard_layouts_actif ON dashboard_layouts(actif);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_dashboard_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dashboard_layouts_updated_at
    BEFORE UPDATE ON dashboard_layouts
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_layouts_updated_at();

-- Commentaire
COMMENT ON TABLE dashboard_layouts IS 'Stocke les configurations de dashboard personnalisées par utilisateur et établissement';
COMMENT ON COLUMN dashboard_layouts.etablissement_id IS 'NULL = layout global, sinon spécifique à un établissement';
COMMENT ON COLUMN dashboard_layouts.widgets IS 'Configuration JSON des widgets: [{id, visible, ordre, position, taille, config}]';

-- Vérification
DO $$
BEGIN
    RAISE NOTICE '✓ Table dashboard_layouts créée avec succès';
END $$;
