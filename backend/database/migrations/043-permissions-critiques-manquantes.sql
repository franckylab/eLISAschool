-- ==================================
-- eLISAschool - Migration permissions critiques manquantes
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-02-09
-- Description: Ajoute 15 permissions critiques manquantes identifiées dans l'audit
-- ==================================

-- ==================================
-- ÉTAPE 1 : Permissions manquantes
-- ==================================

-- 1. Gestion des établissements (CRITIQUE)
INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'etablissements:manage',
    'Gérer les établissements',
    'Créer, modifier, supprimer des établissements',
    'etablissements',
    'manage',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'etablissements:manage');

INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'etablissements:config',
    'Configurer les établissements',
    'Modifier la configuration des établissements (modules actifs, paramètres)',
    'etablissements',
    'config',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'etablissements:config');

-- 2. Préférences utilisateur (IMPORTANT)
INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'preferences:manage',
    'Gérer les préférences',
    'Modifier les préférences utilisateur globales',
    'auth',
    'manage',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'preferences:manage');

-- 3. Backup & restauration (CRITIQUE)
INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'backup:create',
    'Créer des backups',
    'Créer des sauvegardes manuelles',
    'configuration',
    'create',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'backup:create');

INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'backup:restore',
    'Restaurer des backups',
    'Restaurer le système depuis un backup',
    'configuration',
    'restore',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'backup:restore');

-- 4. Gestion des sondages (IMPORTANT)
INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'sondages:manage',
    'Gérer les sondages',
    'Permission générique pour gérer les sondages',
    'sondages',
    'manage',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'sondages:manage');

-- 5. Gestion des annonces (IMPORTANT)
INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'annonces:manage',
    'Gérer les annonces',
    'Permission générique pour gérer les annonces',
    'annonces',
    'manage',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'annonces:manage');

-- 6. Santé (IMPORTANT)
INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'sante:manage',
    'Gérer la santé',
    'Gérer les incidents et visites de santé',
    'sante',
    'manage',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'sante:manage');

-- 7. Gamification complète (MEDIUM)
INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'gamification:stats',
    'Voir les statistiques de gamification',
    'Accéder aux statistiques et rapports de gamification',
    'gamification',
    'view',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'gamification:stats');

-- 8. Validation workflow (CRITIQUE)
INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'workflow:validate',
    'Valider les workflows',
    'Approuver ou rejeter les éléments en attente de validation',
    'configuration',
    'validate',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'workflow:validate');

-- 9. Rapports avancés (IMPORTANT)
INSERT INTO permissions (id, code, libelle, description, module, action, actif, "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    'rapports:avances',
    'Accéder aux rapports avancés',
    'Générer des rapports analytiques et statistiques',
    'configuration',
    'view',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'rapports:avances');

-- ==================================
-- ÉTAPE 2 : Attributions aux rôles
-- ==================================

-- SUPER_ADMIN: toutes les nouvelles permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
  AND p.code IN (
    'etablissements:manage', 'etablissements:config',
    'preferences:manage',
    'backup:create', 'backup:restore',
    'sondages:manage', 'annonces:manage',
    'sante:manage',
    'gamification:stats',
    'workflow:validate', 'rapports:avances'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  );

-- ADMIN: permissions de gestion courante (sauf backup:restore et workflow:validate niveau 2)
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN (
    'etablissements:config',
    'preferences:manage',
    'sondages:manage', 'annonces:manage',
    'sante:manage',
    'gamification:stats',
    'workflow:validate', 'rapports:avances'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  );

-- CHEF_ETABLISSEMENT: permissions liées à son établissement
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
  AND p.code IN (
    'preferences:manage',
    'sondages:manage', 'annonces:manage',
    'sante:manage',
    'workflow:validate', 'rapports:avances'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  );

-- PROVISEUR/PRINCIPAL/DIRECTEUR: mêmes que CHEF_ETABLISSEMENT
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('PROVISEUR', 'PRINCIPAL', 'DIRECTEUR')
  AND p.code IN (
    'preferences:manage',
    'sondages:manage', 'annonces:manage',
    'sante:manage',
    'rapports:avances'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  );

-- ==================================
-- ÉTAPE 3 : Vérification
-- ==================================

SELECT 
    p.code AS permission,
    COUNT(rp."permissionId") AS nombre_roles
FROM permissions p
LEFT JOIN role_permissions rp ON p.id = rp."permissionId"
WHERE p.code IN (
    'etablissements:manage', 'etablissements:config',
    'preferences:manage',
    'backup:create', 'backup:restore',
    'sondages:manage', 'annonces:manage',
    'sante:manage',
    'gamification:stats',
    'workflow:validate', 'rapports:avances'
)
GROUP BY p.code
ORDER BY p.code;

-- ==================================
-- FIN MIGRATION
-- ==================================
