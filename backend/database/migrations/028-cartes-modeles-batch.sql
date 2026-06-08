-- ==================================
-- eLISAschool - Migration 028
-- ==================================
-- Module Cartes amélioré : modèles et batch
-- Version: 2.0.0
-- ==================================

-- Table modeles_cartes
CREATE TABLE IF NOT EXISTS modeles_cartes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    largeur INTEGER DEFAULT 85.6,
    hauteur INTEGER DEFAULT 53.98,
    orientation VARCHAR(20) DEFAULT 'PORTRAIT',
    champs_affiches JSONB NOT NULL,
    couleur_primaire VARCHAR(7) DEFAULT '#1E40AF',
    couleur_secondaire VARCHAR(7) DEFAULT '#3B82F6',
    logo_url VARCHAR(500),
    template_html TEXT,
    par_defaut BOOLEAN DEFAULT FALSE,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour modeles_cartes
CREATE INDEX idx_modeles_cartes_etablissement ON modeles_cartes(etablissement_id);
CREATE INDEX idx_modeles_cartes_type ON modeles_cartes(type);
CREATE INDEX idx_modeles_cartes_par_defaut ON modeles_cartes(par_defaut);

-- Ajout des champs à la table cartes
ALTER TABLE cartes 
ADD COLUMN IF NOT EXISTS modele_carte_id UUID REFERENCES modeles_cartes(id) ON DELETE SET NULL;

ALTER TABLE cartes 
ADD COLUMN IF NOT EXISTS categorie_titulaire VARCHAR(20);

-- Index pour cartes
CREATE INDEX IF NOT EXISTS idx_cartes_modele ON cartes(modele_carte_id);
CREATE INDEX IF NOT EXISTS idx_cartes_categorie ON cartes(categorie_titulaire);

-- Commentaires
COMMENT ON TABLE modeles_cartes IS 'Modèles configurables pour les cartes scolaires';
COMMENT ON COLUMN cartes.modele_carte_id IS 'FK vers le modèle de carte utilisé';
COMMENT ON COLUMN cartes.categorie_titulaire IS 'Catégorie du titulaire : ELEVE, PERSONNEL, ENSEIGNANT, RESPONSABLE';
