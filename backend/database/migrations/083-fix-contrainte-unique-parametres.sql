-- ========================================
-- Migration 083: Fix contrainte unique parametres_systeme
-- ========================================
-- Objectif: Supprimer la contrainte unique sur 'cle' seule
--           pour permettre le multi-tenant (cle + etablissementId)
-- Date: 25 Juin 2026
-- ========================================

BEGIN;

-- ========================================
-- 1. Trouver et supprimer la contrainte unique sur 'cle' seule
-- ========================================
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Chercher la contrainte unique sur la colonne 'cle' seule
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'parametres_systeme'::regclass
      AND contype = 'u'
      AND array_length(conkey, 1) = 1  -- Exactement 1 colonne
      AND EXISTS (
          SELECT 1 FROM unnest(conkey) k
          JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = k
          WHERE a.attname = 'cle'
      );
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE parametres_systeme DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Contrainte unique sur cle supprimée: %', constraint_name;
    ELSE
        RAISE NOTICE 'Aucune contrainte unique sur cle seule trouvée (déjà supprimée?)';
    END IF;
END $$;

-- ========================================
-- 2. Vérifier que la contrainte composite existe
-- ========================================
DO $$
DECLARE
    composite_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'parametres_systeme'::regclass
          AND contype = 'u'
          AND array_length(conkey, 1) = 2  -- Exactement 2 colonnes
    ) INTO composite_exists;
    
    IF composite_exists THEN
        RAISE NOTICE 'Contrainte composite (cle, etablissementId) confirmée';
    ELSE
        RAISE WARNING 'Attention: Aucune contrainte composite trouvée, vérifiez l''entité TypeORM';
    END IF;
END $$;

-- ========================================
-- 3. Vérification finale
-- ========================================
DO $$
DECLARE
    cle_only_count INT;
    composite_count INT;
BEGIN
    -- Compter les contraintes sur 'cle' seule
    SELECT COUNT(*) INTO cle_only_count
    FROM pg_constraint
    WHERE conrelid = 'parametres_systeme'::regclass
      AND contype = 'u'
      AND array_length(conkey, 1) = 1
      AND EXISTS (
          SELECT 1 FROM unnest(conkey) k
          JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = k
          WHERE a.attname = 'cle'
      );
    
    -- Compter les contraintes composites
    SELECT COUNT(*) INTO composite_count
    FROM pg_constraint
    WHERE conrelid = 'parametres_systeme'::regclass
      AND contype = 'u'
      AND array_length(conkey, 1) = 2;
    
    RAISE NOTICE 'Migration 083 terminée:';
    RAISE NOTICE '  - Contraintes sur cle seule: % (devrait être 0)', cle_only_count;
    RAISE NOTICE '  - Contraintes composites: % (devrait être >= 1)', composite_count;
    
    IF cle_only_count > 0 THEN
        RAISE EXCEPTION 'Migration 083 échouée: contraintes sur cle seule toujours présentes';
    END IF;
END $$;

COMMIT;
