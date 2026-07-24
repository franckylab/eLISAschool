-- ==================================
-- eLISAschool - Migration 117 : HeureCours ancré sur classeAnneeId
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-07-24
--
-- Objectif : Remplacer classeId par classeAnneeId sur heures_cours.
-- HeureCours devient une matérialisation datée de CreneauHoraire,
-- ancrée dans le contexte temporel de l'année scolaire.
-- ==================================

-- 1. Ajouter la colonne classeAnneeId
ALTER TABLE heures_cours ADD COLUMN IF NOT EXISTS "classeAnneeId" UUID;

-- 2. Migrer les données : résoudre classeAnneeId depuis classeId + anneeScolaireId
-- ClasseAnnee a : classeId, anneeScolaireId
UPDATE heures_cours hc
SET "classeAnneeId" = ca.id
FROM classes_annees ca
WHERE ca."classeId" = hc."classeId"
AND ca."anneeScolaireId" = hc."anneeScolaireId";

-- Fallback : si anneeScolaireId n'est pas sur heures_cours, prendre l'année active
UPDATE heures_cours hc
SET "classeAnneeId" = ca.id
FROM classes_annees ca
JOIN annees_scolaires ans ON ans.id = ca."anneeScolaireId"
WHERE hc."classeAnneeId" IS NULL
AND ca."classeId" = hc."classeId"
AND ans."estActive" = true
LIMIT 1;

-- 3. Rendre la colonne NOT NULL (après migration)
-- Note : si des heures_cours n'ont pas de classeAnneeId résolu, elles seront orphelines
ALTER TABLE heures_cours ALTER COLUMN "classeAnneeId" SET NOT NULL;

-- 4. Créer l'index
CREATE INDEX IF NOT EXISTS idx_heures_cours_classe_annee ON heures_cours("classeAnneeId");

-- 5. Supprimer l'ancienne colonne classeId
ALTER TABLE heures_cours DROP COLUMN IF EXISTS "classeId";

-- 6. Ajouter index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_heures_cours_date_classe ON heures_cours("date", "classeAnneeId");
