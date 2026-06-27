/**
 * ==================================
 * eLISAschool - Migration 087: AffectationMatiere etablissementId (complément)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-27
 * 
 * Objectif: Compléter la migration 086 avec vérifications supplémentaires
 */

-- ==================================
-- VÉRIFICATION: Index manquants
-- ==================================

-- Vérifier que les index existent
DO $$
BEGIN
    -- Index simple
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'affectations_matieres' 
        AND indexname = 'IDX_affectations_matieres_etablissement'
    ) THEN
        CREATE INDEX "IDX_affectations_matieres_etablissement" 
        ON affectations_matieres("etablissementId");
        RAISE NOTICE '✅ Index IDX_affectations_matieres_etablissement créé';
    END IF;

    -- Index composite classe
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'affectations_matieres' 
        AND indexname = 'IDX_affectations_matieres_classe_etablissement'
    ) THEN
        CREATE INDEX "IDX_affectations_matieres_classe_etablissement" 
        ON affectations_matieres("classeId", "etablissementId");
        RAISE NOTICE '✅ Index IDX_affectations_matieres_classe_etablissement créé';
    END IF;

    -- Index composite enseignant
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'affectations_matieres' 
        AND indexname = 'IDX_affectations_matieres_enseignant_etablissement'
    ) THEN
        CREATE INDEX "IDX_affectations_matieres_enseignant_etablissement" 
        ON affectations_matieres("enseignantId", "etablissementId");
        RAISE NOTICE '✅ Index IDX_affectations_matieres_enseignant_etablissement créé';
    END IF;
END $$;

-- ==================================
-- STATISTIQUES FINALES
-- ==================================

SELECT 
    'affectations_matieres' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT "etablissementId") as etablissements_uniques
FROM affectations_matieres;
