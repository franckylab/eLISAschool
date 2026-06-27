/**
 * ==================================
 * eLISAschool - Migration 084: Cleanup classeId dans Note et Bulletin
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-27
 * 
 * Objectif: Supprimer les champs classeId redondants de Note et Bulletin
 * pour les déduire via AffectationEleve (source unique de vérité)
 * 
 * Impact:
 * - notes.classeId → déduit via AffectationEleve
 * - bulletins.classeId → conservé (bulletin est PAR classe)
 */

-- ==================================
-- PRÉ-MIGRATION: Backup des données
-- ==================================

-- Créer des tables temporaires pour audit
CREATE TEMP TABLE IF NOT EXISTS temp_notes_classe_backup AS
SELECT id, "classeId", "eleveId", "anneeScolaireId"
FROM notes
WHERE "classeId" IS NOT NULL;

CREATE TEMP TABLE IF NOT EXISTS temp_bulletins_classe_backup AS
SELECT id, "classeId", "eleveId", "periodeId"
FROM bulletins
WHERE "classeId" IS NOT NULL;

-- Compter les lignes affectées
DO $$
DECLARE
    notes_count INTEGER;
    bulletins_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO notes_count FROM temp_notes_classe_backup;
    SELECT COUNT(*) INTO bulletins_count FROM temp_bulletins_classe_backup;
    
    RAISE NOTICE '📊 Notes avec classeId: %', notes_count;
    RAISE NOTICE '📊 Bulletins avec classeId: %', bulletins_count;
END $$;

-- ==================================
-- MIGRATION: Suppression des colonnes
-- ==================================

-- 1. Supprimer classeId de notes
ALTER TABLE notes 
DROP COLUMN IF EXISTS "classeId";

-- Supprimer l'index associé (s'il existe)
DROP INDEX IF EXISTS "IDX_notes_classeId";
DROP INDEX IF EXISTS "idx_notes_classe";

-- 2. IMPORTANT: CONSERVER classeId dans bulletins
-- Un bulletin est généré PAR classe, pas déduit de l'élève
-- Donc on ne supprime PAS bulletins.classeId

-- ==================================
-- POST-MIGRATION: Vérification
-- ==================================

-- Vérifier que la colonne a été supprimée
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes' AND column_name = 'classeId'
    ) THEN
        RAISE EXCEPTION '❌ ÉCHEC: La colonne notes.classeId existe toujours';
    ELSE
        RAISE NOTICE '✅ SUCCÈS: notes.classeId supprimée avec succès';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bulletins' AND column_name = 'classeId'
    ) THEN
        RAISE NOTICE '✅ OK: bulletins.classeId conservée (normal)';
    ELSE
        RAISE WARNING '⚠️  ATTENTION: bulletins.classeId manquante (inattendu)';
    END IF;
END $$;

-- ==================================
-- DOCUMENTATION
-- ==================================

COMMENT ON TABLE notes IS 'classeId supprimé (migration 084) - déduit via AffectationEleve';
COMMENT ON COLUMN notes."eleveId" IS 'Lien vers l''élève - classe déduite via AffectationEleve(eleveId, anneeScolaireId, actif=true)';

-- ==================================
-- ROLLBACK (en cas de problème)
-- ==================================

/*
-- Pour annuler cette migration:
ALTER TABLE notes ADD COLUMN "classeId" UUID;

-- Restaurer depuis le backup temporaire
UPDATE notes n
SET "classeId" = b."classeId"
FROM temp_notes_classe_backup b
WHERE n.id = b.id;

CREATE INDEX IF NOT EXISTS "IDX_notes_classeId" ON notes("classeId");
*/
