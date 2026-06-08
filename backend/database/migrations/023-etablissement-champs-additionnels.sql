-- ==================================
-- eLISAschool - Migration 023
-- ==================================
-- Ajout de champs d'identification additionnels à la table etablissements
-- Version: 2.0.0
-- ==================================

-- codeEtablissement (unique)
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS codeEtablissement VARCHAR(50) UNIQUE;

-- Informations légales et financières
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS numeroContribuable VARCHAR(50);

ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS numeroCompteBancaire VARCHAR(50);

-- Présence en ligne
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS siteWeb VARCHAR(255);

ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS facebook VARCHAR(255);

ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS twitter VARCHAR(255);

-- Horaires
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS heuresOuverture VARCHAR(10);

ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS heuresFermeture VARCHAR(10);

-- Effectifs
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS effectifMax INTEGER;

ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS effectifActuel INTEGER DEFAULT 0;

-- Direction et encadrement
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS directeurNom VARCHAR(200);

ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS directeurAdjointNom VARCHAR(200);

ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS censeurNom VARCHAR(200);

ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS surveillantGeneralNom VARCHAR(200);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_etablissements_code ON etablissements(codeEtablissement);

COMMENT ON COLUMN etablissements.codeEtablissement IS 'Code unique de l''établissement';
COMMENT ON COLUMN etablissements.numeroContribuable IS 'Numéro de contribuable fiscal';
COMMENT ON COLUMN etablissements.effectifActuel IS 'Nombre actuel d''élèves inscrits';
