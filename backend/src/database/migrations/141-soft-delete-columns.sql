/**
 * ==================================
 * eLISAschool - Migration 141
 * ==================================
 * Ajout des colonnes deletedAt (soft delete) sur 19 entités
 * 
 * Contexte : @DeleteDateColumn() a été ajoutée sur les entités mais
 * la migration SQL explicite manque pour les environnements sans synchronize.
 * 
 * Tables concernées :
 *   Personnel (8) : membres_personnel, contrats_personnel, absences_personnel,
 *                   evaluations_enseignants, indisponibilites_enseignants,
 *                   heures_cours, affectations_postes, progressions_programme
 *   Organisation (3) : unites_organisationnelles, postes, hierarchie_personnel
 *   Paie (5) : bulletins_paie, cotisations, types_primes, types_retenues,
 *              elements_salaire
 *   Autres (3) : annonces, backup_records, eleves
 */

-- ============================================
-- Personnel
-- ============================================
ALTER TABLE membres_personnel ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE contrats_personnel ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE absences_personnel ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE evaluations_enseignants ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE indisponibilites_enseignants ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE heures_cours ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE affectations_postes ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE progressions_programme ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;

-- ============================================
-- Organisation
-- ============================================
ALTER TABLE unites_organisationnelles ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE postes ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE hierarchie_personnel ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;

-- ============================================
-- Paie
-- ============================================
ALTER TABLE bulletins_paie ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE cotisations ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE types_primes ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE types_retenues ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE elements_salaire ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;

-- ============================================
-- Autres modules
-- ============================================
ALTER TABLE annonces ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE backup_records ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;