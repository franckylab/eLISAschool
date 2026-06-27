-- =====================================================
-- eLISAschool - Migration 090: Correction migration 088 (camelCase)
-- =====================================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Description: Correction des noms de colonnes (camelCase TypeORM)
-- =====================================================

BEGIN;

-- ==========================================
-- 1. VÉRIFIER ET CORRIGER configurations_matieres_classes
-- ==========================================

-- La table existe déjà, vérifier les colonnes
DO $$
DECLARE
    col_name TEXT;
BEGIN
    -- Vérifier si les colonnes existent déjà en camelCase
    SELECT column_name INTO col_name
    FROM information_schema.columns 
    WHERE table_name = 'configurations_matieres_classes' 
    AND column_name = 'matiereId';
    
    IF col_name IS NULL THEN
        -- Les colonnes n'existent pas, la table est vide - on peut la recréer
        RAISE NOTICE '=== Table configurations_matieres_classes vide - suppression et recréation ===';
        DROP TABLE IF EXISTS configurations_matieres_classes CASCADE;
        
        CREATE TABLE configurations_matieres_classes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "matiereId" UUID NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
            "classeId" UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
            "anneeScolaireId" UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
            "etablissementId" UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
            coefficient DECIMAL(5,2) DEFAULT 1.00,
            bareme DECIMAL(5,2) DEFAULT 20.00,
            volume_horaire INTEGER DEFAULT 0,
            priorite INTEGER DEFAULT 0,
            actif BOOLEAN DEFAULT true,
            notes TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );

        -- Index pour configurations_matieres_classes
        CREATE INDEX idx_cfg_mc_matiere ON configurations_matieres_classes("matiereId");
        CREATE INDEX idx_cfg_mc_classe ON configurations_matieres_classes("classeId");
        CREATE INDEX idx_cfg_mc_annee ON configurations_matieres_classes("anneeScolaireId");
        CREATE INDEX idx_cfg_mc_etablissement ON configurations_matieres_classes("etablissementId");
        CREATE UNIQUE INDEX idx_cfg_mc_unique ON configurations_matieres_classes("matiereId", "classeId", "anneeScolaireId", "etablissementId");
    ELSE
        RAISE NOTICE '=== Table configurations_matieres_classes existe déjà avec colonnes camelCase ===';
    END IF;
END $$;

-- ==========================================
-- 2. VÉRIFIER ET CORRIGER classes_annees
-- ==========================================

DO $$
DECLARE
    col_name TEXT;
BEGIN
    SELECT column_name INTO col_name
    FROM information_schema.columns 
    WHERE table_name = 'classes_annees' 
    AND column_name = 'classeId';
    
    IF col_name IS NULL THEN
        RAISE NOTICE '=== Table classes_annees vide - suppression et recréation ===';
        DROP TABLE IF EXISTS classes_annees CASCADE;
        
        CREATE TABLE classes_annees (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            "classeId" UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
            "anneeScolaireId" UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
            "etablissementId" UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
            "professeurPrincipalId" UUID REFERENCES membres_personnel(id),
            effectif_max INTEGER DEFAULT 50,
            effectif_actuel INTEGER DEFAULT 0,
            actif BOOLEAN DEFAULT true,
            statut VARCHAR(30) DEFAULT 'ACTIVE',
            notes TEXT,
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );

        -- Index pour classes_annees
        CREATE INDEX idx_ca_classe ON classes_annees("classeId");
        CREATE INDEX idx_ca_annee ON classes_annees("anneeScolaireId");
        CREATE INDEX idx_ca_etablissement ON classes_annees("etablissementId");
        CREATE UNIQUE INDEX idx_ca_unique ON classes_annees("classeId", "anneeScolaireId");
        CREATE INDEX idx_ca_etablissement_annee ON classes_annees("etablissementId", "anneeScolaireId");
        CREATE INDEX idx_ca_professeur ON classes_annees("professeurPrincipalId");
    ELSE
        RAISE NOTICE '=== Table classes_annees existe déjà avec colonnes camelCase ===';
    END IF;
END $$;

-- ==========================================
-- 3. MIGRER DONNÉES : classes → classes_annees
-- ==========================================

DO $$
DECLARE
    count_inserted INTEGER;
