/**
 * ==================================
 * eLISAschool - Migration 074: Contrainte UNIQUE sur MatiereNiveau composite
 * ==================================
 * 
 * Ajoute l'unicité sur (matiereId, niveauId, filiereId) pour empêcher
 * les doublons de programmes pédagogiques.
 * 
 * filiereId est nullable : PostgreSQL autorise plusieurs lignes avec NULL
 * pour les contraintes UNIQUE, donc un programme général (sans filière)
 * est bien géré.
 * 
 * Migration idempotente.
 */

-- Créer l'index unique composite
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_matieres_niveaux_matiereId_niveauId_filiereId_unique" 
    ON "matieres_niveaux" ("matiereId", "niveauId", "filiereId");
