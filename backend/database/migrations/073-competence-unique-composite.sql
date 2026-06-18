/**
 * ==================================
 * eLISAschool - Migration 073: Contrainte UNIQUE sur Competence composite
 * ==================================
 * 
 * Transforme l'index composite (niveauId, matiereId, etablissementId)
 * en contrainte UNIQUE pour empêcher les doublons de compétences.
 * 
 * Migration idempotente.
 */

-- Supprimer l'ancien index non-unique s'il existe
DROP INDEX IF EXISTS "IDX_competences_niveauId_matiereId_etablissementId";

-- Créer l'index unique composite
-- Note: matiereId est nullable, PostgreSQL traite les NULL comme distincts dans les contraintes UNIQUE
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_competences_niveauId_matiereId_etablissementId_unique" 
    ON "competences" ("niveauId", "matiereId", "etablissementId");
