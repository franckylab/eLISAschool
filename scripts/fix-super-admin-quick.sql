-- ==================================
-- eLISAschool - Correction Rapide Permissions SUPER_ADMIN
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- EXÉCUTION RAPIDE :
-- 1. Modifiez la variable v_email ci-dessous avec votre email
-- 2. psql -h localhost -U postgres -d elisaschool -f scripts/fix-super-admin-quick.sql
-- ==================================

DO $$
DECLARE
    v_email TEXT := 'super_admin@elisaschool.com';  -- ← MODIFIER ICI
    super_admin_role_id UUID;
    user_id UUID;
    permissions_count INTEGER;
BEGIN
    RAISE NOTICE '==================================';
    RAISE NOTICE 'Correction Permissions SUPER_ADMIN';
    RAISE NOTICE '==================================';
    RAISE NOTICE '';

    -- 1. Vérifier le rôle SUPER_ADMIN
    SELECT id INTO super_admin_role_id 
    FROM roles 
    WHERE code = 'SUPER_ADMIN';
    
    IF super_admin_role_id IS NULL THEN
        RAISE EXCEPTION '❌ Rôle SUPER_ADMIN non trouvé dans la table roles';
    END IF;
    
    RAISE NOTICE '✓ Rôle SUPER_ADMIN trouvé';

    -- 2. Attribuer TOUTES les permissions au rôle SUPER_ADMIN
    INSERT INTO role_permissions ("roleId", "permissionId")
    SELECT super_admin_role_id, p.id
    FROM permissions p
    WHERE p.actif = true
    AND NOT EXISTS (
        SELECT 1 
        FROM role_permissions rp 
        WHERE rp."roleId" = super_admin_role_id AND rp."permissionId" = p.id
    );
    
    GET DIAGNOSTICS permissions_count = ROW_COUNT;
    RAISE NOTICE '✓ Permissions attribuées: % nouvelles permissions', permissions_count;

    -- 3. Compter le total des permissions
    SELECT COUNT(*) INTO permissions_count
    FROM role_permissions rp
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE rp."roleId" = super_admin_role_id AND p.actif = true;
    
    RAISE NOTICE '✓ Total permissions SUPER_ADMIN: %', permissions_count;

    -- 4. Trouver l'utilisateur
    SELECT id INTO user_id 
    FROM utilisateurs 
    WHERE email = v_email;
    
    IF user_id IS NULL THEN
        RAISE WARNING '❌ Utilisateur non trouvé: %', v_email;
        RAISE NOTICE '📋 Utilisateurs SUPER_ADMIN disponibles:';
        FOR user_id IN 
            SELECT u.id FROM utilisateurs u WHERE u.role = 'SUPER_ADMIN' LIMIT 1
        LOOP
            SELECT email INTO v_email FROM utilisateurs WHERE id = user_id;
            RAISE NOTICE '  → %', v_email;
            EXIT;
        END LOOP;
        
        IF user_id IS NULL THEN
            RAISE EXCEPTION 'Aucun utilisateur SUPER_ADMIN trouvé. Veuillez créer un utilisateur d''abord.';
        END IF;
    ELSE
        RAISE NOTICE '✓ Utilisateur trouvé: %', v_email;
    END IF;

    -- 5. Vérifier/créer l'entrée dans utilisateur_roles
    IF NOT EXISTS (
        SELECT 1 
        FROM utilisateur_roles 
        WHERE "utilisateurId" = user_id AND "roleId" = super_admin_role_id
    ) THEN
        INSERT INTO utilisateur_roles ("utilisateurId", "roleId", "estPrincipal", "actif")
        VALUES (user_id, super_admin_role_id, true, true);
        
        RAISE NOTICE '✓ Rôle SUPER_ADMIN attribué à l''utilisateur';
    ELSE
        RAISE NOTICE '✓ L''utilisateur a déjà le rôle SUPER_ADMIN';
    END IF;

    -- 6. Mettre à jour le rôle principal
    UPDATE utilisateurs 
    SET role = 'SUPER_ADMIN'
    WHERE id = user_id AND role != 'SUPER_ADMIN';

    -- 7. Vérification finale
    RAISE NOTICE '';
    RAISE NOTICE '==================================';
    RAISE NOTICE '✅ CORRECTION TERMINÉE';
    RAISE NOTICE '==================================';
    RAISE NOTICE '';
    RAISE NOTICE '📌 IMPORTANT : Vous DEVEZ vous reconnecter !';
    RAISE NOTICE '   1. Déconnectez-vous du frontend';
    RAISE NOTICE '   2. Reconnectez-vous avec: %', v_email;
    RAISE NOTICE '   3. Testez l''accès à /api/eleves';
    RAISE NOTICE '';
END $$;
