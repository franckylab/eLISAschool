-- ==================================
-- eLISAschool - Migration 116 : Programme pédagogique intemporel + historisation
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-07-24
--
-- Objectif : Rendre ProgrammePedagogique intemporel (curriculum pur).
-- Supprimer les champs temporels (periodeId, dateDebut, dateFin, anneeScolaireId, nbHeuresHebdo).
-- Créer la table programmes_versions pour l'historisation des changements.
-- Supprimer volumeHoraire de ProgrammeMatiere (source unique = MatiereNiveau).
-- ==================================

-- 1. Créer la table programmes_versions (historisation)
CREATE TABLE IF NOT EXISTS programmes_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "programmeId" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "modifiePar" UUID,
    "modifieAt" TIMESTAMP DEFAULT NOW(),
    "commentaire" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programmes_versions_programme ON programmes_versions("programmeId");
CREATE INDEX IF NOT EXISTS idx_programmes_versions_date ON programmes_versions("modifieAt" DESC);

-- 2. Capturer l'état actuel des programmes avant suppression des colonnes
-- (pour alimenter la première version historique)
INSERT INTO programmes_versions ("programmeId", "snapshot", "commentaire")
SELECT
    pp.id,
    jsonb_build_object(
        'nom', pp."nom",
        'code', pp."code",
        'description', pp."description",
        'type', pp."type",
        'periodeId', pp."periodeId",
        'dateDebut', pp."dateDebut",
        'dateFin', pp."dateFin",
        'anneeScolaireId', pp."anneeScolaireId",
        'nbHeuresHebdo', pp."nbHeuresHebdo",
        'migrated_at', NOW()
    ),
    'Migration automatique : programme devenu intemporel (v116)'
FROM programmes_pedagogiques pp
WHERE pp."periodeId" IS NOT NULL
   OR pp."dateDebut" IS NOT NULL
   OR pp."nbHeuresHebdo" IS NOT NULL;

-- 3. Supprimer les colonnes temporelles de programmes_pedagogiques
ALTER TABLE programmes_pedagogiques DROP COLUMN IF EXISTS "periodeId";
ALTER TABLE programmes_pedagogiques DROP COLUMN IF EXISTS "dateDebut";
ALTER TABLE programmes_pedagogiques DROP COLUMN IF EXISTS "dateFin";
ALTER TABLE programmes_pedagogiques DROP COLUMN IF EXISTS "anneeScolaireId";
ALTER TABLE programmes_pedagogiques DROP COLUMN IF EXISTS "nbHeuresHebdo";

-- 4. Supprimer volumeHoraire de programmes_matieres
-- (la source unique est MatiereNiveau.volumeHoraire)
ALTER TABLE programmes_matieres DROP COLUMN IF EXISTS "volumeHoraire";
