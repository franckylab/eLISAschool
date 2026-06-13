-- ==================================
-- eLISAschool - Migration 056: Suppression CycleScolaire
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-13
-- 
-- Objectifs:
-- 1. Convertir cyclesActifs de string[] (codes) vers uuid[] (IDs)
-- 2. Supprimer la redondance avec l'enum CycleScolaire
-- 3. Utiliser Cycle comme unique source de vérité
-- ==================================

BEGIN;

-- ==================================
-- 1. CONVERSION cyclesActifs STRING[] → UUID[]
-- ==================================

-- Étape 1: Ajouter une colonne temporaire pour les UUIDs
ALTER TABLE etablissement_config 
ADD COLUMN IF NOT EXISTS "cyclesActifsTemp" UUID[] DEFAULT '{}';

-- Étape 2: Mapper les anciens codes vers les IDs de cycles
-- Pour chaque établissement config, convertir les codes en IDs
DO $$
DECLARE
    config_record RECORD;
    old_cycles TEXT[];
    new_cycles UUID[];
    cycle_id UUID;
    i INTEGER;
BEGIN
    FOR config_record IN SELECT id, "cyclesActifs" FROM etablissement_config LOOP
        -- Parser le JSON array
        old_cycles := ARRAY(SELECT json_array_elements_text(config_record."cyclesActifs"::json));
        new_cycles := '{}';
        
        -- Convertir chaque code en UUID
        FOR i IN 1..array_length(old_cycles, 1) LOOP
            SELECT id INTO cycle_id 
            FROM cycles 
            WHERE code = old_cycles[i];
            
            IF cycle_id IS NOT NULL THEN
                new_cycles := array_append(new_cycles, cycle_id);
            END IF;
        END LOOP;
        
        -- Mettre à jour la colonne temporaire
        UPDATE etablissement_config 
        SET "cyclesActifsTemp" = new_cycles
        WHERE id = config_record.id;
    END LOOP;
    
    RAISE NOTICE '✅ Conversion des cyclesActifs terminée';
END $$;

-- Étape 3: Supprimer l'ancienne colonne
ALTER TABLE etablissement_config 
DROP COLUMN IF EXISTS "cyclesActifs";

-- Étape 4: Renommer la colonne temporaire
ALTER TABLE etablissement_config 
RENAME COLUMN "cyclesActifsTemp" TO "cyclesActifs";

-- ==================================
-- 2. VÉRIFICATION
-- ==================================

DO $$
DECLARE
    v_count INTEGER;
    v_invalid INTEGER;
BEGIN
    -- Vérifier que la colonne UUID existe
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_name = 'etablissement_config'
    AND column_name = 'cyclesActifs'
    AND data_type = 'array';
    
    IF v_count = 0 THEN
        RAISE EXCEPTION 'Migration échouée: colonne cyclesActifs UUID[] non trouvée';
    END IF;
    
    -- Vérifier qu'il n'y a pas de références à des cycles inexistants
    SELECT COUNT(*) INTO v_invalid
    FROM etablissement_config ec
    CROSS JOIN LATERAL unnest(ec."cyclesActifs") AS cycle_id
    WHERE NOT EXISTS (
        SELECT 1 FROM cycles c WHERE c.id = cycle_id
    );
    
    IF v_invalid > 0 THEN
        RAISE WARNING '⚠️ % références à des cycles inexistants trouvées', v_invalid;
    END IF;
    
    RAISE NOTICE '✅ Migration 056 complétée avec succès';
END $$;

COMMIT;
