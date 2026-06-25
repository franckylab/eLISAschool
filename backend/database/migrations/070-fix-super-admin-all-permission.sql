-- ==================================
-- eLISAschool - Correction Permissions SUPER_ADMIN
-- ==================================
-- Version: 1.0.0
-- Date: 21 juin 2026
-- Auteur: franck arlos chendjou
--
-- Corrige 2 problèmes critiques :
-- 1. Permission 'super_admin:all' manquante dans le enum
-- 2. Rôle SUPER_ADMIN non lié aux utilisateurs via utilisateur_etablissements
-- ==================================

-- ==========================================
-- CORRECTION 1 : Ajouter la permission super_admin:all
-- ==========================================

-- Vérifier si la permission existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM permissions WHERE code = 'super_admin:all'
    ) THEN
        INSERT INTO permissions (id, code, libelle, description, actif, "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            'super_admin:all',
            'Super Admin - Accès Total',
            'Permission spéciale pour le SUPER_ADMIN avec accès à toutes les fonctionnalités',
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Permission super_admin:all créée';
    ELSE
        RAISE NOTICE '⏭ Permission super_admin:all déjà existante';
    END IF;
END $$;

-- ==========================================
-- CORRECTION 2 : Assigner super_admin:all au rôle SUPER_ADMIN
-- ==========================================

DO $$
DECLARE
    super_admin_role_id UUID;
    super_admin_all_perm_id UUID;
BEGIN
    -- Récupérer l'ID du rôle SUPER_ADMIN
    SELECT id INTO super_admin_role_id FROM roles WHERE code = 'SUPER_ADMIN';
    
    -- Récupérer l'ID de la permission super_admin:all
    SELECT id INTO super_admin_all_perm_id FROM permissions WHERE code = 'super_admin:all';
    
    -- Vérifier si l'assignation existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM role_permissions 
        WHERE "roleId" = super_admin_role_id 
        AND "permissionId" = super_admin_all_perm_id
    ) THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        VALUES (super_admin_role_id, super_admin_all_perm_id);
        
        RAISE NOTICE '✅ Permission super_admin:all assignée au rôle SUPER_ADMIN';
    ELSE
        RAISE NOTICE '⏭ Permission super_admin:all déjà assignée au SUPER_ADMIN';
    END IF;
END $$;

-- ==========================================
-- CORRECTION 3 : Vérifier les liaisons SUPER_ADMIN dans utilisateur_etablissements
-- ==========================================

DO $$
DECLARE
    super_admin_role_id UUID;
    utilisateur_record RECORD;
    liaison_count INTEGER := 0;
BEGIN
    -- Récupérer l'ID du rôle SUPER_ADMIN
    SELECT id INTO super_admin_role_id FROM roles WHERE code = 'SUPER_ADMIN';
    
    -- Trouver tous les utilisateurs avec role='SUPER_ADMIN' mais sans liaison
    FOR utilisateur_record IN
        SELECT u.id, u.email
        FROM utilisateurs u
        WHERE u.role = 'SUPER_ADMIN'
        AND NOT EXISTS (
            SELECT 1 
            FROM utilisateur_etablissements ue 
            WHERE ue."utilisateurId" = u.id 
            AND ue."roleId" = super_admin_role_id
        )
    LOOP
        -- Pour chaque utilisateur sans liaison, créer une liaison avec le 1er établissement
        DECLARE
            premier_etab_id UUID;
        BEGIN
            -- Récupérer le premier établissement
            SELECT id INTO premier_etab_id 
            FROM etablissements 
            ORDER BY "createdAt" ASC 
            LIMIT 1;
            
            IF premier_etab_id IS NOT NULL THEN
                -- Créer la liaison
                INSERT INTO utilisateur_etablissements (
                    id, 
                    "utilisateurId", 
                    "etablissementId", 
                    "roleId", 
                    actif, 
                    "etablissementPrincipal", 
                    "dateDebut", 
                    "creeAt"
                ) VALUES (
                    gen_random_uuid(),
                    utilisateur_record.id,
                    premier_etab_id,
                    super_admin_role_id,
                    true,
                    true,
                    NOW(),
                    NOW()
                );
                
                liaison_count := liaison_count + 1;
                RAISE NOTICE '✅ Liaison créée pour % (%)', utilisateur_record.email, utilisateur_record.id;
            END IF;
        END;
    END LOOP;
    
    IF liaison_count = 0 THEN
        RAISE NOTICE '✅ Toutes les liaisons SUPER_ADMIN sont correctes';
    ELSE
        RAISE NOTICE '✅ % liaison(s) SUPER_ADMIN créée(s)', liaison_count;
    END IF;
END $$;

-- ==========================================
-- VÉRIFICATION FINALE
-- ==========================================

DO $$
DECLARE
    nb_permissions_super_admin INTEGER;
    nb_liaisons_super_admin INTEGER;
    nb_users_sans_role INTEGER;
BEGIN
    -- Vérifier permissions SUPER_ADMIN
    SELECT COUNT(rp."permissionId") INTO nb_permissions_super_admin
    FROM roles r
    JOIN role_permissions rp ON rp."roleId" = r.id
    WHERE r.code = 'SUPER_ADMIN';
    
    -- Vérifier liaisons
    SELECT COUNT(*) INTO nb_liaisons_super_admin
    FROM utilisateur_etablissements ue
    JOIN roles r ON r.id = ue."roleId"
    WHERE r.code = 'SUPER_ADMIN';
    
    -- Vérifier users sans rôle
    SELECT COUNT(*) INTO nb_users_sans_role
    FROM utilisateurs u
    WHERE u.role = 'SUPER_ADMIN'
    AND NOT EXISTS (
        SELECT 1 
        FROM utilisateur_etablissements ue 
        WHERE ue."utilisateurId" = u.id
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 VÉRIFICATION FINALE:';
    RAISE NOTICE '   Permissions SUPER_ADMIN: %', nb_permissions_super_admin;
    RAISE NOTICE '   Liaisons SUPER_ADMIN: %', nb_liaisons_super_admin;
    RAISE NOTICE '   Users SUPER_ADMIN sans rôle: %', nb_users_sans_role;
    
    IF nb_users_sans_role = 0 THEN
        RAISE NOTICE '✅ CORRECTION TERMINÉE AVEC SUCCÈS';
    ELSE
        RAISE WARNING '⚠ % utilisateur(s) SUPER_ADMIN sans liaison', nb_users_sans_role;
    END IF;
END $$;
