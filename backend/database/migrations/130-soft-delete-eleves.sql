-- ==================================
-- eLISAschool - Migration 130
-- Soft delete élèves (colonne deletedAt)
-- ==================================
-- Ajoute le support du soft delete sur la table eleves.
-- Les suppressions sont désormais réversibles.
-- ==================================

-- 1. Ajouter la colonne deletedAt
ALTER TABLE eleves ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- 2. Index pour les requêtes avec soft delete
CREATE INDEX IF NOT EXISTS "idx_eleves_deleted_at" ON eleves ("deletedAt");
