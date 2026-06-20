/**
 * ==================================
 * eLISAschool - Migration RBAC: Permission Retrait Établissement v5.0
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 * 
 * OBJECTIF:
 * - Ajouter la permission ciblée `utilisateurs:etablissements:manage`
 * - Attribuer cette permission aux rôles ADMIN et SUPER_ADMIN
 * - Conserver la permission existante `utilisateurs:manage` pour compatibilité
 * 
 * DÉCISIONS:
 * - Permission spécifique pour la gestion des affectations établissement
 * - Séparation des responsabilités: gestion utilisateur vs gestion affectations
 * - Compatibilité ascendante: ancienne permission toujours fonctionnelle
 */

-- ========================================
-- ÉTAPE 1: Créer la nouvelle permission
-- ========================================

INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'utilisateurs:etablissements:manage',
    'Gérer les affectations des utilisateurs aux établissements (ajouter, retirer, modifier)',
    'Gérer les affectations des utilisateurs aux établissements',
    'utilisateurs',
    'etablissements:manage',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- ÉTAPE 2: Attribuer au rôle ADMIN
-- ========================================

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.code = 'utilisateurs:etablissements:manage'
  AND NOT EXISTS (
      SELECT 1 
      FROM role_permissions rp 
      WHERE rp."roleId" = r.id 
        AND rp."permissionId" = p.id
  );

-- ========================================
-- ÉTAPE 3: Attribuer au rôle SUPER_ADMIN
-- ========================================

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
  AND p.code = 'utilisateurs:etablissements:manage'
  AND NOT EXISTS (
      SELECT 1 
      FROM role_permissions rp 
      WHERE rp."roleId" = r.id 
        AND rp."permissionId" = p.id
  );

-- ========================================
-- ÉTAPE 4: Vérification
-- ========================================

-- Afficher les permissions créées
SELECT 
    p.code as permission,
    r.code as role,
    'Attribué' as statut
FROM role_permissions rp
JOIN permissions p ON p.id = rp."permissionId"
JOIN roles r ON r.id = rp."roleId"
WHERE p.code = 'utilisateurs:etablissements:manage'
ORDER BY r.code;

-- Compter les attributions
SELECT 
    COUNT(*) as total_attributions,
    COUNT(CASE WHEN r.code = 'ADMIN' THEN 1 END) as admin_count,
    COUNT(CASE WHEN r.code = 'SUPER_ADMIN' THEN 1 END) as super_admin_count
FROM role_permissions rp
JOIN permissions p ON p.id = rp."permissionId"
JOIN roles r ON r.id = rp."roleId"
WHERE p.code = 'utilisateurs:etablissements:manage';
