-- ==================================
-- eLISAschool - Migration: Correction Permissions SUPER_ADMIN
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-21
-- 
-- PROBLÈME :
-- Le SUPER_ADMIN n'a que 79 permissions au lieu de ~487 (toutes les permissions)
-- 
-- CAUSE :
-- Le seed RBAC utilisait `role.permissions = permissionEntities` qui ÉCRASE
-- les relations existantes au lieu de les compléter. Les permissions ajoutées
-- par les migrations ultérieures étaient perdues.
--
-- SOLUTION :
-- Ajouter TOUTES les permissions actives au rôle SUPER_ADMIN
-- ==================================

BEGIN;

-- ÉTAPE 1 : Vérifier le nombre actuel de permissions
DO $$
DECLARE
    current_count INTEGER;
    total_permissions INTEGER;
    added_count INTEGER;
    super_admin_role_id UUID;
BEGIN
    -- Trouver le rôle SUPER_ADMIN
    SELECT id INTO super_admin_role_id 
    FROM roles 
    WHERE code = 'SUPER_ADMIN';
    
    IF super_admin_role_id IS NULL THEN
        RAISE EXCEPTION '❌ Rôle SUPER_ADMIN non trouvé dans la table roles';
    END IF;
    
    -- Compter les permissions actuelles
    SELECT COUNT(*) INTO current_count
    FROM role_permissions rp
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE rp."roleId" = super_admin_role_id AND p.actif = true;
    
    -- Compter le total des permissions actives
    SELECT COUNT(*) INTO total_permissions
    FROM permissions 
    WHERE actif = true;
    
    RAISE NOTICE '==================================';
    RAISE NOTICE 'Correction Permissions SUPER_ADMIN';
    RAISE NOTICE '==================================';
    RAISE NOTICE 'Permissions actuelles du SUPER_ADMIN: %', current_count;
    RAISE NOTICE 'Total permissions actives en base: %', total_permissions;
    RAISE NOTICE '';

    -- ÉTAPE 2 : Ajouter les permissions manquantes
    INSERT INTO role_permissions ("roleId", "permissionId")
    SELECT super_admin_role_id, p.id
    FROM permissions p
    WHERE p.actif = true
    AND NOT EXISTS (
        SELECT 1 
        FROM role_permissions rp 
        WHERE rp."roleId" = super_admin_role_id 
        AND rp."permissionId" = p.id
    );
    
    GET DIAGNOSTICS added_count = ROW_COUNT;
    
    RAISE NOTICE '✅ Permissions ajoutées: %', added_count;

    -- ÉTAPE 3 : Vérification finale
    SELECT COUNT(*) INTO current_count
    FROM role_permissions rp
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE rp."roleId" = super_admin_role_id AND p.actif = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '==================================';
    RAISE NOTICE 'RÉSULTAT FINAL';
    RAISE NOTICE '==================================';
    RAISE NOTICE 'Permissions totales du SUPER_ADMIN: %', current_count;
    RAISE NOTICE 'Total permissions actives en base: %', total_permissions;
    
    IF current_count = total_permissions THEN
        RAISE NOTICE '✅ SUCCÈS : Le SUPER_ADMIN a maintenant TOUTES les permissions !';
    ELSE
        RAISE WARNING '⚠️ ATTENTION : Il manque encore % permissions', total_permissions - current_count;
    END IF;
    
END $$;

COMMIT;

-- ==================================
-- VÉRIFICATION (à exécuter après la migration)
-- ==================================

-- Afficher les 10 premières permissions du SUPER_ADMIN
SELECT 
    r.code as role,
    p.code as permission,
    p.module,
    p.action
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.code = 'SUPER_ADMIN' AND p.actif = true
ORDER BY p.module, p.action
LIMIT 10;

-- Compter par module
SELECT 
    p.module,
    COUNT(*) as nb_permissions
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.code = 'SUPER_ADMIN' AND p.actif = true
GROUP BY p.module
ORDER BY nb_permissions DESC;

-- ==================================
-- FIN DE LA MIGRATION
-- ==================================
