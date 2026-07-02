-- ==================================
-- eLISAschool - Migration 101: Normalisation année scolaire
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-30
-- 
-- Objectifs:
-- 1. Supprimer la colonne cloturee (boolean) redondante avec statut
-- 2. Ajouter les permissions clôture/réouverture
-- 3. Ajouter les paramètres de configuration
-- ==================================

BEGIN;

-- ==================================
-- ÉTAPE 1: Synchroniser statut avec cloturee (si colonne existe encore)
-- ==================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'annees_scolaires' AND column_name = 'cloturee'
    ) THEN
        UPDATE annees_scolaires
        SET statut = 'CLOTUREE'
        WHERE cloturee = true AND statut != 'CLOTUREE';

        UPDATE annees_scolaires
        SET statut = 'OUVERTE'
        WHERE cloturee = false AND (statut IS NULL OR statut = '');
        
        RAISE NOTICE '✓ Statut synchronisé avec cloturee';
    ELSE
        RAISE NOTICE '✓ Colonne cloturee déjà absente - synchronisation ignorée';
    END IF;
END $$;

-- ==================================
-- ÉTAPE 2: Supprimer la colonne cloturee
-- ==================================
ALTER TABLE annees_scolaires
DROP COLUMN IF EXISTS cloturee;

-- ==================================
-- ÉTAPE 3: Permissions clôture et réouverture
-- ==================================
INSERT INTO permissions (code, libelle, module, action, description)
VALUES
    ('annees-scolaires:cloturer', 'Clôturer année scolaire', 'annees-scolaires', 'cloturer', 'Permet de clôturer une année scolaire'),
    ('annees-scolaires:reouvrir', 'Réouvrir année scolaire', 'annees-scolaires', 'reouvrir', 'Permet de réouvrir une année scolaire clôturée')
ON CONFLICT (code) DO NOTHING;

-- Attribuer les permissions aux rôles ADMIN et SUPER_ADMIN
DO $$
DECLARE
    perm_cloturer UUID;
    perm_reouvrir UUID;
    role_admin UUID;
    role_super UUID;
    role_chef UUID;
BEGIN
    SELECT id INTO perm_cloturer FROM permissions WHERE code = 'annees-scolaires:cloturer';
    SELECT id INTO perm_reouvrir FROM permissions WHERE code = 'annees-scolaires:reouvrir';
    SELECT id INTO role_admin FROM roles WHERE code = 'ADMIN';
    SELECT id INTO role_super FROM roles WHERE code = 'SUPER_ADMIN';
    SELECT id INTO role_chef FROM roles WHERE code = 'CHEF_ETABLISSEMENT';

    -- ADMIN : cloturer + réouvrir
    IF perm_cloturer IS NOT NULL AND role_admin IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        VALUES (role_admin, perm_cloturer)
        ON CONFLICT DO NOTHING;
    END IF;

    IF perm_reouvrir IS NOT NULL AND role_admin IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        VALUES (role_admin, perm_reouvrir)
        ON CONFLICT DO NOTHING;
    END IF;

    -- SUPER_ADMIN : cloturer + réouvrir
    IF perm_cloturer IS NOT NULL AND role_super IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        VALUES (role_super, perm_cloturer)
        ON CONFLICT DO NOTHING;
    END IF;

    IF perm_reouvrir IS NOT NULL AND role_super IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        VALUES (role_super, perm_reouvrir)
        ON CONFLICT DO NOTHING;
    END IF;

    -- CHEF_ETABLISSEMENT : cloturer uniquement (demande, pas réouverture)
    IF perm_cloturer IS NOT NULL AND role_chef IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        VALUES (role_chef, perm_cloturer)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ==================================
-- ÉTAPE 4: Paramètres de configuration clôture
-- ==================================
DO $$
BEGIN
    -- Vérifier et insérer chaque paramètre (unique sur cle + etablissementId NULL)
    IF NOT EXISTS (SELECT 1 FROM parametres_systeme WHERE cle = 'annees_scolaires.cloture_check_periodes' AND "etablissementId" IS NULL) THEN
        INSERT INTO parametres_systeme (cle, valeur, "typeValeur", categorie, module, description, "modifiableRuntime", visible, ordre)
        VALUES ('annees_scolaires.cloture_check_periodes', 'true', 'BOOLEAN', 'MODULE', 'annees-scolaires',
                'Vérifier que toutes les périodes sont fermées avant la clôture', true, true, 10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM parametres_systeme WHERE cle = 'annees_scolaires.cloture_check_notes' AND "etablissementId" IS NULL) THEN
        INSERT INTO parametres_systeme (cle, valeur, "typeValeur", categorie, module, description, "modifiableRuntime", visible, ordre)
        VALUES ('annees_scolaires.cloture_check_notes', 'false', 'BOOLEAN', 'MODULE', 'annees-scolaires',
                'Vérifier que toutes les notes sont saisies avant la clôture', true, true, 11);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM parametres_systeme WHERE cle = 'annees_scolaires.cloture_check_bulletins' AND "etablissementId" IS NULL) THEN
        INSERT INTO parametres_systeme (cle, valeur, "typeValeur", categorie, module, description, "modifiableRuntime", visible, ordre)
        VALUES ('annees_scolaires.cloture_check_bulletins', 'false', 'BOOLEAN', 'MODULE', 'annees-scolaires',
                'Vérifier que tous les bulletins sont générés avant la clôture', true, true, 12);
    END IF;
END $$;

-- ==================================
-- ÉTAPE 5: Vérification finale
-- ==================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'annees_scolaires' 
        AND column_name = 'cloturee'
    ) THEN
        RAISE EXCEPTION 'Migration échouée: la colonne cloturee existe encore';
    ELSE
        RAISE NOTICE '✓ Colonne cloturee supprimée - utilisez annee.statut === CLOTUREE';
        RAISE NOTICE '✓ Permissions cloturer/réouvrir ajoutées';
        RAISE NOTICE '✓ Paramètres de configuration clôture ajoutés';
    END IF;
END $$;

COMMIT;
