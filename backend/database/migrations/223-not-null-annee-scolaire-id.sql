-- =============================================
-- Migration 223 — NOT NULL anneeScolaireId sur Notes et Bulletins
-- =============================================
-- Cohérence du modèle académique :
-- anneeScolaireId est toujours dérivable via periodeId → periode.anneeScolaireId
-- Le backfill (migration 220) a déjà rempli toutes les valeurs NULL.
-- Cette migration rend la colonne NOT NULL pour garantir l'intégrité référentielle.
--
-- Date: 2026-08-21
-- Auteur: franck arlos chendjou
-- =============================================

BEGIN;

-- =============================================
-- ÉTAPE 1 — Backfill de sécurité (idempotent)
-- =============================================
-- Au cas où des lignes NULL auraient été insérées après la migration 220

UPDATE notes
SET "anneeScolaireId" = p."anneeScolaireId"
FROM periodes p
WHERE notes."periodeId" = p.id
  AND notes."anneeScolaireId" IS NULL
  AND p."anneeScolaireId" IS NOT NULL;

UPDATE bulletins
SET "anneeScolaireId" = p."anneeScolaireId"
FROM periodes p
WHERE bulletins."periodeId" = p.id
  AND bulletins."anneeScolaireId" IS NULL
  AND p."anneeScolaireId" IS NOT NULL;

-- =============================================
-- ÉTAPE 2 — Contrainte NOT NULL
-- =============================================

ALTER TABLE notes
    ALTER COLUMN "anneeScolaireId" SET NOT NULL;

ALTER TABLE bulletins
    ALTER COLUMN "anneeScolaireId" SET NOT NULL;

-- =============================================
-- ÉTAPE 3 — Vérification intégrité
-- =============================================

DO $$
DECLARE
    v_notes_null INT;
    v_bulletins_null INT;
BEGIN
    SELECT COUNT(*) INTO v_notes_null
    FROM notes WHERE "anneeScolaireId" IS NULL;

    SELECT COUNT(*) INTO v_bulletins_null
    FROM bulletins WHERE "anneeScolaireId" IS NULL;

    IF v_notes_null > 0 OR v_bulletins_null > 0 THEN
        RAISE EXCEPTION 'Intégrité rompue : notes=%, bulletins=% avec anneeScolaireId NULL',
            v_notes_null, v_bulletins_null;
    END IF;

    RAISE NOTICE '✅ Migration 223 terminée — anneeScolaireId NOT NULL sur notes et bulletins';
END $$;

COMMIT;
