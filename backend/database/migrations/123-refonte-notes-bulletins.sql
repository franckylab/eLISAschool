-- ==================================
-- eLISAschool - Migration 123 : Refonte Notes + Bulletins (Phase A 2026-07-25)
-- ==================================
-- Contexte :
--   1. notes.enseignantId devient nullable et référence membres_personnel (et non utilisateurs)
--   2. bulletins : index unique (etablissementId, eleveId, periodeId) — dédoublonnage préalable
--   3. audit_logs : nouvelle valeur d'enum BULLETIN_DELETE
-- SQL idempotent — exécutable plusieurs fois sans effet de bord.
-- ==================================

-- ----------------------------------
-- 1. NOTES — enseignantId nullable + remap Utilisateur.id → MembrePersonnel.id
-- ----------------------------------

-- 1.1 Rendre la colonne nullable
ALTER TABLE notes ALTER COLUMN "enseignantId" DROP NOT NULL;

-- 1.2 Remapper les anciennes valeurs (Utilisateur.id) vers MembrePersonnel.id
UPDATE notes n
SET "enseignantId" = mp.id
FROM membres_personnel mp
WHERE n."enseignantId" = mp."utilisateurId"
  AND NOT EXISTS (SELECT 1 FROM membres_personnel m2 WHERE m2.id = n."enseignantId");

-- 1.3 Mettre à NULL les valeurs orphelines (ni MembrePersonnel.id, ni remappables)
UPDATE notes n
SET "enseignantId" = NULL
WHERE n."enseignantId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM membres_personnel m2 WHERE m2.id = n."enseignantId");

-- 1.4 Supprimer toute FK obsolète sur enseignantId (ex: vers utilisateurs) et recréer vers membres_personnel
DO $$
DECLARE
    fk RECORD;
    fk_ok BOOLEAN := FALSE;
BEGIN
    FOR fk IN
        SELECT con.conname, ref.relname AS ref_table
        FROM pg_constraint con
        JOIN pg_class tbl ON tbl.oid = con.conrelid AND tbl.relname = 'notes'
        JOIN pg_class ref ON ref.oid = con.confrelid
        JOIN pg_attribute att ON att.attrelid = tbl.oid AND att.attnum = ANY (con.conkey)
        WHERE con.contype = 'f' AND att.attname = 'enseignantId'
    LOOP
        IF fk.ref_table = 'membres_personnel' THEN
            fk_ok := TRUE;
        ELSE
            EXECUTE format('ALTER TABLE notes DROP CONSTRAINT %I', fk.conname);
        END IF;
    END LOOP;

    IF NOT fk_ok THEN
        ALTER TABLE notes
            ADD CONSTRAINT "FK_notes_enseignant_membre_personnel"
            FOREIGN KEY ("enseignantId") REFERENCES membres_personnel (id);
    END IF;
END $$;

-- ----------------------------------
-- 2. BULLETINS — index unique (etablissementId, eleveId, periodeId)
-- ----------------------------------

-- 2.1 Dédoublonnage préalable : conserver le bulletin le plus récent (updatedAt) par tuple
DELETE FROM bulletins b
USING bulletins b2
WHERE b."etablissementId" IS NOT DISTINCT FROM b2."etablissementId"
  AND b."eleveId" = b2."eleveId"
  AND b."periodeId" = b2."periodeId"
  AND b.id <> b2.id
  AND (b."updatedAt" < b2."updatedAt"
       OR (b."updatedAt" = b2."updatedAt" AND b.id < b2.id));

-- 2.2 Créer l'index unique s'il n'existe pas déjà un équivalent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_index i
        JOIN pg_class c ON c.oid = i.indrelid AND c.relname = 'bulletins'
        WHERE i.indisunique
          AND (
            SELECT array_agg(a.attname ORDER BY a.attname)
            FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
            JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
          ) = ARRAY['eleveId', 'etablissementId', 'periodeId']::name[]
    ) THEN
        CREATE UNIQUE INDEX "IDX_bulletins_etab_eleve_periode"
            ON bulletins ("etablissementId", "eleveId", "periodeId");
    END IF;
END $$;

-- ----------------------------------
-- 3. AUDIT — valeur d'enum BULLETIN_DELETE
-- ----------------------------------
DO $$
DECLARE
    enum_type TEXT;
BEGIN
    SELECT t.typname INTO enum_type
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE e.enumlabel = 'BULLETIN_GENERATE'
    LIMIT 1;

    IF enum_type IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE t.typname = enum_type AND e.enumlabel = 'BULLETIN_DELETE'
    ) THEN
        EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type, 'BULLETIN_DELETE');
    END IF;
END $$;
