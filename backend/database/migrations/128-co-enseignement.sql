-- ==================================
-- eLISAschool - Migration 128
-- Co-enseignement : ajout colonne coEnseignantIds sur affectations_matieres
-- ==================================

-- Ajout de la colonne coEnseignantIds (stockage simple-array TypeORM = texte séparé par virgules)
ALTER TABLE affectations_matieres
ADD COLUMN IF NOT EXISTS "coEnseignantIds" text;

COMMENT ON COLUMN affectations_matieres."coEnseignantIds" IS 'IDs des co-enseignants (séparés par virgules, simple-array TypeORM)';
