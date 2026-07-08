-- ============================================
-- Migration 072: Programme → Matière Resolution Chain
-- ============================================
-- 
-- 1. Ajout programmeId à classes_annees
-- 2. Unicité globale sur programmes_matieres.matiereNiveauId (disjoint)
-- 3. Suppression unicité sur matieres_niveaux (matiereId, niveauId, filiereId, periodeId)
-- ============================================

BEGIN;

-- 1. Ajout programmeId à classes_annees
ALTER TABLE classes_annees
    ADD COLUMN IF NOT EXISTS "programmeId" uuid REFERENCES programmes_pedagogiques(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classes_annees_programme_id ON classes_annees("programmeId");

-- 2. Contrainte d'unicité globale sur programmes_matieres.matiereNiveauId
-- Supprimer les doublons (garder la première occurrence pour chaque matiereNiveauId)
WITH duplicates AS (
    SELECT id, "matiereNiveauId",
           ROW_NUMBER() OVER (PARTITION BY "matiereNiveauId" ORDER BY id) AS rn
    FROM programmes_matieres
)
DELETE FROM programmes_matieres
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Supprimer l'ancien index unique composite
DROP INDEX IF EXISTS idx_programmes_matieres_programme_matiere_niveau;

-- Créer le nouvel index unique global sur matiereNiveauId
CREATE UNIQUE INDEX IF NOT EXISTS idx_programmes_matieres_matiere_niveau_id
    ON programmes_matieres ("matiereNiveauId");

-- Index de performance (programmeId, etablissementId)
CREATE INDEX IF NOT EXISTS idx_programmes_matieres_programme_etablissement
    ON programmes_matieres ("programmeId", "etablissementId");

-- 3. Supprimer l'unicité sur matieres_niveaux (matiereId, niveauId, filiereId, periodeId)
DROP INDEX IF EXISTS idx_matieres_niveaux_matiere_filiere_periode;

-- Recréer en non-unique
CREATE INDEX IF NOT EXISTS idx_matieres_niveaux_matiere_niveau_filiere_periode
    ON matieres_niveaux ("matiereId", "niveauId", "filiereId", "periodeId");

COMMIT;
