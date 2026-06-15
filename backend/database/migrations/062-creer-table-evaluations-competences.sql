-- ==================================
-- eLISAschool - Migration 062: Créer table evaluations_competences
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-14
-- 
-- Objectif: Créer la table evaluations_competences pour
 le système APC hybride
 -- Permet d'évaluer les compétences en plus des notes traditionnelles
-- ==================================

BEGIN;

-- ÉTAPE 1: Créer le type enum pour niveau_maitrise
DO $$ BEGIN
    CREATE TYPE niveau_maitrise_enum AS ENUM (
        'DEBUTANT',
        'EN_COURS',
        'ACQUIS',
        'EXPERT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ÉTAPE 2: Créer la table evaluations_competences
CREATE TABLE IF NOT EXISTS evaluations_competences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    competence_id UUID NOT NULL REFERENCES competences(id),
    niveau_maitrise niveau_maitrise_enum NOT NULL,
    score FLOAT,
    observation TEXT,
    en_progression BOOLEAN NOT NULL DEFAULT false,
    date_evaluation DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ÉTAPE 3: Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_evaluations_competences_note ON evaluations_competences(note_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_competences_competence ON evaluations_competences(competence_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evaluations_competences_unique ON evaluations_competences(note_id, competence_id);

-- ÉTAPE 4: Ajouter les commentaires
COMMENT ON TABLE evaluations_competences IS 'Évaluation des compétences (APC) liée aux notes traditionnelles';
COMMENT ON COLUMN evaluations_competences.niveau_maitrise IS 'Niveau de maîtrise: DEBUTANT, EN_COURS, ACQUIS, EXPERT';
COMMENT ON COLUMN evaluations_competences.score IS 'Score numérique optionnel (ex: 2.5/4)';
COMMENT ON COLUMN evaluations_competences.observation IS 'Observation détaillée du professeur';
COMMENT ON COLUMN evaluations_competences.en_progression IS 'Indicateur de progression de l''élève';

-- ÉTAPE 5: Vérification
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'evaluations_competences'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✓ Table evaluations_competences créée avec succès';
        RAISE NOTICE '✓ Type enum niveau_maitrise_enum créé';
        RAISE NOTICE '✓ Index créés: note_id, competence_id, unique(note_id, competence_id)';
        RAISE NOTICE '💡 Système APC hybride prêt à utiliser';
    ELSE
        RAISE EXCEPTION '✗ Échec de la création de la table evaluations_competences';
    END IF;
END $$;

COMMIT;

-- ==================================
-- POST-MIGRATION: Utilisation
-- ==================================
-- Le système APC hybride permet:
-- 1. Saisie de notes traditionnelles (15/20)
-- 2. Évaluation des compétences associées (4 niveaux)
-- 3. Bulletins avec moyennes numériques + grille de compétences
--
-- Exemple d'insertion:
-- INSERT INTO evaluations_competences (
--     note_id, competence_id, niveau_maitrise, score, observation
-- ) VALUES (
--     'note-uuid',
--     'competence-uuid',
--     'ACQUIS',
--     3.5,
--     'L''élève maîtrise bien cette compétence'
-- );
--
-- Pour afficher les compétences d'une note:
-- SELECT ec.*, c.libelle, c.domaine
-- FROM evaluations_competences ec
-- JOIN competences c ON ec.competence_id = c.id
-- WHERE ec.note_id = '...';
--
-- Statistiques APC par élève:
-- SELECT 
--     ec.niveau_maitrise,
--     COUNT(*) as nombre,
--     ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER() * 100, 2) as pourcentage
-- FROM evaluations_competences ec
-- JOIN notes n ON ec.note_id = n.id
-- WHERE n.eleve_id = '...'
-- GROUP BY ec.niveau_maitrise;
-- ==================================
