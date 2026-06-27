/**
 * ==================================
 * eLISAschool - Migration 085: Periode etablissementId
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-27
 * 
 * Objectif: Ajouter etablissementId à Periode pour isolation multi-tenant stricte
 * 
 * Impact:
 * - periodes.etablissementId (NOUVEAU)
 * - Cohérence: periodes.etablissementId === annees_scolaires.etablissementId
 */

-- ==================================
-- PRÉ-MIGRATION: Analyse
-- ==================================

-- Vérifier l'état actuel
DO $$
DECLARE
    periodes_count INTEGER;
    annees_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO periodes_count FROM periodes;
    SELECT COUNT(*) INTO annees_count FROM annees_scolaires;
    
    RAISE NOTICE '📊 Total périodes: %', periodes_count;
    RAISE NOTICE '📊 Total années scolaires: %', annees_count;
END $$;

-- ==================================
-- MIGRATION: Ajout de etablissementId
-- ==================================

-- 1. Ajouter la colonne (nullable temporairement)
ALTER TABLE periodes 
ADD COLUMN IF NOT EXISTS "etablissementId" UUID;

-- 2. Peupler avec l'etablissementId de l'année scolaire parente
UPDATE periodes p
SET "etablissementId" = a."etablissementId"
FROM annees_scolaires a
WHERE p."anneeScolaireId" = a.id
  AND p."etablissementId" IS NULL;

-- 3. Vérifier qu'aucune période n'a un etablissementId NULL
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count 
    FROM periodes 
    WHERE "etablissementId" IS NULL;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION '❌ ÉCHEC: % périodes n''ont pas d''etablissementId après peuplement', null_count;
    ELSE
        RAISE NOTICE '✅ Toutes les périodes ont un etablissementId';
    END IF;
END $$;

-- 4. Rendre NOT NULL
ALTER TABLE periodes 
ALTER COLUMN "etablissementId" SET NOT NULL;

-- 5. Ajouter les index
CREATE INDEX IF NOT EXISTS "IDX_periodes_etablissementId" 
ON periodes("etablissementId");

CREATE INDEX IF NOT EXISTS "IDX_periodes_annee_etablissement" 
ON periodes("anneeScolaireId", "etablissementId");

-- 6. Ajouter la relation FK
ALTER TABLE periodes
ADD CONSTRAINT fk_periodes_etablissement
FOREIGN KEY ("etablissementId") 
REFERENCES etablissements(id) 
ON DELETE CASCADE;

-- 7. Ajouter une contrainte de cohérence (optionnel mais recommandé)
-- Cette contrainte vérifie que periode.etablissementId === anneeScolaire.etablissementId
CREATE OR REPLACE FUNCTION check_periode_etablissement_coherence()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."etablissementId" != (
        SELECT "etablissementId" 
        FROM annees_scolaires 
        WHERE id = NEW."anneeScolaireId"
    ) THEN
        RAISE EXCEPTION 'Incohérence: la période doit appartenir au même établissement que son année scolaire';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trg_periode_etablissement_coherence ON periodes;
CREATE TRIGGER trg_periode_etablissement_coherence
    BEFORE INSERT OR UPDATE ON periodes
    FOR EACH ROW
    EXECUTE FUNCTION check_periode_etablissement_coherence();

-- ==================================
-- POST-MIGRATION: Vérification
-- ==================================

DO $$
DECLARE
    incoherent_count INTEGER;
BEGIN
    -- Vérifier la cohérence
    SELECT COUNT(*) INTO incoherent_count
    FROM periodes p
    JOIN annees_scolaires a ON p."anneeScolaireId" = a.id
    WHERE p."etablissementId" != a."etablissementId";
    
    IF incoherent_count > 0 THEN
        RAISE EXCEPTION '❌ ÉCHEC: % périodes ont un etablissementId incohérent', incoherent_count;
    ELSE
        RAISE NOTICE '✅ SUCCÈS: Toutes les périodes sont cohérentes avec leur année scolaire';
    END IF;
    
    -- Statistiques
    RAISE NOTICE '📊 Périodes par établissement:';
    FOR stat IN 
        SELECT e.nom, COUNT(p.id) as count
        FROM etablissements e
        LEFT JOIN periodes p ON e.id = p."etablissementId"
        GROUP BY e.nom
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  - %: % périodes', stat.nom, stat.count;
    END LOOP;
END $$;

-- ==================================
-- DOCUMENTATION
-- ==================================

COMMENT ON COLUMN periodes."etablissementId" IS 'Établissement de la période (multi-tenant) - doit correspondre à anneeScolaire.etablissementId';

-- ==================================
## ROLLBACK (en cas de problème)
-- ==================================

/*
-- Pour annuler cette migration:

-- 1. Supprimer le trigger
DROP TRIGGER IF EXISTS trg_periode_etablissement_coherence ON periodes;
DROP FUNCTION IF EXISTS check_periode_etablissement_coherence();

-- 2. Supprimer la contrainte FK
ALTER TABLE periodes DROP CONSTRAINT IF EXISTS fk_periodes_etablissement;

-- 3. Supprimer les index
DROP INDEX IF EXISTS "IDX_periodes_etablissementId";
DROP INDEX IF EXISTS "IDX_periodes_annee_etablissement";

-- 4. Supprimer la colonne
ALTER TABLE periodes DROP COLUMN IF EXISTS "etablissementId";
*/
