-- ==================================
-- eLISAschool - Index unique anti-doublon Heures de Cours
-- ==================================
-- Version: 1.0.0
--
-- Empêche la création de doublons lors de la génération des heures de cours
-- depuis l'emploi du temps. Un même enseignant ne peut pas avoir deux heures
-- de cours pour le même créneau source, à la même date et même heure de début.
-- ==================================

-- Ajout de la colonne typeCreneau si elle n'existe pas encore (migration schema)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'heures_cours' AND column_name = 'typeCreneau'
    ) THEN
        ALTER TABLE heures_cours ADD COLUMN "typeCreneau" varchar(20) DEFAULT 'COURS';
    END IF;
END $$;

-- Index unique partiel : pas de doublon sur (enseignant, date, heureDebut, creneau)
-- sauf si soft-deleted
CREATE UNIQUE INDEX IF NOT EXISTS idx_heures_cours_no_dup
    ON heures_cours ("enseignantId", date, "heureDebut", "creneauId")
    WHERE "deletedAt" IS NULL;

-- Index partiel alternatif pour les heures sans creneauId (création manuelle)
CREATE UNIQUE INDEX IF NOT EXISTS idx_heures_cours_no_dup_manuel
    ON heures_cours ("enseignantId", date, "heureDebut")
    WHERE "deletedAt" IS NULL AND "creneauId" IS NULL;
