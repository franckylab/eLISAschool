-- ==================================
-- eLISAschool - Migration 061: Créer table bulletins_matieres
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-14
-- 
-- Objectif: Créer la table bulletins_matieres pour stocker
-- les moyennes par matière et améliorer les performances
-- ==================================

BEGIN;

-- ÉTAPE 1: Créer la table bulletins_matieres
CREATE TABLE IF NOT EXISTS bulletins_matieres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulletin_id UUID NOT NULL REFERENCES bulletins(id) ON DELETE CASCADE,
    matiere_id UUID NOT NULL REFERENCES matieres(id),
    moyenne FLOAT NOT NULL DEFAULT 0,
    coefficient FLOAT NOT NULL DEFAULT 1,
    rang_matiere INT,
    moyenne_min_classe FLOAT,
    moyenne_max_classe FLOAT,
    moyenne_classe FLOAT,
    appreciation VARCHAR(500),
    nombre_notes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ÉTAPE 2: Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_bulletins_matieres_bulletin ON bulletins_matieres(bulletin_id);
CREATE INDEX IF NOT EXISTS idx_bulletins_matieres_matiere ON bulletins_matieres(matiere_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bulletins_matieres_unique ON bulletins_matieres(bulletin_id, matiere_id);

-- ÉTAPE 3: Ajouter les commentaires
COMMENT ON TABLE bulletins_matieres IS 'Stocke les moyennes par matière dans un bulletin pour éviter les recalculs';
COMMENT ON COLUMN bulletins_matieres.moyenne IS 'Moyenne de l''élève dans cette matière (sur 20)';
COMMENT ON COLUMN bulletins_matieres.coefficient IS 'Coefficient utilisé pour le calcul';
COMMENT ON COLUMN bulletins_matieres.rang_matiere IS 'Rang de l''élève dans cette matière';
COMMENT ON COLUMN bulletins_matieres.appreciation IS 'Appréciation du professeur pour cette matière';

-- ÉTAPE 4: Vérification
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'bulletins_matieres'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✓ Table bulletins_matieres créée avec succès';
        RAISE NOTICE '✓ Index créés: bulletin_id, matiere_id, unique(bulletin_id, matiere_id)';
    ELSE
        RAISE EXCEPTION '✗ Échec de la création de la table bulletins_matieres';
    END IF;
END $$;

COMMIT;

-- ==================================
-- POST-MIGRATION: Utilisation
-- ==================================
-- Lors de la génération d'un bulletin, remplir cette table:
-- 
-- INSERT INTO bulletins_matieres (
--     bulletin_id, matiere_id, moyenne, coefficient, 
--     moyenne_min_classe, moyenne_max_classe, moyenne_classe,
--     appreciation, nombre_notes
-- ) VALUES (
--     '...', '...', 15.5, 3, 8.0, 18.5, 13.2, 'Bon travail', 5
-- );
--
-- Pour afficher un bulletin (performance optimisée):
-- SELECT bm.*, m.nom, m.code
-- FROM bulletins_matieres bm
-- JOIN matieres m ON bm.matiere_id = m.id
-- WHERE bm.bulletin_id = '...'
-- ORDER BY bm.coefficient DESC, m.nom ASC;
-- ==================================
