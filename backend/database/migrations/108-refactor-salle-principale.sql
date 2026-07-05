-- Migration 108 : Refactor salle principale
-- Déplace salleId de classes (permanent) → sallePrincipaleId sur classes_annees (par année)
-- Nettoie la colonne morte sallePrincipale VARCHAR ajoutée par migration 100
BEGIN;

-- 1. Nettoyer la colonne morte sallePrincipale VARCHAR (migration 100)
ALTER TABLE classes DROP COLUMN IF EXISTS "sallePrincipale";
DROP INDEX IF EXISTS idx_classes_salle_principale;

-- 2. Ajouter sallePrincipaleId UUID FK sur classes_annees
ALTER TABLE classes_annees ADD COLUMN IF NOT EXISTS "sallePrincipaleId" UUID;

-- 3. Migrer les données existantes de classes.salleId vers classes_annees.sallePrincipaleId
UPDATE classes_annees ca
SET "sallePrincipaleId" = c."salleId"
FROM classes c
WHERE ca."classeId" = c.id
  AND c."salleId" IS NOT NULL
  AND ca."sallePrincipaleId" IS NULL;

-- 4. Ajouter FK et index sur classes_annees.sallePrincipaleId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_classes_annees_salle_principale'
    ) THEN
        ALTER TABLE classes_annees
            ADD CONSTRAINT fk_classes_annees_salle_principale
            FOREIGN KEY ("sallePrincipaleId") REFERENCES salles(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_classes_annees_salle_principale
    ON classes_annees ("sallePrincipaleId");

-- 5. Supprimer la FK sur classes.salleId (si existante, nom auto-généré par TypeORM)
DO $$
DECLARE
    fk_name TEXT;
BEGIN
    SELECT con.conname INTO fk_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'classes'
      AND con.contype = 'f'
      AND EXISTS (
          SELECT 1 FROM pg_attribute att
          WHERE att.attrelid = con.conrelid
            AND att.attnum = ANY(con.conkey)
            AND att.attname = 'salleId'
      );
    
    IF fk_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE classes DROP CONSTRAINT ' || quote_ident(fk_name);
        RAISE NOTICE 'FK supprimée: classes.%', fk_name;
    END IF;
END $$;

ALTER TABLE classes DROP COLUMN IF EXISTS "salleId";

COMMIT;
