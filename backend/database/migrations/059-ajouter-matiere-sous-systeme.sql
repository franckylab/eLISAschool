-- ==================================
-- eLISAschool - Migration 059: Ajouter Matiere.sousSysteme
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-14
-- 
-- Objectif: Ajouter le champ sousSysteme à la table matieres
-- pour supporter les établissements biculturels
-- ==================================

BEGIN;

-- ÉTAPE 1: Ajouter la colonne sousSysteme (nullable)
ALTER TABLE matieres 
ADD COLUMN IF NOT EXISTS soussysteme VARCHAR(20);

-- ÉTAPE 2: Initialiser avec NULL pour toutes les matières existantes
-- (NULL = matière commune aux deux systèmes)
-- Pas de migration de données nécessaire car toutes les matières existantes
-- sont considérées comme communes par défaut

-- ÉTAPE 3: Vérification
DO $$
DECLARE
    total_matieres INT;
    matieres_with_soussysteme INT;
BEGIN
    SELECT COUNT(*) INTO total_matieres FROM matieres;
    SELECT COUNT(*) INTO matieres_with_soussysteme 
    FROM matieres 
    WHERE soussysteme IS NOT NULL;
    
    RAISE NOTICE 'Total matières: %', total_matieres;
    RAISE NOTICE 'Matières avec sous-système explicite: %', matieres_with_soussysteme;
    RAISE NOTICE 'Matières communes (NULL): %', total_matieres - matieres_with_soussysteme;
    
    IF total_matieres > 0 THEN
        RAISE NOTICE '✓ Migration réussie. Toutes les matières existantes sont maintenant communes (NULL).';
        RAISE NOTICE '💡 Vous pouvez maintenant assigner un sous-système spécifique aux matières si nécessaire.';
    END IF;
END $$;

-- ÉTAPE 4: Exemple d'utilisation (commenté)
-- Pour assigner un sous-système à une matière spécifique:
-- UPDATE matieres 
-- SET soussysteme = 'FRANCOPHONE' 
-- WHERE code IN ('FR', 'HIST', 'GEO', 'EC');
--
-- UPDATE matieres 
-- SET soussysteme = 'ANGLOPHONE' 
-- WHERE code IN ('ENG', 'LIT');

COMMIT;

-- ==================================
-- POST-MIGRATION: Utilisation
-- ==================================
-- Dans le code TypeScript:
-- - matiere.sousSysteme === null → matière commune
-- - matiere.sousSysteme === SousSysteme.FRANCOPHONE → spécifique FR
-- - matiere.sousSysteme === SousSysteme.ANGLOPHONE → spécifique EN
--
-- Exemple de filtrage:
-- const matieres = await matiereRepo.find({
--     where: {
--         etablissementId,
--         sousSysteme: IsNull() // ou SousSysteme.FRANCOPHONE
--     }
-- });
-- ==================================
