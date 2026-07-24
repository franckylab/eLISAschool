-- ==================================
-- eLISAschool - Migration 113 : Alignement contraintes unique nomenclatures
-- ==================================
-- Problème : les tables modes_remuneration et niveaux_responsabilite ont
-- une contrainte unique: true sur la colonne code SEUL (global), ce qui
-- empêche le multi-tenant. L'index composite [code, etablissementId] existe
-- déjà mais sans clause WHERE partielle.
--
-- Solution : supprimer la contrainte globale, ajouter un index partiel
-- WHERE "etablissementId" IS NOT NULL (même pattern que echelons_structurels).
-- ==================================

-- 1. modes_remuneration : drop contrainte unique globale sur code
DO $$
BEGIN
    -- Supprimer la contrainte unique globale si elle existe
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'modes_remuneration'::regclass
          AND contype = 'u'
          AND conkey @> (SELECT array_agg(ordinal_position::int) FROM information_schema.columns WHERE table_name = 'modes_remuneration' AND column_name = 'code')
    ) THEN
        ALTER TABLE modes_remuneration DROP CONSTRAINT IF EXISTS "modes_remuneration_code_key";
    END IF;

    -- Supprimer l'ancien index composite sans clause WHERE
    DROP INDEX IF EXISTS "idx_modes_remuneration_code_etablissementid";
END $$;

-- Recréer l'index composite partiel (multi-tenant)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_modes_remuneration_code_etab"
    ON modes_remuneration (code, "etablissementId")
    WHERE "etablissementId" IS NOT NULL;

-- 2. niveaux_responsabilite : drop contrainte unique globale sur code
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'niveaux_responsabilite'::regclass
          AND contype = 'u'
          AND conkey @> (SELECT array_agg(ordinal_position::int) FROM information_schema.columns WHERE table_name = 'niveaux_responsabilite' AND column_name = 'code')
    ) THEN
        ALTER TABLE niveaux_responsabilite DROP CONSTRAINT IF EXISTS "niveaux_responsabilite_code_key";
    END IF;

    DROP INDEX IF EXISTS "idx_niveaux_responsabilite_code_etablissementid";
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_niveaux_responsabilite_code_etab"
    ON niveaux_responsabilite (code, "etablissementId")
    WHERE "etablissementId" IS NOT NULL;
