/**
 * ==================================
 * eLISAschool - Migration 086: AffectationMatiere etablissementId
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-27
 * 
 * Objectif: Ajouter etablissementId à AffectationMatiere pour isolation multi-tenant
 * 
 * Impact:
 * - affectations_matieres.etablissementId (NOUVEAU)
 * - Cohérence: affectations_matieres.etablissementId === classes.etablissementId
 */

-- ==================================
-- PRÉ-MIGRATION: Analyse
-- ==================================

DO $$
DECLARE
    affectations_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO affectations_count FROM affectations_matieres;
    RAISE NOTICE '📊 Total affectations matières: %', affectations_count;
END $$;

-- ==================================
-- MIGRATION: Ajout de etablissementId
-- ==================================

-- 1. Ajouter la colonne (nullable temporairement)
ALTER TABLE affectations_matieres 
ADD COLUMN IF NOT EXISTS "etablissementId" UUID;

-- 2. Peupler avec l'etablissementId de la classe
UPDATE affectations_matieres am
SET "etablissementId" = c."etablissementId"
FROM classes c
WHERE am."classeId" = c.id
  AND am."etablissementId" IS NULL;

-- 3. Vérifier qu'aucune affectation n'a un etablissementId NULL
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count 
    FROM affectations_matieres 
    WHERE "etablissementId" IS NULL;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION '❌ ÉCHEC: % affectations matières n''ont pas d''etablissementId', null_count;
    ELSE
        RAISE NOTICE '✅ Toutes les affectations matières ont un etablissementId';
    END IF;
END $$;

-- 4. Rendre NOT NULL
ALTER TABLE affectations_matieres 
ALTER COLUMN "etablissementId" SET NOT NULL;

-- 5. Ajouter les index
CREATE INDEX IF NOT EXISTS "IDX_affectations_matieres_etablissement" 
ON affectations_matieres("etablissementId");

CREATE INDEX IF NOT EXISTS "IDX_affectations_matieres_classe_etablissement" 
ON affectations_matieres("classeId", "etablissementId");

CREATE INDEX IF NOT EXISTS "IDX_affectations_matieres_enseignant_etablissement" 
ON affectations_matieres("enseignantId", "etablissementId");

-- 6. Ajouter la relation FK
ALTER TABLE affectations_matieres
ADD CONSTRAINT fk_affectations_matieres_etablissement
FOREIGN KEY ("etablissementId") 
REFERENCES etablissements(id) 
ON DELETE CASCADE;

-- ==================================
-- POST-MIGRATION: Vérification
-- ==================================

DO $$
DECLARE
    incoherent_count INTEGER;
BEGIN
    -- Vérifier la cohérence
    SELECT COUNT(*) INTO incoherent_count
    FROM affectations_matieres am
    JOIN classes c ON am."classeId" = c.id
    WHERE am."etablissementId" != c."etablissementId";
    
    IF incoherent_count > 0 THEN
        RAISE EXCEPTION '❌ ÉCHEC: % affectations ont un etablissementId incohérent', incoherent_count;
    ELSE
        RAISE NOTICE '✅ SUCCÈS: Toutes les affectations sont cohérentes';
    END IF;
    
    -- Statistiques
    RAISE NOTICE '📊 Affectations matières par établissement:';
    FOR stat IN 
        SELECT e.nom, COUNT(am.id) as count
        FROM etablissements e
        LEFT JOIN affectations_matieres am ON e.id = am."etablissementId"
        GROUP BY e.nom
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  - %: % affectations', stat.nom, stat.count;
    END LOOP;
END $$;

-- ==================================
-- DOCUMENTATION
-- ==================================

COMMENT ON COLUMN affectations_matieres."etablissementId" IS 'Établissement de l''affectation (multi-tenant) - doit correspondre à classe.etablissementId';

-- ==================================
## ROLLBACK (en cas de problème)
-- ==================================

/*
-- Pour annuler cette migration:

-- 1. Supprimer la contrainte FK
ALTER TABLE affectations_matieres DROP CONSTRAINT IF EXISTS fk_affectations_matieres_etablissement;

-- 2. Supprimer les index
DROP INDEX IF EXISTS "IDX_affectations_matieres_etablissement";
DROP INDEX IF EXISTS "IDX_affectations_matieres_classe_etablissement";
DROP INDEX IF EXISTS "IDX_affectations_matieres_enseignant_etablissement";

-- 3. Supprimer la colonne
ALTER TABLE affectations_matieres DROP COLUMN IF EXISTS "etablissementId";
*/