BEGIN
    -- Vérifier s'il y a des données à migrer
    SELECT COUNT(*) INTO count_inserted FROM classes_annees;
    
    IF count_inserted = 0 THEN
        RAISE NOTICE '=== Migration classes → classes_annees (0 → N) ===';
        
        INSERT INTO classes_annees (
            "classeId",
            "anneeScolaireId",
            "etablissementId",
            "professeurPrincipalId",
            effectif_max,
            effectif_actuel,
            actif,
            statut
        )
        SELECT 
            c.id AS "classeId",
            c."anneeScolaireId",
            c."etablissementId",
            c."professeurPrincipalId",
            c.effectif_max,
            c.effectif_actuel,
            c.actif,
            'ACTIVE' AS statut
        FROM classes c
        WHERE c."anneeScolaireId" IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM classes_annees ca
            WHERE ca."classeId" = c.id
        );

        GET DIAGNOSTICS count_inserted = ROW_COUNT;
        RAISE NOTICE '=== classes_annees créées: % ===', count_inserted;
    ELSE
        RAISE NOTICE '=== classes_annees déjà peuplée: % lignes ===', count_inserted;
    END IF;
END $$;

-- ==========================================
-- 4. MIGRER AFFECTATIONS_MATIERES
-- ==========================================

DO $$
DECLARE
    count_updated INTEGER;
BEGIN
    -- Ajouter colonne dateDebut si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'affectations_matieres' 
        AND column_name = 'dateDebut'
    ) THEN
        ALTER TABLE affectations_matieres ADD COLUMN "dateDebut" DATE;
        ALTER TABLE affectations_matieres ADD COLUMN "dateFin" DATE;
        ALTER TABLE affectations_matieres ADD COLUMN actif BOOLEAN DEFAULT true;
        
        UPDATE affectations_matieres 
        SET "dateDebut" = "createdAt"::DATE;
        
        GET DIAGNOSTICS count_updated = ROW_COUNT;
        RAISE NOTICE '=== affectations_matieres avec dateDebut: % ===', count_updated;
    ELSE
        RAISE NOTICE '=== affectations_matieres déjà migrées ===';
    END IF;
END $$;

-- ==========================================
-- 5. CRÉER TABLE configurations_scoring
-- ==========================================

CREATE TABLE IF NOT EXISTS configurations_scoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    "anneeScolaireId" UUID REFERENCES annees_scolaires(id),
    "methodeCalcul" VARCHAR(30) DEFAULT 'MOYENNE_PONDEREE',
    "systemeNotation" VARCHAR(20) DEFAULT 'SUR_20',
    "noteMinimale" DECIMAL(5,2) DEFAULT 0,
    "noteMaximale" DECIMAL(5,2) DEFAULT 20,
    "notePassage" DECIMAL(5,2) DEFAULT 10,
    "mentions" JSONB DEFAULT '[{"mention":"Très Bien","noteMin":16},{"mention":"Bien","noteMin":14},{"mention":"Assez Bien","noteMin":12},{"mention":"Passable","noteMin":10}]'::JSONB,
    "coefficientsParDefaut" JSONB,
    "ponderationComposition" JSONB,
    actif BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cfg_scoring_unique ON configurations_scoring("etablissementId", "anneeScolaireId") WHERE "anneeScolaireId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cfg_scoring_etablissement ON configurations_scoring("etablissementId");

-- ==========================================
-- 6. SEED CONFIGURATIONS SCORING PAR DÉFAUT
-- ==========================================

INSERT INTO configurations_scoring (
    "etablissementId",
    "anneeScolaireId",
    "methodeCalcul",
    "systemeNotation",
    "noteMinimale",
    "noteMaximale",
    "notePassage",
    actif
)
SELECT DISTINCT 
    e.id,
    NULL,
    'MOYENNE_PONDEREE',
    'SUR_20',
    0,
    20,
    10,
    true
FROM etablissements e
ON CONFLICT DO NOTHING;

DO $$
DECLARE
    count_scoring INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_scoring FROM configurations_scoring;
    RAISE NOTICE '=== configurations_scoring créées: % ===', count_scoring;
END $$;

-- ==========================================
-- 7. PERMISSION RBAC
-- ==========================================

INSERT INTO permissions (code, libelle, module, description, est_systeme)
VALUES ('notes:modifier_apres_cloture', 'Modifier les notes après clôture', 'notes', 
        'Permet de modifier les notes même après la clôture de la période', true)
ON CONFLICT (code) DO NOTHING;

RAISE NOTICE '=== Migration 090 terminée avec succès ===';

COMMIT;
