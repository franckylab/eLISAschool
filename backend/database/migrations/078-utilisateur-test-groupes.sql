/**
 * ==================================
 * eLISAschool - Migration 078: Utilisateur Test Groupes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-17
 * 
 * Crée un utilisateur de test CHEF_ETABLISSEMENT dédié
 * pour tester le module groupes d'établissements
 */

-- ==================================
-- 1. Créer l'utilisateur de test pour les groupes
-- ==================================

-- Vérifier si l'utilisateur existe déjà
DO $$
DECLARE
    v_user_id UUID;
    v_etablissement_id UUID;
    v_role_id UUID;
BEGIN
    -- Vérifier si l'utilisateur existe
    SELECT id INTO v_user_id FROM utilisateurs WHERE email = 'chef.groupes@elisaschool.cm';
    
    IF v_user_id IS NULL THEN
        -- Récupérer l'ID du premier établissement
        SELECT id INTO v_etablissement_id 
        FROM etablissements 
        ORDER BY "createdAt" ASC 
        LIMIT 1;
        
        -- Récupérer l'ID du rôle CHEF_ETABLISSEMENT
        SELECT id INTO v_role_id 
        FROM roles 
        WHERE code = 'CHEF_ETABLISSEMENT' 
        LIMIT 1;
        
        -- Créer l'utilisateur
        INSERT INTO utilisateurs (
            email, matricule, "motDePasse", role, statut,
            "emailVerifie", langue, "etablissementId",
            "maxEtablissementsPersonnel", "createdAt", "updatedAt"
        )
        VALUES (
            'chef.groupes@elisaschool.cm',
            'CHEF-GROUPES-001',
            'Test123456!',
            'CHEF_ETABLISSEMENT',
            'ACTIF',
            true,
            'fr',
            v_etablissement_id,
            1,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE '✅ Utilisateur créé: chef.groupes@elisaschool.cm (ID: %)', v_user_id;
        
        -- Créer le profil
        INSERT INTO profils_utilisateurs (
            "utilisateurId", nom, prenom, telephone,
            "createdAt", "updatedAt"
        )
        VALUES (
            v_user_id,
            'RESPONSABLE',
            'Groupes',
            '+237690000099',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Profil créé pour l''utilisateur';
        
        -- Créer le lien utilisateur-rôle
        INSERT INTO utilisateur_roles (
            "utilisateurId", "roleId", "estPrincipal",
            "dateAttribution", "createdAt", "updatedAt"
        )
        VALUES (
            v_user_id,
            v_role_id,
            true,
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Rôle CHEF_ETABLISSEMENT attribué';
        
        -- Créer le lien utilisateur-établissement
        INSERT INTO utilisateur_etablissements (
            "utilisateurId", "etablissementId", role,
            "etablissementPrincipal", actif, "dateDebut",
            "createdAt", "updatedAt"
        )
        VALUES (
            v_user_id,
            v_etablissement_id,
            'CHEF_ETABLISSEMENT',
            true,
            true,
            NOW(),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Établissement lié à l''utilisateur';
        
        -- Vérifier les permissions
        RAISE NOTICE '==========================================';
        RAISE NOTICE 'Utilisateur de test GROUPES créé:';
        RAISE NOTICE '  Email: chef.groupes@elisaschool.cm';
        RAISE NOTICE '  Mot de passe: Test123456!';
        RAISE NOTICE '  Rôle: CHEF_ETABLISSEMENT';
        RAISE NOTICE '  Permissions GROUPES: 6 (view, manage, dashboard, rapports, etc.)';
        RAISE NOTICE '==========================================';
    ELSE
        RAISE NOTICE 'ℹ️  Utilisateur chef.groupes@elisaschool.cm déjà existant, skip...';
    END IF;
END $$;

-- ==================================
-- 2. Vérification finale des permissions GROUPES
-- ==================================

DO $$
DECLARE
    v_total_perms INTEGER;
    v_chef_perms INTEGER;
    v_directeur_perms INTEGER;
    v_admin_perms INTEGER;
BEGIN
    -- Total permissions GROUPES
    SELECT COUNT(*) INTO v_total_perms
    FROM permissions
    WHERE code LIKE 'groupes:%';
    
    -- Permissions CHEF_ETABLISSEMENT
    SELECT COUNT(*) INTO v_chef_perms
    FROM role_permissions rp
    JOIN roles r ON rp."roleId" = r.id
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE r.code = 'CHEF_ETABLISSEMENT'
        AND p.code LIKE 'groupes:%';
    
    -- Permissions DIRECTEUR
    SELECT COUNT(*) INTO v_directeur_perms
    FROM role_permissions rp
    JOIN roles r ON rp."roleId" = r.id
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE r.code = 'DIRECTEUR'
        AND p.code LIKE 'groupes:%';
    
    -- Permissions SUPER_ADMIN (devrait avoir toutes les permissions)
    SELECT COUNT(*) INTO v_admin_perms
    FROM role_permissions rp
    JOIN roles r ON rp."roleId" = r.id
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE r.code = 'SUPER_ADMIN'
        AND p.code LIKE 'groupes:%';
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Résumé des permissions GROUPES:';
    RAISE NOTICE '  Total permissions GROUPES: %', v_total_perms;
    RAISE NOTICE '  SUPER_ADMIN: % permissions', v_admin_perms;
    RAISE NOTICE '  CHEF_ETABLISSEMENT: % permissions', v_chef_perms;
    RAISE NOTICE '  DIRECTEUR: % permissions', v_directeur_perms;
    RAISE NOTICE '==========================================';
END $$;
