-- ==================================
-- Migration: Permissions Réseau/Connexion
-- ==================================
-- Version: 1.0.0
-- Date: 2026-07-30
-- Description: Ajoute les permissions pour l'indicateur de connexion réseau (network:view, network:details, network:admin)
-- ==================================

BEGIN;

-- ==================================
-- 1. INSÉRER LES NOUVELLES PERMISSIONS
-- ==================================

-- Convention rbac.seed : module = premier segment du code, action = reste.
INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES 
    ('network:view', 'Voir l''indicateur de connexion réseau', 'Voir l''indicateur de connexion réseau', 'network', 'view', true),
    ('network:details', 'Voir les détails de connexion (latence, DB, mémoire)', 'Voir les détails de connexion (latence, DB, mémoire)', 'network', 'details', true),
    ('network:admin', 'Accès à la page de monitoring réseau complète', 'Accès à la page de monitoring réseau complète', 'network', 'admin', true)
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 2. ATTRIBUER AUX RÔLES
-- ==================================

-- SUPER_ADMIN et ADMIN récupèrent toutes les permissions network
-- Les rôles inférieurs ne reçoivent que network:view via le seed (DEFAULT_ROLE_PERMISSIONS)

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code IN ('SUPER_ADMIN', 'ADMIN')
  AND p.code IN ('network:view', 'network:details', 'network:admin')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  );

-- ENSEIGNANT, PERSONNEL, etc. reçoivent network:view
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code IN ('ENSEIGNANT', 'PERSONNEL', 'CENSEUR', 'COORDINATEUR_DISCIPLINE', 'SURVEILLANT', 'COMPTABLE', 'DOCUMENTALISTE', 'ELEVE', 'PARENT')
  AND p.code = 'network:view'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  );

COMMIT;
