-- ==================================
-- eLISAschool - Migration 056: Refactorisation Note.enseignantId
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-14
-- 
-- Objectif: Convertir Note.enseignantId de Utilisateur vers MembrePersonnel
-- pour cohérence avec AffectationMatiere et logique métier
-- ==================================

BEGIN;

-- ÉTAPE 1: Ajouter une nouvelle colonne temporaire pour la FK MembrePersonnel
ALTER TABLE notes 
ADD COLUMN IF NOT EXISTS membrePersonnelId UUID;

-- ÉTAPE 2: Migrer les données existantes
-- Trouver le MembrePersonnel correspondant à chaque enseignant (Utilisateur)
-- Via la relation MembrePersonnel.utilisateurId = Note.enseignantId
UPDATE notes
SET "membrePersonnelId" = mp.id
FROM membres_personnel mp
WHERE mp."utilisateurId" = notes."enseignantId";

-- ÉTAPE 3: Vérifier la migration
DO $$
DECLARE
    total_notes INT;
    migrated_notes INT;
    unmigrated_notes INT;
BEGIN
    SELECT COUNT(*) INTO total_notes FROM notes;
    SELECT COUNT(*) INTO migrated_notes FROM notes WHERE membrePersonnelId IS NOT NULL;
    unmigrated_notes := total_notes - migrated_notes;
    
    RAISE NOTICE 'Total notes: %', total_notes;
    RAISE NOTICE 'Notes migrées: %', migrated_notes;
    RAISE NOTICE 'Notes non migrées (pas de MembrePersonnel associé): %', unmigrated_notes;
    
    -- Alerte si des notes ne peuvent pas être migrées
    IF unmigrated_notes > 0 THEN
        RAISE WARNING '% notes n''ont pas de MembrePersonnel associé. Vérifiez les données.', unmigrated_notes;
    END IF;
END $$;

-- ÉTAPE 4: Supprimer l'ancienne contrainte de clé étrangère (si elle existe)
-- TypeORM gère les FK automatiquement, donc on ne touche pas aux contraintes ici
-- La migration sera gérée par TypeORM lors de la synchronisation

-- ÉTAPE 5: Renommer les colonnes (approche progressive)
-- Pour l'instant, on garde enseignantId comme colonne principale
-- TypeORM utilisera cette colonne pour la nouvelle FK vers membres_personnel

-- NOTE: TypeORM synchronisera automatiquement la FK lors du prochain démarrage
-- car l'entité Note a été modifiée pour pointer vers MembrePersonnel

COMMIT;

-- ==================================
-- POST-MIGRATION: Vérification
-- ==================================
-- Exécuter après migration:
-- SELECT 
--     n.id,
--     n.enseignantId,
--     mp.id as membrePersonnelId,
--     mp.utilisateurId,
--     u.email
-- FROM notes n
-- LEFT JOIN membres_personnel mp ON n.enseignantId = mp.utilisateurId
-- LEFT JOIN utilisateurs u ON mp.utilisateurId = u.id
-- LIMIT 10;
