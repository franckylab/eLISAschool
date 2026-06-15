-- ==================================
-- eLISAschool - Migration 060: Ajouter AffectationMatiere.coefficient
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-14
-- 
-- Objectif: Ajouter le champ coefficient à affectations_matieres
-- pour permettre des coefficients spécifiques par classe/filière
-- ==================================

BEGIN;

-- ÉTAPE 1: Ajouter la colonne coefficient (nullable)
ALTER TABLE affectations_matieres 
ADD COLUMN IF NOT EXISTS coefficient FLOAT;

-- ÉTAPE 2: Initialiser avec NULL (utilisera le coefficient de MatiereNiveau)
-- Pas de migration de données nécessaire

-- ÉTAPE 3: Vérification
DO $$
DECLARE
    total_aff INT;
    aff_with_coeff INT;
BEGIN
    SELECT COUNT(*) INTO total_aff FROM affectations_matieres;
    SELECT COUNT(*) INTO aff_with_coeff 
    FROM affectations_matieres 
    WHERE coefficient IS NOT NULL;
    
    RAISE NOTICE 'Total affectations: %', total_aff;
    RAISE NOTICE 'Affectations avec coefficient spécifique: %', aff_with_coeff;
    RAISE NOTICE 'Affectations sans coefficient (utiliseront MatiereNiveau): %', total_aff - aff_with_coeff;
    
    IF total_aff > 0 THEN
        RAISE NOTICE '✓ Migration réussie.';
        RAISE NOTICE '💡 Vous pouvez maintenant définir des coefficients par classe/filière.';
    END IF;
END $$;

-- ÉTAPE 4: Exemple d'utilisation (commenté)
-- Pour définir un coefficient spécifique à une affectation:
-- UPDATE affectations_matieres
-- SET coefficient = 4
-- WHERE matiereId = (SELECT id FROM matieres WHERE code = 'MATH')
--   AND classeId = (SELECT id FROM classes WHERE nom = 'Terminale C');
--
-- UPDATE affectations_matieres
-- SET coefficient = 2
-- WHERE matiereId = (SELECT id FROM matieres WHERE code = 'FR')
--   AND classeId = (SELECT id FROM classes WHERE nom = 'Terminale C');

COMMIT;

-- ==================================
-- POST-MIGRATION: Logique de calcul
-- ==================================
-- Le système de bulletins utilise maintenant cette priorité:
-- 1. AffectationMatiere.coefficient (si défini)
-- 2. MatiereNiveau.coefficient (coefficient par défaut du niveau)
-- 3. 1 (méthode arithmétique)
--
-- Cela permet d'avoir des coefficients différents pour:
-- - Terminale C: Math coef 4, Physique coef 3
-- - Terminale D: Math coef 3, SVT coef 4
-- - Terminale A: Math coef 2, Français coef 5
-- ==================================
