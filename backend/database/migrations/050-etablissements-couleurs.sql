-- ==================================
-- eLISAschool - Migration Ajout Couleurs Établissement
-- ==================================
-- Version: 2.1.0
-- Ajoute les champs couleurPrimaire et couleurSecondaire à la table etablissements

-- Ajout colonne couleurPrimaire
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS "couleurPrimaire" VARCHAR(20);

-- Ajout colonne couleurSecondaire
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS "couleurSecondaire" VARCHAR(20);

-- Commentaires
COMMENT ON COLUMN etablissements."couleurPrimaire" IS 'Couleur principale de l''établissement (ex: #28a745)';
COMMENT ON COLUMN etablissements."couleurSecondaire" IS 'Couleur secondaire de l''établissement (ex: #ffc107)';
