-- ==================================
-- eLISAschool - Config matérialisation automatique HeureCours (Q7)
-- ==================================
-- Version: 1.0.0
--
-- Ajoute la colonne materialisationAuto (JSONB) sur preferences_emploi_du_temps :
--   {
--     "actif": true,
--     "horaires": [ { "jour": "SAMEDI", "heure": "21:00" }, ... ]
--   }
-- Chaque horaire déclenche la matérialisation [lundi S, dimanche S+1] clampée
-- aux bornes de l'année scolaire EN_COURS, pour les créneaux VALIDE +
-- genereAutomatiquement. Défaut (colonne absente) : actif, samedi 21:00 +
-- mercredi 21:00 (voir DEFAULT_MATERIALISATION_AUTO dans cron-jobs.ts).
-- ==================================

ALTER TABLE preferences_emploi_du_temps
    ADD COLUMN IF NOT EXISTS "materialisationAuto" jsonb;
