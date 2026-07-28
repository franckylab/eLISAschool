-- ==================================
-- eLISAschool - Migration 128 : Volume horaire en minutes (source unique MatiereNiveau)
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- Contexte (arbitrage A4) : MatiereNiveau.volumeHoraire devient la source unique
-- exprimée en MINUTES par semaine. Les données legacy étaient saisies en heures.
-- Heuristique idempotente : toute valeur < 60 est considérée comme des heures
-- legacy (aucune matière n'a un volume < 1h/semaine) et est convertie en minutes.
-- Une valeur >= 60 est déjà en minutes — la ré-exécution ne change rien.

BEGIN;

UPDATE matieres_niveaux
SET "volumeHoraire" = "volumeHoraire" * 60
WHERE "volumeHoraire" IS NOT NULL
  AND "volumeHoraire" < 60;

COMMIT;
