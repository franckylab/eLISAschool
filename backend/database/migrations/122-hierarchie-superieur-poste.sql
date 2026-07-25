-- ==================================
-- eLISAschool - Hiérarchie : colonne superieurPosteId
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- Contexte : superieurId (sémantique MembrePersonnel) recevait des ids de Poste
-- dans le seed système et la génération de templates (relations poste → poste).
--
-- Corrections :
-- 1. Ajout colonne superieurPosteId (uuid, nullable) + index + FK postes(id) ON DELETE SET NULL
-- 2. Backfill correctif : déplacer les ids de Poste stockés à tort dans superieurId
--    vers superieurPosteId (superieurId remis à NULL)
-- 3. Backfill etablissementId des hiérarchies poste → poste (déduit via l'unité du poste)
--
-- Sémantique cible :
-- - personnelId / superieurId : relations personne → personne (membres_personnel)
-- - posteId / superieurPosteId : relations poste → poste (postes)
-- ==================================

BEGIN;

-- ============================================================
-- ÉTAPE 1 : Colonne superieurPosteId + index
-- ============================================================

ALTER TABLE hierarchie_personnel ADD COLUMN IF NOT EXISTS "superieurPosteId" uuid;

CREATE INDEX IF NOT EXISTS idx_hierarchie_personnel_superieur_poste
    ON hierarchie_personnel("superieurPosteId");

-- ============================================================
-- ÉTAPE 2 : FK vers postes(id) ON DELETE SET NULL (garde NOT EXISTS)
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_hierarchie_personnel_superieur_poste'
          AND conrelid = 'hierarchie_personnel'::regclass
    ) THEN
        ALTER TABLE hierarchie_personnel
            ADD CONSTRAINT fk_hierarchie_personnel_superieur_poste
            FOREIGN KEY ("superieurPosteId") REFERENCES postes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- ÉTAPE 3 : Backfill correctif — superieurId contenant des ids de Poste
-- (données corrompues issues du seed système / génération de templates)
-- ============================================================

UPDATE hierarchie_personnel h
SET "superieurPosteId" = h."superieurId",
    "superieurId" = NULL
WHERE h."superieurId" IN (SELECT id FROM postes)
  AND h."superieurPosteId" IS NULL;

-- ============================================================
-- ÉTAPE 4 : Backfill etablissementId des hiérarchies poste → poste
-- (le seed système ne le renseignait pas — déduit via l'unité du poste subordonné)
-- ============================================================

UPDATE hierarchie_personnel h
SET "etablissementId" = u."etablissementId"
FROM postes p
JOIN unites_organisationnelles u ON u.id = p."uniteOrganisationnelleId"
WHERE h."posteId" = p.id
  AND h."etablissementId" IS NULL;

-- ============================================================
-- ÉTAPE 5 : Purge des relations orphelines
-- Lignes historiques dont superieurId (id de Poste) a été mis à NULL
-- par l'ancienne FK ON DELETE SET NULL → aucune extrémité supérieure.
-- Une relation doit être personne→personne OU poste→poste complète.
-- ============================================================

DELETE FROM hierarchie_personnel
WHERE NOT ("personnelId" IS NOT NULL AND "superieurId" IS NOT NULL)
  AND NOT ("posteId" IS NOT NULL AND "superieurPosteId" IS NOT NULL);

COMMIT;
