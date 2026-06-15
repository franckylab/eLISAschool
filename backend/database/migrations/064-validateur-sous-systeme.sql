-- ==================================
-- eLISAschool - Migration 064: Validateur Sous-Système
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-14
-- 
-- Objectif: Cette migration est DOCUMENTATION SEULEMENT
-- Le validateur est un service TypeScript qui valide
-- la cohérence des sous-systèmes à l'exécution
-- Aucune modification de schéma requise
-- ==================================

BEGIN;

-- ÉTAPE 1: Vérification de l'existance des champs nécessaires
DO $$
DECLARE
    matiere_sous_systeme BOOLEAN;
    filiere_sous_systeme BOOLEAN;
    etablissement_sous_systeme BOOLEAN;
BEGIN
    -- Vérifier Matiere.sousSysteme
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matieres' AND column_name = 'sous_systeme'
    ) INTO matiere_sous_systeme;
    
    -- Vérifier Filiere.sousSysteme
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'filieres' AND column_name = 'sous_systeme'
    ) INTO filiere_sous_systeme;
    
    -- Vérifier Etablissement.sousSysteme
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'etablissements' AND column_name = 'sous_systeme'
    ) INTO etablissement_sous_systeme;
    
    -- Résultat de la vérification
    IF matiere_sous_systeme AND filiere_sous_systeme AND etablissement_sous_systeme THEN
        RAISE NOTICE '✓ Tous les champs requis pour le validateur sous-système existent';
        RAISE NOTICE '✓ Matiere.sousSysteme: %', matiere_sous_systeme;
        RAISE NOTICE '✓ Filiere.sousSysteme: %', filiere_sous_systeme;
        RAISE NOTICE '✓ Etablissement.sousSysteme: %', etablissement_sous_systeme;
        RAISE NOTICE '💡 ValidateurSousSystemService prêt à utiliser';
        RAISE NOTICE '';
        RAISE NOTICE 'Utilisation:';
        RAISE NOTICE '  import { validateurSousSystemService } from "@modules/configuration/services";';
        RAISE NOTICE '';
        RAISE NOTICE '  // Valider matière/classe';
        RAISE NOTICE '  const result = await validateurSousSystemService.validerMatiereClasse(matiereId, classeId);';
        RAISE NOTICE '';
        RAISE NOTICE '  // Valider inscription élève';
        RAISE NOTICE '  const result = await validateurSousSystemService.validerInscriptionEleve(eleveId, classeId);';
        RAISE NOTICE '';
        RAISE NOTICE '  // Valider établissement complet';
        RAISE NOTICE '  const result = await validateurSousSystemService.validerEtablissement(etablissementId);';
    ELSE
        RAISE WARNING '⚠ Champs manquants pour le validateur sous-système:';
        IF NOT matiere_sous_systeme THEN
            RAISE WARNING '  - Matiere.sousSysteme (migration 059 requise)';
        END IF;
        IF NOT filiere_sous_systeme THEN
            RAISE WARNING '  - Filiere.sousSysteme (déjà existant dans le code)';
        END IF;
        IF NOT etablissement_sous_systeme THEN
            RAISE WARNING '  - Etablissement.sousSysteme (déjà existant dans le code)';
        END IF;
    END IF;
END $$;

COMMIT;

-- ==================================
-- POST-MIGRATION: Documentation
-- ==================================
-- Le validateur de sous-système fournit:
--
-- 1. Validation matière/classe
--    - Vérifie qu'une matière spécifique à un sous-système
--      n'est pas assignée à une classe d'un autre sous-système
--
-- 2. Validation inscription élève
--    - Détecte les changements de sous-système
--    - Avertit si transition francophone ↔ anglophone
--
-- 3. Validation établissement
--    - Vérifie la cohérence biculturelle
--    - Détecte les filières manquantes
--    - Recommande les matières communes
--
-- Exemple d'intégration dans un contrôleur:
--
-- router.post('/affectations-matiere', async (req, res, next) => {
--     try {
--         const { matiereId, classeId } = req.body;
--         
--         // Valider avant création
--         await validateurSousSystemService.validerEtLancer(
--             () => validateurSousSystemService.validerMatiereClasse(matiereId, classeId),
--             true // bloquant
--         );
--         
--         // Continuer avec la création...
--     } catch (error) { next(error); }
-- });
-- ==================================
