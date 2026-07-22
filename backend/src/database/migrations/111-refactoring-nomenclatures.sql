-- ==========================================
-- eLISAschool - Refactoring Nomenclatures
-- ==========================================
-- Migration: 111
-- Description:
--   1. Suppression de TypeUniteOrganisationnelle (table + FK)
--   2. Réalignement FK Poste → HierarchiePersonnel (typePersonnelId)
--   3. Suppression des champs dénormalisés de hierarchie_personnel
-- Idempotente (IF EXISTS / IF NOT EXISTS)
-- ==========================================

-- =====================================
-- 1. Suppression TypeUniteOrganisationnelle
-- =====================================

-- Drop FK constraint sur unites_organisationnelles
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'FK_unites_typeUniteId'
    ) THEN
        ALTER TABLE unites_organisationnelles DROP CONSTRAINT "FK_unites_typeUniteId";
    END IF;
END $$;

-- Drop index sur typeUniteId
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'IDX_unites_typeUniteId'
    ) THEN
        DROP INDEX IF EXISTS "IDX_unites_typeUniteId";
    END IF;
END $$;

-- Drop colonne typeUniteId sur unites_organisationnelles
ALTER TABLE unites_organisationnelles DROP COLUMN IF EXISTS "typeUniteId";

-- Drop table types_unite_organisationnelle
DROP TABLE IF EXISTS types_unite_organisationnelle;

-- =====================================
-- 2. Réalignement FK typePersonnelId
--    Poste → HierarchiePersonnel
-- =====================================

-- Drop FK constraint sur postes si existante
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'FK_postes_typePersonnelId'
    ) THEN
        ALTER TABLE postes DROP CONSTRAINT "FK_postes_typePersonnelId";
    END IF;
END $$;

-- Drop index sur typePersonnelId dans postes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'postes' AND indexname LIKE '%typePersonnelId%'
    ) THEN
        DROP INDEX IF EXISTS "IDX_postes_typePersonnelId";
    END IF;
END $$;

-- Drop colonne typePersonnelId de postes
ALTER TABLE postes DROP COLUMN IF EXISTS "typePersonnelId";

-- Ajouter colonne typePersonnelId à hierarchie_personnel
ALTER TABLE hierarchie_personnel ADD COLUMN IF NOT EXISTS "typePersonnelId" uuid;

-- Ajouter FK vers types_personnel
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'FK_hierarchie_typePersonnelId'
          AND table_name = 'hierarchie_personnel'
    ) THEN
        ALTER TABLE hierarchie_personnel
            ADD CONSTRAINT "FK_hierarchie_typePersonnelId"
            FOREIGN KEY ("typePersonnelId") REFERENCES types_personnel(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================
-- 3. Suppression champs dénormalisés
--    hierarchie_personnel
-- =====================================

ALTER TABLE hierarchie_personnel DROP COLUMN IF EXISTS "personnelNom";
ALTER TABLE hierarchie_personnel DROP COLUMN IF EXISTS "superieurNom";
ALTER TABLE hierarchie_personnel DROP COLUMN IF EXISTS "posteIntitule";
ALTER TABLE hierarchie_personnel DROP COLUMN IF EXISTS "uniteNom";
