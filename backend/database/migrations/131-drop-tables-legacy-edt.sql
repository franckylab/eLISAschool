-- ==================================
-- eLISAschool - Migration 131 : Suppression tables legacy EDT
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-07-27
--
-- Objectif : Supprimer définitivement les tables héritées remplacées par
-- l'architecture v4.0 (CreneauHoraire + AffectationMatiere absorbée).
--
-- Tables supprimées :
--   * emploi_du_temps           → fusionné dans creneaux_horaires (migration 114)
--   * repartitions_horaires     → fusionné dans creneaux_horaires (migration 114)
--   * configurations_matieres_classes → absorbé par affectations_matieres (migration 115)
--
-- Pré-requis :
--   * creneaux_horaires existe et contient les données migrées
--   * heures_cours.creneauId pointe déjà vers creneaux_horaires(id)
--   * affectations_matieres possède les colonnes obligatoire + statutValidation
--
-- Migration idempotente : DROP IF EXISTS + garde de sécurité en tête.
-- ==================================

-- 1. Garde de sécurité : refuser si creneaux_horaires manque
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'creneaux_horaires'
    ) THEN
        RAISE EXCEPTION 'Migration 131 refusée : table creneaux_horaires manquante. Exécuter d''abord la migration 114.';
    END IF;
END $$;

-- 2. Nettoyage défensif des FK résiduelles héritées de la migration 071
--    (au cas où une installation legacy porterait encore une FK vers emploi_du_temps)
DO $$
DECLARE
    fk_row RECORD;
BEGIN
    FOR fk_row IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'heures_cours'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name IN ('emploi_du_temps', 'repartitions_horaires')
    LOOP
        EXECUTE format('ALTER TABLE heures_cours DROP CONSTRAINT IF EXISTS %I', fk_row.constraint_name);
        RAISE NOTICE 'FK legacy supprimée : %', fk_row.constraint_name;
    END LOOP;
END $$;

-- 3. S'assurer que heures_cours.creneauId → creneaux_horaires(id) existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'heures_cours' AND column_name = 'creneauId'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'heures_cours'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'creneaux_horaires'
    ) THEN
        ALTER TABLE heures_cours
            ADD CONSTRAINT "FK_heures_cours_creneau_horaire"
            FOREIGN KEY ("creneauId") REFERENCES creneaux_horaires(id)
            ON DELETE SET NULL;
        RAISE NOTICE 'FK heures_cours.creneauId → creneaux_horaires(id) créée';
    END IF;
END $$;

-- 4. Suppression des tables legacy (CASCADE pour tout index/FK résiduels)
DROP TABLE IF EXISTS emploi_du_temps CASCADE;
DROP TABLE IF EXISTS repartitions_horaires CASCADE;
DROP TABLE IF EXISTS configurations_matieres_classes CASCADE;

-- 5. Vérification finale
DO $$
DECLARE
    tables_restantes TEXT;
BEGIN
    SELECT string_agg(table_name, ', ') INTO tables_restantes
    FROM information_schema.tables
    WHERE table_name IN ('emploi_du_temps', 'repartitions_horaires', 'configurations_matieres_classes');

    IF tables_restantes IS NOT NULL THEN
        RAISE EXCEPTION 'Migration 131 échouée : tables encore présentes : %', tables_restantes;
    END IF;

    RAISE NOTICE '✅ Migration 131 terminée : tables legacy EDT supprimées.';
END $$;
