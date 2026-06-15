-- =====================================================
-- eLISAschool - Migration Multi-Tenant V3.0
-- =====================================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2025-06-14
--
-- Ajout du champ maxEtablissementsPersonnel pour contrôler
-- le nombre maximum d'établissements auxquels un utilisateur peut appartenir
-- =====================================================

-- 1. Ajouter la colonne maxEtablissementsPersonnel
ALTER TABLE utilisateurs 
ADD COLUMN IF NOT EXISTS maxEtablissementsPersonnel INT DEFAULT 1;

-- 2. Mettre à jour les SUPER_ADMIN pour avoir accès illimité
UPDATE utilisateurs 
SET maxEtablissementsPersonnel = 0 
WHERE role = 'SUPER_ADMIN';

-- 3. Ajouter un commentaire sur la colonne
COMMENT ON COLUMN utilisateurs.maxEtablissementsPersonnel IS 
'Nombre maximum d''établissements actifs. 0 = illimité (généralement pour super_admin)';

-- 4. Index pour optimiser les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_utilisateurs_max_etablissements 
ON utilisateurs(maxEtablissementsPersonnel);

-- 5. Vérification
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count 
    FROM information_schema.columns 
    WHERE table_name = 'utilisateurs' 
    AND column_name = 'maxEtablissementsPersonnel';
    
    IF v_count = 1 THEN
        RAISE NOTICE '✓ Colonne maxEtablissementsPersonnel ajoutée avec succès';
    ELSE
        RAISE EXCEPTION '✗ Échec de l''ajout de la colonne maxEtablissementsPersonnel';
    END IF;
END $$;
