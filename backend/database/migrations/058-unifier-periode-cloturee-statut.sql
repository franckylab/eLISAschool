-- ==================================
-- eLISAschool - Migration 058: Unifier Periode.cloturee et Periode.statut
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-14
-- 
-- Objectif: Supprimer le champ cloturee (boolean) et utiliser uniquement statut
-- pour éviter la redondance de données
-- ==================================

BEGIN;

-- ÉTAPE 1: Synchroniser statut avec cloturee pour les données existantes
-- Si cloturee = true, alors statut doit être 'CLOTUREE'
UPDATE periodes
SET statut = 'CLOTUREE'
WHERE cloturee = true AND statut != 'CLOTUREE';

-- Si cloturee = false et statut est NULL ou vide, mettre 'OUVERTE'
UPDATE periodes
SET statut = 'OUVERTE'
WHERE cloturee = false AND (statut IS NULL OR statut = '');

-- ÉTAPE 2: Vérification de la synchronisation
DO $$
DECLARE
    count_incoherent INT;
BEGIN
    SELECT COUNT(*) INTO count_incoherent
    FROM periodes
    WHERE (cloturee = true AND statut != 'CLOTUREE')
       OR (cloturee = false AND statut = 'CLOTUREE');
    
    IF count_incoherent > 0 THEN
        RAISE WARNING '% périodes ont des incohérences entre cloturee et statut', count_incoherent;
    ELSE
        RAISE NOTICE '✓ Toutes les périodes sont cohérentes';
    END IF;
END $$;

-- ÉTAPE 3: Supprimer la colonne cloturee
ALTER TABLE periodes 
DROP COLUMN IF EXISTS cloturee;

-- ÉTAPE 4: Vérification finale
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'periodes' 
        AND column_name = 'cloturee'
    ) THEN
        RAISE EXCEPTION 'Migration échouée: la colonne cloturee existe encore';
    ELSE
        RAISE NOTICE '✓ Colonne cloturee supprimée avec succès';
        RAISE NOTICE '✓ Utilisez maintenant periode.statut === "CLOTUREE" au lieu de periode.cloturee';
    END IF;
END $$;

COMMIT;

-- ==================================
-- POST-MIGRATION: Utiliser le getter de compatibilité
-- ==================================
-- Dans le code TypeScript, utiliser:
-- - periode.cloturee (getter déprécié mais fonctionnel pour compatibilité)
-- - periode.statut === StatutPeriode.CLOTUREE (recommandé)
-- ==================================
