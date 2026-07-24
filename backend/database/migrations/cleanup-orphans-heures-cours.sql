-- ===================================================
-- eLISAschool — Nettoyage orphelins avant synchronize
-- ===================================================
-- Exécuter AVANT le premier démarrage après migration
--   psql -U postgres -d elisaschool -f cleanup-orphans.sql
-- ===================================================

BEGIN;

-- Supprimer les heures_cours dont classeAnneeId ne correspond à aucune classe_annee
DELETE FROM heures_cours
WHERE classeAnneeId IS NOT NULL
  AND classeAnneeId::text != ''
  AND NOT EXISTS (
      SELECT 1 FROM classes_annees WHERE id = heures_cours.classeAnneeId
  );

-- Supprimer les heures_cours dont salleId ne correspond à aucune salle
DELETE FROM heures_cours
WHERE salleId IS NOT NULL
  AND salleId::text != ''
  AND NOT EXISTS (
      SELECT 1 FROM salles WHERE id = heures_cours.salleId
  );

COMMIT;