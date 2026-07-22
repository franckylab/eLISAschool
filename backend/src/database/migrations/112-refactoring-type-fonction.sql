-- ==========================================
-- eLISAschool - Refactoring TypePersonnel / Fonction
-- ==========================================
-- Migration: 112
-- Description:
--   1. Lier Fonction → TypePersonnel (typePersonnelId sur fonctions)
--   2. Retirer typePersonnelId de hierarchie_personnel (redondant)
--   3. Retirer les champs morts roleIdParDefaut + permissionsDefaut de types_personnel
-- Idempotente (IF EXISTS / IF NOT EXISTS)
-- ==========================================

-- =====================================
-- 1. Lien Fonction → TypePersonnel
-- =====================================

-- Colonne typePersonnelId sur fonctions
ALTER TABLE fonctions ADD COLUMN IF NOT EXISTS "typePersonnelId" uuid;

-- FK vers types_personnel (type global) — SET NULL si le type est supprimé
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'FK_fonctions_typePersonnelId'
          AND table_name = 'fonctions'
    ) THEN
        ALTER TABLE fonctions
            ADD CONSTRAINT "FK_fonctions_typePersonnelId"
            FOREIGN KEY ("typePersonnelId") REFERENCES types_personnel(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Index sur la FK
CREATE INDEX IF NOT EXISTS "IDX_fonctions_typePersonnelId" ON fonctions ("typePersonnelId");

-- =====================================
-- 2. Retrait typePersonnelId de hierarchie_personnel
--    (redondant : dérivable via personnelId ou posteId→fonction)
-- =====================================

-- Drop FK si présente (ajoutée par la migration 111)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'FK_hierarchie_typePersonnelId'
          AND table_name = 'hierarchie_personnel'
    ) THEN
        ALTER TABLE hierarchie_personnel DROP CONSTRAINT "FK_hierarchie_typePersonnelId";
    END IF;
END $$;

-- Drop index éventuel
DROP INDEX IF EXISTS "IDX_hierarchie_typePersonnelId";

-- Drop colonne
ALTER TABLE hierarchie_personnel DROP COLUMN IF EXISTS "typePersonnelId";

-- =====================================
-- 3. Retrait des champs morts de types_personnel
--    (jamais consommés ; RBAC uniquement via utilisateur_etablissements)
-- =====================================

ALTER TABLE types_personnel DROP COLUMN IF EXISTS "roleIdParDefaut";
ALTER TABLE types_personnel DROP COLUMN IF EXISTS "permissionsDefaut";
