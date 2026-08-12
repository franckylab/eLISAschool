-- ==================================
-- eLISAschool - Migration 177
-- ==================================
-- Ajout du statut ARCHIVE à l'enum utilisateurs_statut_enum
-- + Ajout des endpoints audit rôle et comparaison permissions
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- ==================================

-- 1. Ajouter ARCHIVE à l'enum statut utilisateur
ALTER TYPE "utilisateurs_statut_enum" ADD VALUE IF NOT EXISTS 'ARCHIVE';

-- 2. Index pour filtrer les utilisateurs archivés (performance)
CREATE INDEX IF NOT EXISTS "idx_utilisateurs_statut_archive"
    ON "utilisateurs" ("statut")
    WHERE "statut" = 'ARCHIVE';

-- 3. Vue partielle : utilisateurs non-archivés (usage courant)
-- (Pas de vue matérielle, les requêtes filtrent directement statut != 'ARCHIVE')
