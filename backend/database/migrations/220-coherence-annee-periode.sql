-- =============================================
-- Migration 220 — Cohérence Année Scolaire & Période
-- =============================================
-- Consolidation du modèle académique :
-- - Suppression colonnes redondantes (enCours, code) sur annees_scolaires
-- - Backfill anneeScolaireId NULL dans notes, bulletins, creneaux_horaires
-- - Index partiel pour année active par établissement
-- - Index composites performance multi-tenant
-- - Trigger cohérence cross-tenant periodes ↔ annees_scolaires
--
-- Date: 2025-08-24
-- Auteur: franck arlos chendjou
-- =============================================

BEGIN;

-- =============================================
-- ÉTAPE 1 — Backfill anneeScolaireId NULL
-- =============================================
-- Remplir anneeScolaireId depuis la relation periode → annee_scolaire
-- pour les tables qui ont periodeId mais pas anneeScolaireId

-- 1a. Notes : backfill via periodeId
UPDATE notes
SET "anneeScolaireId" = p."anneeScolaireId"
FROM periodes p
WHERE notes."periodeId" = p.id
  AND notes."anneeScolaireId" IS NULL
  AND p."anneeScolaireId" IS NOT NULL;

-- 1b. Bulletins : backfill via periodeId
UPDATE bulletins
SET "anneeScolaireId" = p."anneeScolaireId"
FROM periodes p
WHERE bulletins."periodeId" = p.id
  AND bulletins."anneeScolaireId" IS NULL
  AND p."anneeScolaireId" IS NOT NULL;

-- 1c. Créneaux horaires : backfill via periodeId
UPDATE creneaux_horaires
SET "anneeScolaireId" = p."anneeScolaireId"
FROM periodes p
WHERE creneaux_horaires."periodeId" = p.id
  AND creneaux_horaires."anneeScolaireId" IS NULL
  AND p."anneeScolaireId" IS NOT NULL;

-- =============================================
-- ÉTAPE 2 — Suppression colonnes redondantes
-- =============================================
-- La colonne "enCours" (boolean) est redondante avec statut (enum)
-- La colonne "code" (varchar) est redondante avec "libelle"

ALTER TABLE annees_scolaires DROP COLUMN IF EXISTS "enCours";
ALTER TABLE annees_scolaires DROP COLUMN IF EXISTS "code";

-- =============================================
-- ÉTAPE 3 — Index partiel année active
-- =============================================
-- Garantit un index rapide pour trouver l'année en cours par établissement
-- Contrainte : une seule année EN_COURS par établissement

CREATE UNIQUE INDEX IF NOT EXISTS idx_annees_scolaires_active
    ON annees_scolaires ("etablissementId")
    WHERE statut = 'EN_COURS';

-- =============================================
-- ÉTAPE 4 — Index composites performance (P6.3)
-- =============================================
-- Optimisation des requêtes multi-tenant sur notes et bulletins

CREATE INDEX IF NOT EXISTS idx_notes_periode_etab
    ON notes ("etablissementId", "periodeId");

CREATE INDEX IF NOT EXISTS idx_bulletins_periode_etab
    ON bulletins ("etablissementId", "periodeId");

-- =============================================
-- ÉTAPE 5 — Trigger cohérence cross-tenant
-- =============================================
-- Empêche qu'une période soit rattachée à une année scolaire
-- d'un établissement différent

CREATE OR REPLACE FUNCTION fn_check_periode_annee_coherence()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."anneeScolaireId" IS NOT NULL AND NEW."etablissementId" IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM annees_scolaires
            WHERE id = NEW."anneeScolaireId"
              AND "etablissementId" = NEW."etablissementId"
        ) THEN
            RAISE EXCEPTION 'Incohérence cross-tenant : la période (établissement %) ne peut être rattachée à une année scolaire d''un autre établissement (%)',
                NEW."etablissementId", NEW."anneeScolaireId";
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_periode_annee_coherence ON periodes;
CREATE TRIGGER trg_check_periode_annee_coherence
    BEFORE INSERT OR UPDATE OF "anneeScolaireId", "etablissementId"
    ON periodes
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_periode_annee_coherence();

-- =============================================
-- ÉTAPE 6 — Vérification intégrité post-migration
-- =============================================
-- Signaler les anomalies résiduelles

DO $$
DECLARE
    v_notes_null INT;
    v_bulletins_null INT;
    v_creneaux_null INT;
    v_periodes_orphelines INT;
BEGIN
    -- Notes sans anneeScolaireId
    SELECT COUNT(*) INTO v_notes_null
    FROM notes WHERE "anneeScolaireId" IS NULL AND "periodeId" IS NOT NULL;

    -- Bulletins sans anneeScolaireId
    SELECT COUNT(*) INTO v_bulletins_null
    FROM bulletins WHERE "anneeScolaireId" IS NULL AND "periodeId" IS NOT NULL;

    -- Créneaux sans anneeScolaireId
    SELECT COUNT(*) INTO v_creneaux_null
    FROM creneaux_horaires WHERE "anneeScolaireId" IS NULL AND "periodeId" IS NOT NULL;

    -- Périodes sans année scolaire
    SELECT COUNT(*) INTO v_periodes_orphelines
    FROM periodes p
    WHERE NOT EXISTS (
        SELECT 1 FROM annees_scolaires a WHERE a.id = p."anneeScolaireId"
    );

    IF v_notes_null > 0 OR v_bulletins_null > 0 OR v_creneaux_null > 0 THEN
        RAISE WARNING 'Backfill incomplet — notes: %, bulletins: %, créneaux: % lignes sans anneeScolaireId',
            v_notes_null, v_bulletins_null, v_creneaux_null;
    END IF;

    IF v_periodes_orphelines > 0 THEN
        RAISE WARNING 'Intégrité : % période(s) sans année scolaire correspondante', v_periodes_orphelines;
    END IF;

    RAISE NOTICE '✅ Migration 220 terminée — Backfill: notes=%, bulletins=%, créneaux=% | Périodes orphelines=%',
        v_notes_null, v_bulletins_null, v_creneaux_null, v_periodes_orphelines;
END $$;

COMMIT;
