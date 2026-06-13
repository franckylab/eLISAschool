-- ==================================
-- eLISAschool - Migration 055: Améliorations Structure Académique
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-13
-- 
-- Objectifs:
-- 1. Harmoniser les codes Cycle (SECONDAIRE_1 → COLLEGE, SECONDAIRE_2 → LYCEE)
-- 2. Convertir filieres.soussysteme en valeurs compatibles enum
-- 3. Ajouter filiereId, typeClasse, creneauHoraire, description à classes
-- 4. Créer index pour performance
-- ==================================

BEGIN;

-- ==================================
-- 1. HARMONISATION CODES CYCLE
-- ==================================

-- Renommer SECONDAIRE_1 → COLLEGE
UPDATE cycles 
SET code = 'COLLEGE' 
WHERE code = 'SECONDAIRE_1';

-- Renommer SECONDAIRE_2 → LYCEE
UPDATE cycles 
SET code = 'LYCEE' 
WHERE code = 'SECONDAIRE_2';

-- Vérification
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cycles WHERE code = 'SECONDAIRE_1') THEN
        RAISE EXCEPTION 'Migration échouée: code SECONDAIRE_1 existe encore';
    END IF;
    IF EXISTS (SELECT 1 FROM cycles WHERE code = 'SECONDAIRE_2') THEN
        RAISE EXCEPTION 'Migration échouée: code SECONDAIRE_2 existe encore';
    END IF;
END $$;

-- ==================================
-- 2. PRÉPARATION FILIERES.SOUSSYSTEME
-- ==================================

-- Nettoyer les valeurs invalides avant conversion enum
UPDATE filieres 
SET soussysteme = 'FRANCOPHONE' 
WHERE soussysteme NOT IN ('FRANCOPHONE', 'ANGLOPHONE', 'BICULTUREL')
   OR soussysteme IS NULL;

-- ==================================
-- 3. AJOUT COLONNES À CLASSES
-- ==================================

-- 3.1 filiereId (relation vers filieres)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS "filiereId" UUID;

-- Créer la contrainte de clé étrangère seulement si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_classes_filiereId_filieres'
    ) THEN
        ALTER TABLE classes 
        ADD CONSTRAINT "FK_classes_filiereId_filieres" 
        FOREIGN KEY ("filiereId") REFERENCES filieres(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3.2 typeClasse (enum personnalisé via varchar)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS "typeClasse" VARCHAR(20) NOT NULL DEFAULT 'NORMALE';

-- Ajouter une contrainte CHECK pour valider les valeurs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'CK_classes_typeClasse'
    ) THEN
        ALTER TABLE classes 
        ADD CONSTRAINT "CK_classes_typeClasse" 
        CHECK ("typeClasse" IN ('NORMALE', 'BILINGUE', 'RENFORCEE', 'INTERNATIONALE'));
    END IF;
END $$;

-- 3.3 creneauHoraire (enum personnalisé via varchar)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS "creneauHoraire" VARCHAR(20) NOT NULL DEFAULT 'MATIN';

-- Ajouter une contrainte CHECK pour valider les valeurs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'CK_classes_creneauHoraire'
    ) THEN
        ALTER TABLE classes 
        ADD CONSTRAINT "CK_classes_creneauHoraire" 
        CHECK ("creneauHoraire" IN ('MATIN', 'APRES_MIDI', 'JOURNEE_COMPLETE'));
    END IF;
END $$;

-- 3.4 description (texte libre)
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS "description" TEXT;

-- ==================================
-- 4. CRÉATION INDEX
-- ==================================

-- Index sur filiereId
CREATE INDEX IF NOT EXISTS "IDX_classes_filiereId" 
ON classes("filiereId");

-- Index sur typeClasse
CREATE INDEX IF NOT EXISTS "IDX_classes_typeClasse" 
ON classes("typeClasse");

-- Index composite pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS "IDX_classes_niveau_filiere" 
ON classes("niveauId", "filiereId") 
WHERE "filiereId" IS NOT NULL;

-- ==================================
-- 5. VÉRIFICATION FINALE
-- ==================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Vérifier que les colonnes existent
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_name = 'classes'
    AND column_name IN ('filiereId', 'typeClasse', 'creneauHoraire', 'description');
    
    IF v_count < 4 THEN
        RAISE EXCEPTION 'Migration échouée: toutes les colonnes ne sont pas créées (%/4)', v_count;
    END IF;
    
    -- Vérifier que les cycles ont été renommés
    IF NOT EXISTS (SELECT 1 FROM cycles WHERE code = 'COLLEGE') THEN
        RAISE EXCEPTION 'Migration échouée: cycle COLLEGE non trouvé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM cycles WHERE code = 'LYCEE') THEN
        RAISE EXCEPTION 'Migration échouée: cycle LYCEE non trouvé';
    END IF;
    
    RAISE NOTICE '✅ Migration 055 complétée avec succès';
END $$;

COMMIT;
