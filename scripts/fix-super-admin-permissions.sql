-- ==================================
-- eLISAschool - Vérification et correction des permissions SUPER_ADMIN
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- 
-- Ce script vérifie et corrige les permissions du super_admin
-- ==================================

-- ==================================
-- ÉTAPE 1 : Diagnostic
-- ==================================

-- 1.1 Vérifier si le rôle SUPER_ADMIN existe
SELECT 'Vérification rôle SUPER_ADMIN' AS etape;
SELECT id, code, libelle, actif 
FROM roles 
WHERE code = 'SUPER_ADMIN';

-- 1.2 Vérifier les permissions du rôle SUPER_ADMIN
SELECT 'Permissions du rôle SUPER_ADMIN' AS etape;
SELECT COUNT(*) as nombre_permissions
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.code = 'SUPER_ADMIN';

-- 1.3 Vérifier les utilisateurs avec le rôle SUPER_ADMIN
SELECT 'Utilisateurs avec rôle SUPER_ADMIN' AS etape;
SELECT u.id, u.email, u.role, ur."roleId", r.code as role_code
FROM utilisateurs u
LEFT JOIN utilisateur_roles ur ON u.id = ur."utilisateurId"
LEFT JOIN roles r ON ur."roleId" = r.id
WHERE u.role = 'SUPER_ADMIN' OR r.code = 'SUPER_ADMIN';

-- 1.4 Vérifier les permissions effectives d'un utilisateur spécifique
-- REMPLACER 'USER_ID' par l'ID réel de l'utilisateur super_admin
SELECT 'Permissions effectives de l''utilisateur' AS etape;
SELECT DISTINCT p.code as permission_code
FROM utilisateurs u
JOIN utilisateur_roles ur ON u.id = ur."utilisateurId"
JOIN role_permissions rp ON ur."roleId" = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE u.email = 'super_admin@elisaschool.com'  -- ← MODIFIER ICI
  AND p.actif = true;

-- ==================================
-- ÉTAPE 2 : Corrections
-- ==================================

-- 2.1 Attribuer TOUTES les permissions au rôle SUPER_ADMIN (si pas déjà fait)
SELECT 'Attribution de toutes les permissions au rôle SUPER_ADMIN' AS etape;
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
  AND p.actif = true
  AND NOT EXISTS (
    SELECT 1 
    FROM role_permissions rp 
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  );

-- 2.2 Vérifier que l'utilisateur super_admin a bien le rôle SUPER_ADMIN dans utilisateur_roles
-- Si l'utilisateur n'a pas d'entrée dans utilisateur_roles, on la crée
SELECT 'Vérification/création du rôle utilisateur' AS etape;

-- D'abord, trouvons l'ID du rôle SUPER_ADMIN et de l'utilisateur
DO $$
DECLARE
    super_admin_role_id UUID;
    user_id UUID;
    user_email TEXT := 'super_admin@elisaschool.com';  -- ← MODIFIER ICI avec l'email réel
BEGIN
    -- Récupérer l'ID du rôle SUPER_ADMIN
    SELECT id INTO super_admin_role_id 
    FROM roles 
    WHERE code = 'SUPER_ADMIN';
    
    -- Récupérer l'ID de l'utilisateur
    SELECT id INTO user_id 
    FROM utilisateurs 
    WHERE email = user_email;
    
    -- Si l'utilisateur existe
    IF user_id IS NOT NULL THEN
        -- Vérifier si l'utilisateur a déjà ce rôle
        IF NOT EXISTS (
            SELECT 1 
            FROM utilisateur_roles 
            WHERE "utilisateurId" = user_id AND "roleId" = super_admin_role_id
        ) THEN
            -- Créer l'attribution de rôle
            INSERT INTO utilisateur_roles ("utilisateurId", "roleId", "estPrincipal", "actif")
            VALUES (user_id, super_admin_role_id, true, true)
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Rôle SUPER_ADMIN attribué à l''utilisateur %', user_email;
        ELSE
            RAISE NOTICE 'L''utilisateur % a déjà le rôle SUPER_ADMIN', user_email;
        END IF;
        
        -- Mettre à jour le rôle principal si nécessaire
        UPDATE utilisateurs 
        SET role = 'SUPER_ADMIN'
        WHERE id = user_id AND role != 'SUPER_ADMIN';
    ELSE
        RAISE NOTICE 'Utilisateur % non trouvé', user_email;
    END IF;
END $$;

-- ==================================
-- ÉTAPE 3 : Vérification finale
-- ==================================

-- 3.1 Compter les permissions totales du système
SELECT 'Total permissions dans le système' AS etape;
SELECT COUNT(*) as total_permissions 
FROM permissions 
WHERE actif = true;

-- 3.2 Compter les permissions du rôle SUPER_ADMIN
SELECT 'Permissions du rôle SUPER_ADMIN après correction' AS etape;
SELECT COUNT(*) as permissions_super_admin
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.code = 'SUPER_ADMIN'
  AND p.actif = true;

-- 3.3 Vérifier les rôles de l'utilisateur
SELECT 'Rôles de l''utilisateur super_admin' AS etape;
SELECT u.email, r.code as role, ur."estPrincipal", ur."actif"
FROM utilisateurs u
JOIN utilisateur_roles ur ON u.id = ur."utilisateurId"
JOIN roles r ON ur."roleId" = r.id
WHERE u.email = 'super_admin@elisaschool.com';  -- ← MODIFIER ICI

-- ==================================
-- FIN DU SCRIPT
-- ==================================
