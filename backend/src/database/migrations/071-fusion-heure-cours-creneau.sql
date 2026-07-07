-- ============================================================
-- eLISAschool - Migration 071: Fusion HeureCours ↔ Emploi du Temps
-- ============================================================
-- Ajoute la FK creneauId sur heures_cours pour lier chaque
-- heure de cours réelle au créneau EDT planifié.
--
-- Permet :
--   - traçabilité cours planifié → cours effectué
--   - typeSource dans l'API EDT unifiée
--   - transition progressive (creneauId nullable)
-- ============================================================

-- 1. Ajouter la colonne creneauId sur heures_cours
ALTER TABLE heures_cours
    ADD COLUMN IF NOT EXISTS "creneauId" UUID;

-- 2. Index pour les recherches par créneau
CREATE INDEX IF NOT EXISTS idx_heures_cours_creneau_id
    ON heures_cours ("creneauId");

-- 3. FK vers emploi_du_temps (SET NULL pour préserver l'historique
--    même si le créneau planifié est supprimé)
ALTER TABLE heures_cours
    ADD CONSTRAINT fk_heures_cours_creneau
    FOREIGN KEY ("creneauId")
    REFERENCES emploi_du_temps (id)
    ON DELETE SET NULL;

-- 4. Index composite enseignant + date + creneauId pour conflits
CREATE INDEX IF NOT EXISTS idx_heures_cours_ens_date_creneau
    ON heures_cours ("enseignantId", "date", "creneauId");

-- ============================================================
-- Rollback
-- ============================================================
-- ALTER TABLE heures_cours DROP CONSTRAINT IF EXISTS fk_heures_cours_creneau;
-- DROP INDEX IF EXISTS idx_heures_cours_creneau_id;
-- DROP INDEX IF EXISTS idx_heures_cours_ens_date_creneau;
-- ALTER TABLE heures_cours DROP COLUMN IF EXISTS "creneauId";
