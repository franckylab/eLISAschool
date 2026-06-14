-- =====================================================
-- eLISAschool - Migration 059: Multi-Tenant Matiere
-- =====================================================
-- Objectif: Ajouter le support multi-tenant à l'entité Matiere
-- Date: 2026-06-13
-- Auteur: franck arlos chendjou
-- =====================================================

-- 1. Ajouter la colonne etablissementId
ALTER TABLE matieres 
ADD COLUMN IF NOT EXISTS "etablissementId" UUID;

-- 2. Lier toutes les matières existantes à l'établissement par défaut
-- (Celles qui n'ont pas encore d'établissement)
UPDATE matieres 
SET "etablissementId" = (
    SELECT id FROM etablissements 
    WHERE "codeEtablissement" = 'ETAB-001' 
    LIMIT 1
)
WHERE "etablissementId" IS NULL;

-- 3. Vérifier qu'aucune matière n'a un etablissementId NULL
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM matieres WHERE "etablissementId" IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Il reste % matières sans etablissementId. Migration annulée.', null_count;
    END IF;
END $$;

-- 4. Rendre la colonne NOT NULL
ALTER TABLE matieres 
ALTER COLUMN "etablissementId" SET NOT NULL;

-- 5. Ajouter la contrainte de clé étrangère
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_matieres_etablissement'
    ) THEN
        ALTER TABLE matieres
        ADD CONSTRAINT fk_matieres_etablissement
        FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Supprimer l'ancien index unique sur nom (global)
ALTER TABLE matieres DROP CONSTRAINT IF EXISTS matieres_nom_key;

-- 7. Créer l'unicité par établissement (nom + etablissementId)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uq_matieres_nom_etablissement'
    ) THEN
        ALTER TABLE matieres
        ADD CONSTRAINT uq_matieres_nom_etablissement 
        UNIQUE (nom, "etablissementId");
    END IF;
END $$;

-- 8. Créer les index pour performance multi-tenant
CREATE INDEX IF NOT EXISTS idx_matieres_etablissement ON matieres("etablissementId");
CREATE INDEX IF NOT EXISTS idx_matieres_code_etablissement ON matieres(code, "etablissementId");

-- 9. Vérification finale
DO $$
DECLARE
    total_matieres INTEGER;
    matieres_sans_etablissement INTEGER;
    etablissement_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_matieres FROM matieres;
    SELECT COUNT(*) INTO matieres_sans_etablissement FROM matieres WHERE "etablissementId" IS NULL;
    SELECT COUNT(DISTINCT "etablissementId") INTO etablissement_count FROM matieres;
    
    RAISE NOTICE 'Migration 059 terminée avec succès';
    RAISE NOTICE 'Total matières: %', total_matieres;
    RAISE NOTICE 'Matières sans établissement: %', matieres_sans_etablissement;
    RAISE NOTICE 'Nombre d''établissements avec matières: %', etablissement_count;
    
    IF matieres_sans_etablissement > 0 THEN
        RAISE EXCEPTION 'ERREUR: % matières n''ont pas d''etablissementId', matieres_sans_etablissement;
    END IF;
END $$;

-- =====================================================
-- FIN MIGRATION 059
-- =====================================================
