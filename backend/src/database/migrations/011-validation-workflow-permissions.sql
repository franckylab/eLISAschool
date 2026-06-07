-- ==================================
-- Migration: Permissions Validation Workflow
-- ==================================
-- Version: 1.0.0
-- Date: 2026-06-07
-- Description: Ajoute les permissions pour le système de validation multi-niveau
-- ==================================

BEGIN;

-- ==================================
-- 1. INSÉRER LES NOUVELLES PERMISSIONS
-- ==================================

-- Permissions NOTES
INSERT INTO permissions (code, description, module, actif, "createdAt")
VALUES 
    ('validation:notes:level1', 'Validation des notes - Niveau 1 (Enseignant)', 'validation-workflow', true, NOW()),
    ('validation:notes:level2', 'Validation des notes - Niveau 2 (Chef établissement)', 'validation-workflow', true, NOW()),
    ('validation:notes:level3', 'Validation des notes - Niveau 3 (Admin)', 'validation-workflow', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- Permissions BULLETINS
INSERT INTO permissions (code, description, module, actif, "createdAt")
VALUES 
    ('validation:bulletins:level1', 'Validation des bulletins - Niveau 1 (Enseignant)', 'validation-workflow', true, NOW()),
    ('validation:bulletins:level2', 'Validation des bulletins - Niveau 2 (Chef établissement)', 'validation-workflow', true, NOW()),
    ('validation:bulletins:level3', 'Validation des bulletins - Niveau 3 (Admin)', 'validation-workflow', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- Permissions CANTINE
INSERT INTO permissions (code, description, module, actif, "createdAt")
VALUES 
    ('validation:cantine:level1', 'Validation inscriptions cantine - Niveau 1 (Personnel)', 'validation-workflow', true, NOW()),
    ('validation:cantine:level2', 'Validation inscriptions cantine - Niveau 2 (Responsable cantine)', 'validation-workflow', true, NOW()),
    ('validation:cantine:level3', 'Validation inscriptions cantine - Niveau 3 (Admin)', 'validation-workflow', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- Permissions TRANSPORT
INSERT INTO permissions (code, description, module, actif, "createdAt")
VALUES 
    ('validation:transport:level1', 'Validation inscriptions transport - Niveau 1 (Personnel)', 'validation-workflow', true, NOW()),
    ('validation:transport:level2', 'Validation inscriptions transport - Niveau 2 (Responsable transport)', 'validation-workflow', true, NOW()),
    ('validation:transport:level3', 'Validation inscriptions transport - Niveau 3 (Admin)', 'validation-workflow', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- Permissions DASHBOARD et RAPPORTS
INSERT INTO permissions (code, description, module, actif, "createdAt")
VALUES 
    ('validation:dashboard:view', 'Voir le dashboard de validation', 'validation-workflow', true, NOW()),
    ('validation:rapports:view', 'Consulter les rapports de validation', 'validation-workflow', true, NOW()),
    ('validation:rapports:export', 'Exporter les rapports de validation', 'validation-workflow', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 2. ATTRIBUER LES PERMISSIONS AUX RÔLES
-- ==================================

-- Helper function to get role ID
CREATE OR REPLACE FUNCTION get_role_id(role_name VARCHAR)
RETURNS UUID AS $$
DECLARE
    role_id UUID;
BEGIN
    SELECT id INTO role_id FROM roles WHERE nom = role_name LIMIT 1;
    RETURN role_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get permission ID
CREATE OR REPLACE FUNCTION get_permission_id(perm_code VARCHAR)
RETURNS UUID AS $$
DECLARE
    perm_id UUID;
BEGIN
    SELECT id INTO perm_id FROM permissions WHERE code = perm_code LIMIT 1;
    RETURN perm_id;
END;
$$ LANGUAGE plpgsql;

-- ADMIN: Toutes les permissions validation
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 
    get_role_id('ADMIN'),
    id,
    NOW()
FROM permissions
WHERE code LIKE 'validation:%'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE "roleId" = get_role_id('ADMIN') 
    AND "permissionId" = permissions.id
);

-- CHEF_ETABLISSEMENT: Permissions niveau 2 et 3 + dashboard + rapports
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 
    get_role_id('CHEF_ETABLISSEMENT'),
    id,
    NOW()
FROM permissions
WHERE (
    code IN (
        'validation:notes:level2', 'validation:notes:level3',
        'validation:bulletins:level2', 'validation:bulletins:level3',
        'validation:cantine:level2', 'validation:cantine:level3',
        'validation:transport:level2', 'validation:transport:level3',
        'validation:dashboard:view', 'validation:rapports:view'
    )
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE "roleId" = get_role_id('CHEF_ETABLISSEMENT') 
    AND "permissionId" = permissions.id
);

-- ENSEIGNANT: Permissions niveau 1 + dashboard
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 
    get_role_id('ENSEIGNANT'),
    id,
    NOW()
FROM permissions
WHERE code IN (
    'validation:notes:level1',
    'validation:bulletins:level1',
    'validation:dashboard:view'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE "roleId" = get_role_id('ENSEIGNANT') 
    AND "permissionId" = permissions.id
);

-- RESPONSABLE_CANTINE: Permissions cantine niveau 2 et 3 + dashboard
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 
    get_role_id('RESPONSABLE_CANTINE'),
    id,
    NOW()
FROM permissions
WHERE code IN (
    'validation:cantine:level2',
    'validation:cantine:level3',
    'validation:dashboard:view'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE "roleId" = get_role_id('RESPONSABLE_CANTINE') 
    AND "permissionId" = permissions.id
);

-- RESPONSABLE_TRANSPORT: Permissions transport niveau 2 et 3 + dashboard
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT 
    get_role_id('RESPONSABLE_TRANSPORT'),
    id,
    NOW()
FROM permissions
WHERE code IN (
    'validation:transport:level2',
    'validation:transport:level3',
    'validation:dashboard:view'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE "roleId" = get_role_id('RESPONSABLE_TRANSPORT') 
    AND "permissionId" = permissions.id
);

-- ==================================
-- 3. NETTOYAGE
-- ==================================

DROP FUNCTION IF EXISTS get_role_id(VARCHAR);
DROP FUNCTION IF EXISTS get_permission_id(VARCHAR);

COMMIT;

-- ==================================
-- VÉRIFICATION
-- ==================================
-- Pour vérifier les permissions créées:
-- SELECT code, description, module FROM permissions WHERE code LIKE 'validation:%' ORDER BY code;

-- Pour vérifier les attributions aux rôles:
-- SELECT r.nom AS role, p.code AS permission 
-- FROM role_permissions rp
-- JOIN roles r ON r.id = rp."roleId"
-- JOIN permissions p ON p.id = rp."permissionId"
-- WHERE p.code LIKE 'validation:%'
-- ORDER BY r.nom, p.code;
