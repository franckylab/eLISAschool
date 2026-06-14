-- ==================================
-- eLISAschool - Migration Multi-Tenant Structure Académique
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-13
--
-- Objectif: Ajouter etablissementId aux entités pédagogiques
-- pour support multi-tenant complet
--
-- Entités modifiées:
-- - filieres (etablissementId)
-- - specialites (etablissementId)
-- - competences (etablissementId)
--
-- Entités GLOBALES (pas de changement):
-- - cycles (référentiel national)
-- - niveaux (référentiel national)
-- - examens_nationaux (examens officiels)

-- ==================================
-- 1. FILIÈRES - Ajout etablissementId
-- ==================================

-- Ajouter la colonne
ALTER TABLE filieres 
ADD COLUMN IF NOT EXISTS "etablissementId" UUID;

-- Lier à l'établissement par défaut (si données existantes)
-- Récupérer l'ID de l'établissement par défaut
DO $$
DECLARE
    default_etab_id UUID;
BEGIN
    SELECT id INTO default_etab_id 
    FROM etablissements 
    WHERE "codeEtablissement" = 'ETAB-001' 
    LIMIT 1;
    
    IF default_etab_id IS NOT NULL THEN
        -- Mettre à jour les filières existantes
        UPDATE filieres 
        SET "etablissementId" = default_etab_id 
        WHERE "etablissementId" IS NULL;
        
        RAISE NOTICE '✓ Filières liées à l''établissement par défaut: %', default_etab_id;
    ELSE
        RAISE WARNING '⚠ Aucun établissement par défaut trouvé (ETAB-001)';
    END IF;
END $$;

-- Rendre la colonne NOT NULL après avoir défini les valeurs
ALTER TABLE filieres 
ALTER COLUMN "etablissementId" SET NOT NULL;

-- Ajouter la contrainte de clé étrangère
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_filieres_etablissement'
    ) THEN
        ALTER TABLE filieres
        ADD CONSTRAINT fk_filieres_etablissement
        FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Créer les index pour performance multi-tenant
CREATE INDEX IF NOT EXISTS idx_filieres_etablissement ON filieres("etablissementId");
CREATE INDEX IF NOT EXISTS idx_filieres_cycle_etablissement ON filieres("cycleId", "etablissementId");

-- Supprimer l'ancien index unique sur code (maintenant unique par établissement)
-- Note: On garde l'unicité globale pour éviter les doublons
-- Si besoin de codes par établissement, supprimer cette ligne:
-- DROP INDEX IF EXISTS idx_filieres_code_unique;

-- ==================================
-- 2. SPÉCIALITÉS - Ajout etablissementId
-- ==================================

ALTER TABLE specialites 
ADD COLUMN IF NOT EXISTS "etablissementId" UUID;

DO $$
DECLARE
    default_etab_id UUID;
BEGIN
    SELECT id INTO default_etab_id 
    FROM etablissements 
    WHERE "codeEtablissement" = 'ETAB-001' 
    LIMIT 1;
    
    IF default_etab_id IS NOT NULL THEN
        UPDATE specialites 
        SET "etablissementId" = default_etab_id 
        WHERE "etablissementId" IS NULL;
        
        RAISE NOTICE '✓ Spécialités liées à l''établissement par défaut: %', default_etab_id;
    END IF;
END $$;

ALTER TABLE specialites 
ALTER COLUMN "etablissementId" SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_specialites_etablissement'
    ) THEN
        ALTER TABLE specialites
        ADD CONSTRAINT fk_specialites_etablissement
        FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_specialites_etablissement ON specialites("etablissementId");
CREATE INDEX IF NOT EXISTS idx_specialites_filiere_etablissement ON specialites("filiereId", "etablissementId");

-- ==================================
-- 3. COMPÉTENCES - Ajout etablissementId
-- ==================================

ALTER TABLE competences 
ADD COLUMN IF NOT EXISTS "etablissementId" UUID;

-- Supprimer l'ancien index unique sur code
DROP INDEX IF EXISTS competences_code_key;

DO $$
DECLARE
    default_etab_id UUID;
BEGIN
    SELECT id INTO default_etab_id 
    FROM etablissements 
    WHERE "codeEtablissement" = 'ETAB-001' 
    LIMIT 1;
    
    IF default_etab_id IS NOT NULL THEN
        UPDATE competences 
        SET "etablissementId" = default_etab_id 
        WHERE "etablissementId" IS NULL;
        
        RAISE NOTICE '✓ Compétences liées à l''établissement par défaut: %', default_etab_id;
    END IF;
END $$;

ALTER TABLE competences 
ALTER COLUMN "etablissementId" SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_competences_etablissement'
    ) THEN
        ALTER TABLE competences
        ADD CONSTRAINT fk_competences_etablissement
        FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_competences_etablissement ON competences("etablissementId");
CREATE INDEX IF NOT EXISTS idx_competences_niveau_matiere_etablissement 
ON competences("niveauId", "matiereId", "etablissementId");

-- Ajouter unicité du code PAR établissement (plus global)
ALTER TABLE competences
ADD CONSTRAINT uq_competences_code_etablissement 
UNIQUE (code, "etablissementId");

-- ==================================
-- 4. VÉRIFICATION
-- ==================================

DO $$
DECLARE
    filieres_count INTEGER;
    specialites_count INTEGER;
    competences_count INTEGER;
    sans_etab_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO filieres_count FROM filieres;
    SELECT COUNT(*) INTO specialites_count FROM specialites;
    SELECT COUNT(*) INTO competences_count FROM competences;
    
    SELECT COUNT(*) INTO sans_etab_count 
    FROM (
        SELECT 1 FROM filieres WHERE "etablissementId" IS NULL
        UNION ALL
        SELECT 1 FROM specialites WHERE "etablissementId" IS NULL
        UNION ALL
        SELECT 1 FROM competences WHERE "etablissementId" IS NULL
    ) sub;
    
    IF sans_etab_count > 0 THEN
        RAISE WARNING '⚠ Il reste % enregistrements sans etablissementId!', sans_etab_count;
    ELSE
        RAISE NOTICE '✓ Migration multi-tenant complétée avec succès';
        RAISE NOTICE '  - Filières: %', filieres_count;
        RAISE NOTICE '  - Spécialités: %', specialites_count;
        RAISE NOTICE '  - Compétences: %', competences_count;
    END IF;
END $$;

-- ==================================
-- 5. COMMENTAIRES
-- ==================================

COMMENT ON COLUMN filieres."etablissementId" IS 'Établissement propriétaire de la filière (multi-tenant)';
COMMENT ON COLUMN specialites."etablissementId" IS 'Établissement propriétaire de la spécialité (multi-tenant)';
COMMENT ON COLUMN competences."etablissementId" IS 'Établissement propriétaire de la compétence (multi-tenant)';
