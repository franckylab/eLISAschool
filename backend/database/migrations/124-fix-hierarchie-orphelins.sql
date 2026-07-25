-- ==================================
-- eLISAschool - Hiérarchie : nettoyage des références orphelines
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- Contexte : des lignes de hierarchie_personnel référencent des ids
-- inexistants (membres_personnel ou postes supprimés avant la pose des FK,
-- ou UUID de postes stockés à tort dans superieurId avant la migration 122).
-- Ces orphelins bloquent la synchronisation TypeORM (ALTER TABLE ADD CONSTRAINT FK).
--
-- Corrections (idempotentes) :
-- 1. superieurId orphelin (aucun membres_personnel correspondant) → NULL
-- 2. superieurPosteId orphelin (aucun poste correspondant) → NULL
-- 3. Suppression des lignes devenues vides de toute sémantique :
--    ni relation personne → personne, ni relation poste → poste
-- ==================================

BEGIN;

-- ============================================================
-- ÉTAPE 1 : superieurId orphelin → NULL
-- ============================================================

UPDATE hierarchie_personnel h
SET "superieurId" = NULL
WHERE h."superieurId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM membres_personnel mp WHERE mp.id = h."superieurId"
  );

-- ============================================================
-- ÉTAPE 2 : superieurPosteId orphelin → NULL
-- ============================================================

UPDATE hierarchie_personnel h
SET "superieurPosteId" = NULL
WHERE h."superieurPosteId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM postes p WHERE p.id = h."superieurPosteId"
  );

-- ============================================================
-- ÉTAPE 3 : personnelId orphelin → NULL (même cause, FK potentielle)
-- ============================================================

UPDATE hierarchie_personnel h
SET "personnelId" = NULL
WHERE h."personnelId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM membres_personnel mp WHERE mp.id = h."personnelId"
  );

-- ============================================================
-- ÉTAPE 4 : posteId orphelin → NULL
-- ============================================================

UPDATE hierarchie_personnel h
SET "posteId" = NULL
WHERE h."posteId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM postes p WHERE p.id = h."posteId"
  );

-- ============================================================
-- ÉTAPE 5 : suppression des lignes vides de sens
-- (ni couple personne → personne, ni couple poste → poste)
-- ============================================================

DELETE FROM hierarchie_personnel
WHERE ("personnelId" IS NULL OR "superieurId" IS NULL)
  AND ("posteId" IS NULL OR "superieurPosteId" IS NULL);

COMMIT;
