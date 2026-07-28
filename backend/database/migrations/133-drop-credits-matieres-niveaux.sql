/**
 * ==================================
 * eLISAschool - Migration 133
 * ==================================
 * Supprime la colonne `credits` de matieres_niveaux.
 * Le système anglophone/LMD n'est plus utilisé dans eLISAschool —
 * coefficient + barème sont la source unique de vérité.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

-- Supprimer la colonne credits (idempotent)
ALTER TABLE matieres_niveaux DROP COLUMN IF EXISTS "credits";

-- Nettoyage index obsolètes (recréation si nécessaire)
-- L'index composite (matiereId, niveauId, filiereId, periodeId) est conservé
