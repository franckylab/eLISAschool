-- ==================================
-- eLISAschool - Migration 114
-- Description: Suppression categoriePersonnel (scoring) au profit de typePersonnelId FK
-- ==================================

-- 1. Supprimer l'index composite categoriePersonnel + scoreGlobal (nom auto-généré par TypeORM)
DO $$
DECLARE
    idx_name text;
BEGIN
    SELECT indexname INTO idx_name
    FROM pg_indexes
    WHERE tablename = 'scores_personnel'
      AND indexdef LIKE '%categoriePersonnel%scoreGlobal%';
    IF idx_name IS NOT NULL THEN
        EXECUTE format('DROP INDEX IF EXISTS %I', idx_name);
    END IF;
END $$;

-- 2. Supprimer l'index simple categoriePersonnel
DO $$
DECLARE
    idx_name text;
BEGIN
    SELECT indexname INTO idx_name
    FROM pg_indexes
    WHERE tablename = 'scores_personnel'
      AND indexdef LIKE '%categoriePersonnel%'
      AND indexdef NOT LIKE '%scoreGlobal%';
    IF idx_name IS NOT NULL THEN
        EXECUTE format('DROP INDEX IF EXISTS %I', idx_name);
    END IF;
END $$;

-- 3. Créer l'index de remplacement typePersonnelId + scoreGlobal
CREATE INDEX IF NOT EXISTS idx_scores_personnel_type_personnel_id_score_global
    ON scores_personnel ("typePersonnelId", "scoreGlobal");

-- 4. Supprimer la colonne categoriePersonnel
ALTER TABLE scores_personnel
    DROP COLUMN IF EXISTS categoriePersonnel;
