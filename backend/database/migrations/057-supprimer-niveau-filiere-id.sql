-- ==================================
-- eLISAschool - Migration 057: Supprimer Niveau.filiereId déprécié
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-14
-- 
-- Objectif: Supprimer le champ déprécié filiereId de la table niveaux
-- car les filières s'appliquent aux classes, pas aux niveaux
-- ==================================

BEGIN;

-- ÉTAPE 1: Vérifier si des données existent encore dans filiereId
DO $$
DECLARE
    count_with_filiere INT;
    r RECORD;
BEGIN
    SELECT COUNT(*) INTO count_with_filiere 
    FROM niveaux 
    WHERE filiereId IS NOT NULL;
    
    IF count_with_filiere > 0 THEN
        RAISE NOTICE 'ATTENTION: % niveaux ont encore un filiereId. Ces données seront perdues.', count_with_filiere;
        RAISE NOTICE 'Vérifiez que les classes associées ont déjà leur propre filiereId.';
        
        -- Afficher les niveaux concernés
        RAISE NOTICE 'Niveaux concernés:';
        FOR r IN 
            SELECT n.id, n.nom, n.code, f.nom as filiere_nom
            FROM niveaux n
            LEFT JOIN filieres f ON n.filiereId = f.id
            WHERE n.filiereId IS NOT NULL
        LOOP
            RAISE NOTICE '  - % (%) -> Filière: %', r.nom, r.code, r.filiere_nom;
        END LOOP;
    ELSE
        RAISE NOTICE 'Aucun niveau avec filiereId. Migration safe.';
    END IF;
END $$;

-- ÉTAPE 2: Supprimer la colonne filiereId
ALTER TABLE niveaux 
DROP COLUMN IF EXISTS filiereId;

-- ÉTAPE 3: Vérification
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'niveaux' 
        AND column_name = 'filiereid'
    ) THEN
        RAISE EXCEPTION 'Migration échouée: la colonne filiereId existe encore';
    ELSE
        RAISE NOTICE '✓ Colonne filiereId supprimée avec succès';
    END IF;
END $$;

COMMIT;

-- ==================================
-- NOTE IMPORTANTE
-- ==================================
-- Avant d'exécuter cette migration, vérifier que:
-- 1. Toutes les classes ont leur propre filiereId si nécessaire
-- 2. Aucune requête ne dépend encore de Niveau.filiereId
-- 3. Les seeds ont été mis à jour pour ne plus utiliser ce champ
-- ==================================
