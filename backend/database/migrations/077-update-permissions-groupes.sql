/**
 * ==================================
 * eLISAschool - Migration 077: Mise à jour Permissions GROUPES
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-17
 * 
 * Met à jour les permissions GROUPES dans la table permissions
 * et les attribue aux rôles CHEF_ETABLISSEMENT, DIRECTEUR, SUPER_ADMIN
 */

-- ==================================
-- 1. Vérifier/Créer les permissions GROUPES
-- ==================================

INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES 
    ('groupes:view', 'Voir groupes', 'Peut voir les groupes d''établissements', 'groupes', 'view', true),
    ('groupes:manage', 'Gérer groupes', 'Peut créer/modifier/supprimer des groupes', 'groupes', 'manage', true),
    ('groupes:dashboard:consolide', 'Dashboard consolidé', 'Peut voir le dashboard consolidé des groupes', 'groupes', 'dashboard:consolide', true),
    ('groupes:rapports:scolarite', 'Rapports scolarité', 'Peut voir les rapports de scolarité consolidés', 'groupes', 'rapports:scolarite', true),
    ('groupes:rapports:finances', 'Rapports finances', 'Peut voir les rapports financiers consolidés', 'groupes', 'rapports:finances', true),
    ('groupes:etablissements:manage', 'Gérer établissements', 'Peut ajouter/retirer des établissements des groupes', 'groupes', 'etablissements:manage', true)
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 2. Attribuer les permissions au rôle CHEF_ETABLISSEMENT
-- ==================================

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id as "roleId",
    p.id as "permissionId"
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
    AND p.code IN (
        'groupes:view',
        'groupes:manage',
        'groupes:dashboard:consolide',
        'groupes:rapports:scolarite',
        'groupes:rapports:finances',
        'groupes:etablissements:manage'
    )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ==================================
-- 3. Attribuer les permissions au rôle DIRECTEUR
-- ==================================

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id as "roleId",
    p.id as "permissionId"
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'DIRECTEUR'
    AND p.code IN (
        'groupes:view',
        'groupes:manage',
        'groupes:dashboard:consolide',
        'groupes:rapports:scolarite',
        'groupes:rapports:finances',
        'groupes:etablissements:manage'
    )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ==================================
-- 4. Vérification finale
-- ==================================

DO $$
DECLARE
    v_permissions_count INTEGER;
    v_chef_count INTEGER;
    v_directeur_count INTEGER;
BEGIN
    -- Compter les permissions GROUPES
    SELECT COUNT(*) INTO v_permissions_count
    FROM permissions
    WHERE code LIKE 'groupes:%';

    -- Compter les permissions pour CHEF_ETABLISSEMENT
    SELECT COUNT(*) INTO v_chef_count
    FROM role_permissions rp
    JOIN roles r ON rp."roleId" = r.id
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE r.code = 'CHEF_ETABLISSEMENT'
        AND p.code LIKE 'groupes:%';

    -- Compter les permissions pour DIRECTEUR
    SELECT COUNT(*) INTO v_directeur_count
    FROM role_permissions rp
    JOIN roles r ON rp."roleId" = r.id
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE r.code = 'DIRECTEUR'
        AND p.code LIKE 'groupes:%';

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Migration 077: Permissions GROUPES';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Permissions GROUPES créées: %', v_permissions_count;
    RAISE NOTICE '✅ CHEF_ETABLISSEMENT: % permissions GROUPES', v_chef_count;
    RAISE NOTICE '✅ DIRECTEUR: % permissions GROUPES', v_directeur_count;
    RAISE NOTICE '==========================================';
END $$;
