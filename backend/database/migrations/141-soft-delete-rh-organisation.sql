-- ==========================================
-- eLISAschool - Migration 141
-- Soft delete : colonne "deletedAt" sur les entités RH / paie / organisation
-- ==========================================
-- Ajoutée le 2026-08-03. Idempotente (ADD COLUMN IF NOT EXISTS).
-- ⚠️ ORDRE STAGING/PROD : la migration 139 (index unique heures_cours)
-- référence "deletedAt" IS NULL sur heures_cours → appliquer la 141
-- AVANT la 139 si les colonnes n'existent pas encore.
--
-- Entités concernées (D1 grill-me 2026-07-29 : soft delete @DeleteDateColumn) :
--   personnel (6) : absence-personnel, evaluation-enseignant, heure-cours,
--                   affectation-poste, progression-programme, indisponibilite-enseignant
--   paie (4)      : cotisation, type-prime, type-retenue, element-salaire
--   organisation (3) : unite-organisationnelle, poste, hierarchie-personnel
--   + tables déjà en soft delete créées via synchronize uniquement :
--   membres_personnel, contrats_personnel, bulletins_paie, creneaux_horaires,
--   annonces, backup_records
-- ==========================================

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'absences_personnel',
        'affectations_postes',
        'annonces',
        'backup_records',
        'bulletins_paie',
        'contrats_personnel',
        'cotisations',
        'creneaux_horaires',
        'elements_salaire',
        'evaluations_enseignants',
        'heures_cours',
        'hierarchie_personnel',
        'indisponibilites_enseignants',
        'membres_personnel',
        'postes',
        'progressions_programme',
        'types_primes',
        'types_retenues',
        'unites_organisationnelles'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL', t);
        END IF;
    END LOOP;
END $$;
