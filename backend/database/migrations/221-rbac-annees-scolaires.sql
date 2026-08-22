-- =============================================
-- Migration 221 — Permissions RBAC Année Scolaire
-- =============================================
-- Ajout des permissions manquantes pour le module années-scolaires :
-- - annees:reouvrir (action réouvrir une année clôturée)
-- - audit:annees-scolaires:view (consulter l'audit des années scolaires)
--
-- Date: 2026-08-21
-- Auteur: franck arlos chendjou
-- =============================================

BEGIN;

-- =============================================
-- ÉTAPE 1 — Création des permissions
-- =============================================

-- Permission réouvrir année scolaire
INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES (
    'annees:reouvrir',
    'Réouvrir une année scolaire',
    'Réouvrir une année scolaire clôturée',
    'annees',
    'reouvrir',
    true
)
ON CONFLICT (code) DO NOTHING;

-- Permission audit années scolaires
INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES (
    'audit:annees-scolaires:view',
    'Consulter l''audit des années scolaires',
    'Voir l''historique des modifications du module années-scolaires',
    'audit',
    'annees-scolaires:view',
    true
)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- ÉTAPE 2 — Attribution aux rôles
-- =============================================

-- ADMIN : toutes les permissions années + audit
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('annees:reouvrir', 'audit:annees-scolaires:view')
ON CONFLICT DO NOTHING;

-- CHEF_ETABLISSEMENT : toutes les permissions années + audit
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
  AND p.code IN ('annees:reouvrir', 'audit:annees-scolaires:view')
ON CONFLICT DO NOTHING;

-- =============================================
-- ÉTAPE 3 — Vérification
-- =============================================

DO $$
DECLARE
    v_admin_count INT;
    v_chef_count INT;
BEGIN
    SELECT COUNT(*) INTO v_admin_count
    FROM role_permissions rp
    JOIN roles r ON r.id = rp."roleId"
    JOIN permissions p ON p.id = rp."permissionId"
    WHERE r.code = 'ADMIN'
      AND p.code IN ('annees:reouvrir', 'audit:annees-scolaires:view');

    SELECT COUNT(*) INTO v_chef_count
    FROM role_permissions rp
    JOIN roles r ON r.id = rp."roleId"
    JOIN permissions p ON p.id = rp."permissionId"
    WHERE r.code = 'CHEF_ETABLISSEMENT'
      AND p.code IN ('annees:reouvrir', 'audit:annees-scolaires:view');

    RAISE NOTICE '✅ Migration 221 terminée — Permissions attribuées : ADMIN=%, CHEF_ETABLISSEMENT=%',
        v_admin_count, v_chef_count;
END $$;

COMMIT;
