-- =====================================================
-- eLISAschool - Migration 091: Peuplement données architecture académique v2
-- =====================================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Description: Peupler les tables avec données existantes
-- =====================================================

BEGIN;

-- ==========================================
-- 1. MIGRER classes → classes_annees
-- ==========================================

DO $$
DECLARE
    count_inserted INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_inserted FROM classes_annees;
    
    IF count_inserted = 0 THEN
        RAISE NOTICE '=== Migration classes → classes_annees ===';
        
        INSERT INTO classes_annees (
            "classeId",
            "anneeScolaireId",
            "etablissementId",
            "professeurPrincipalId",
            "effectifMax",
            "effectifActuel",
            actif,
            statut
        )
        SELECT 
            c.id,
            c."anneeScolaireId",
            c."etablissementId",
            c."professeurPrincipalId",
            c."effectifMax",
            c."effectifActuel",
            c.actif,
            'ACTIVE'
        FROM classes c
        WHERE c."anneeScolaireId" IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM classes_annees ca
            WHERE ca."classeId" = c.id
        );

        GET DIAGNOSTICS count_inserted = ROW_COUNT;
        RAISE NOTICE '=== classes_annees créées: % ===', count_inserted;
    ELSE
        RAISE NOTICE '=== classes_annees déjà peuplée: % ===', count_inserted;
    END IF;
END $$;

-- ==========================================
-- 2. MIGRER affectations_eleves → classeAnneeId
-- ==========================================

DO $$
DECLARE
    count_updated INTEGER;
BEGIN
    -- Vérifier si la colonne existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'affectations_eleves' 
        AND column_name = 'classeAnneeId'
    ) THEN
        SELECT COUNT(*) INTO count_updated FROM affectations_eleves WHERE "classeAnneeId" IS NULL;
        
        IF count_updated > 0 THEN
            RAISE NOTICE '=== Migration affectations_eleves → classeAnneeId ===';
            
            UPDATE affectations_eleves ae
            SET "classeAnneeId" = ca.id
            FROM classes_annees ca
            WHERE ae."classeId" = ca."classeId"
            AND ae."classeAnneeId" IS NULL;

            GET DIAGNOSTICS count_updated = ROW_COUNT;
            RAISE NOTICE '=== affectations_eleves migrées: % ===', count_updated;
        ELSE
            RAISE NOTICE '=== affectations_eleves déjà migrées ===';
        END IF;
    ELSE
        RAISE NOTICE '=== colonne classeAnneeId n''existe pas dans affectations_eleves ===';
    END IF;
END $$;

-- ==========================================
-- 3. MIGRER bulletins → classeAnneeId
-- ==========================================

DO $$
DECLARE
    count_updated INTEGER;
BEGIN
    -- Vérifier si la colonne existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bulletins' 
        AND column_name = 'classeAnneeId'
    ) THEN
        SELECT COUNT(*) INTO count_updated FROM bulletins WHERE "classeAnneeId" IS NULL;
        
        IF count_updated > 0 THEN
            RAISE NOTICE '=== Migration bulletins → classeAnneeId ===';
            
            UPDATE bulletins b
            SET "classeAnneeId" = ca.id
            FROM classes_annees ca
            WHERE b."classeId" = ca."classeId"
            AND b."classeAnneeId" IS NULL;

            GET DIAGNOSTICS count_updated = ROW_COUNT;
            RAISE NOTICE '=== bulletins migrés: % ===', count_updated;
        ELSE
            RAISE NOTICE '=== bulletins déjà migrés ===';
        END IF;
    ELSE
        RAISE NOTICE '=== colonne classeAnneeId n''existe pas dans bulletins ===';
    END IF;
END $$;

-- ==========================================
-- 4. PEUPLER configurations_scoring par défaut
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
WHERE NOT EXISTS (
    SELECT 1 FROM configurations_scoring cs
    WHERE cs."etablissementId" = e.id
)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
    count_scoring INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_scoring FROM configurations_scoring;
    RAISE NOTICE '=== configurations_scoring: % ===', count_scoring;
END $$;

-- ==========================================
-- 5. PERMISSION RBAC
-- ==========================================

INSERT INTO permissions (code, libelle, module, description, est_systeme)
VALUES ('notes:modifier_apres_cloture', 'Modifier les notes après clôture', 'notes', 
        'Permet de modifier les notes même après la clôture de la période', true)
ON CONFLICT (code) DO NOTHING;

RAISE NOTICE '=== Migration 091 terminée ===';

COMMIT;
