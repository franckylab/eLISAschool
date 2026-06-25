/**
 * ==================================
 * eLISAschool - Migration 079: Correction Permissions Groupes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * CORRIGE l'incohérence des permissions :
 * - Le controller utilise 'chef:manage' qui n'existe pas
 * - Les permissions réelles sont 'groupes-etablissements:*'
 * - Ajoute un alias 'chef:manage' pour compatibilité
 * - Renforce la logique SUPER_ADMIN
 */

-- ==================================
-- 1. Créer la permission 'chef:manage' manquante
-- ==================================

INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES 
    ('chef:manage', 'Gérer groupes d''établissements', 'Permission unifiée pour la gestion complète des groupes d''établissements (ajout/retrait établissements et admins)', 'groupes-etablissements', 'manage', true)
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 2. Attribuer 'chef:manage' aux rôles appropriés
-- ==================================

-- SUPER_ADMIN : chef:manage (déjà toutes les permissions via LIKE 'groupes-etablissements:%')
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id as "roleId",
    p.id as "permissionId"
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
    AND p.code = 'chef:manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- CHEF_ETABLISSEMENT : chef:manage
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id as "roleId",
    p.id as "permissionId"
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
    AND p.code = 'chef:manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- DIRECTEUR : chef:manage (équivalent fonctionnel)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id as "roleId",
    p.id as "permissionId"
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'DIRECTEUR'
    AND p.code = 'chef:manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ==================================
-- 3. Amélioration : Permissions spécifiques pour admins de groupe
-- ==================================

-- Les admins de groupe (non SUPER_ADMIN/CHEF/DIRECTEUR) peuvent gérer AUSSI
-- s'ils sont explicitement nommés admins du groupe
-- Cette permission sera vérifiée dynamiquement par le middleware requireGroupeAccess

-- ==================================
-- 4. Renforcement SUPER_ADMIN
-- ==================================

-- Vérifier que SUPER_ADMIN a BIEN la permission super_admin:all
-- (Cette permission lui donne accès à TOUTES les ressources sans vérification)
INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES 
    ('super_admin:all', 'Accès total SUPER_ADMIN', 'Permission spéciale accordant un accès illimité à toutes les ressources du système', 'system', 'all', true)
ON CONFLICT (code) DO NOTHING;

-- Ré-attribuer au cas où
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id as "roleId",
    p.id as "permissionId"
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
    AND p.code = 'super_admin:all'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ==================================
-- 5. Vérification et rapport
-- ==================================

DO $$
DECLARE
    v_chef_manage_exists BOOLEAN;
    v_super_admin_count INTEGER;
    v_chef_count INTEGER;
    v_directeur_count INTEGER;
BEGIN
    -- Vérifier si la permission chef:manage existe
    SELECT EXISTS(
        SELECT 1 FROM permissions WHERE code = 'chef:manage'
    ) INTO v_chef_manage_exists;

    -- Compter les attributions par rôle
    SELECT COUNT(*) INTO v_super_admin_count
    FROM role_permissions rp
    JOIN permissions p ON rp."permissionId" = p.id
    JOIN roles r ON rp."roleId" = r.id
    WHERE p.code = 'chef:manage' AND r.code = 'SUPER_ADMIN';

    SELECT COUNT(*) INTO v_chef_count
    FROM role_permissions rp
    JOIN permissions p ON rp."permissionId" = p.id
    JOIN roles r ON rp."roleId" = r.id
    WHERE p.code = 'chef:manage' AND r.code = 'CHEF_ETABLISSEMENT';

    SELECT COUNT(*) INTO v_directeur_count
    FROM role_permissions rp
    JOIN permissions p ON rp."permissionId" = p.id
    JOIN roles r ON rp."roleId" = r.id
    WHERE p.code = 'chef:manage' AND r.code = 'DIRECTEUR';

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Migration 079: Correction Permissions Groupes';
    RAISE NOTICE '==========================================';
    
    IF v_chef_manage_exists THEN
        RAISE NOTICE '✅ Permission chef:manage créée';
        RAISE NOTICE '   - SUPER_ADMIN: % attributions', v_super_admin_count;
        RAISE NOTICE '   - CHEF_ETABLISSEMENT: % attributions', v_chef_count;
        RAISE NOTICE '   - DIRECTEUR: % attributions', v_directeur_count;
    ELSE
        RAISE NOTICE '❌ ÉCHEC: Permission chef:manage non créée';
    END IF;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'NOTE: Le SUPER_ADMIN bypass automatiquement';
    RAISE NOTICE 'toutes les vérifications de permission via';
    RAISE NOTICE 'permission-resolver.service.ts (ligne 139-166)';
    RAISE NOTICE '==========================================';
END $$;
