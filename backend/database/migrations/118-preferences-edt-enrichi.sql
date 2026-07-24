-- ==================================
-- eLISAschool - Migration 118 : Préférences Emploi du Temps enrichies
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-07-24
--
-- Objectif : Enrichir PreferenceEmploiDuTemps avec les pauses matin/après-midi
-- et les créneaux imposables (exclusions fines par jour/créneau).
-- ==================================

-- 1. Ajouter les colonnes de pauses matin et après-midi
ALTER TABLE preferences_emploi_du_temps ADD COLUMN IF NOT EXISTS "pauseMatineeDebut" TIME;
ALTER TABLE preferences_emploi_du_temps ADD COLUMN IF NOT EXISTS "pauseMatineeFin" TIME;
ALTER TABLE preferences_emploi_du_temps ADD COLUMN IF NOT EXISTS "pauseApresMidiDebut" TIME;
ALTER TABLE preferences_emploi_du_temps ADD COLUMN IF NOT EXISTS "pauseApresMidiFin" TIME;

-- 2. Migrer les pauses existantes (pauseDebut/pauseFin) vers pauseMatinee si non définies
-- Note : les anciennes pausesDebut/Fin représentaient probablement la pause déjeuner
-- On garde les anciennes colonnes pour compatibilité, mais on documente que
-- pauseDebut/Fin = pause déjeuner, pauseMatineeDebut/Fin = récréation matin

-- 3. Ajouter la colonne JSONB pour les créneaux imposables
-- Structure : [{ jour: 'LUNDI', heureDebut: '08:00', heureFin: '10:00', motif: 'Réunion' }]
ALTER TABLE preferences_emploi_du_temps ADD COLUMN IF NOT EXISTS "creneauxImposables" JSONB DEFAULT '[]'::jsonb;

-- 4. Index pour les requêtes de préférences par établissement
CREATE INDEX IF NOT EXISTS idx_preferences_edt_etablissement ON preferences_emploi_du_temps("etablissementId");
