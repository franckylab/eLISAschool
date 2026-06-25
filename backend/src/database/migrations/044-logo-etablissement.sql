-- ==================================
-- eLISAschool - Migration Logo Établissement
-- ==================================
-- Version: 3.0.0
-- Auteur: franck arlos chendjou
-- Description: Remplace logoUrl par logoBase64 et ajoute les métadonnées
-- ==================================

-- Supprimer l'ancienne colonne logoUrl si elle existe
ALTER TABLE etablissements DROP COLUMN IF EXISTS logoUrl;

-- Ajouter la nouvelle colonne logoBase64
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS logoBase64 TEXT;

-- Ajouter les métadonnées du logo
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS logoType VARCHAR(10); -- 'png', 'jpg', 'svg', 'webp'

ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS logoTaille INTEGER; -- Taille en octets

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN etablissements.logoBase64 IS 'Logo encodé en base64 (data:image/xxx;base64,...)';
COMMENT ON COLUMN etablissements.logoType IS 'Type MIME du logo: png, jpg, svg, webp';
COMMENT ON COLUMN etablissements.logoTaille IS 'Taille du fichier original en octets';

-- Index pour savoir quels établissements ont un logo
CREATE INDEX IF NOT EXISTS idx_etablissements_has_logo ON etablissements(logoBase64) WHERE logoBase64 IS NOT NULL;
