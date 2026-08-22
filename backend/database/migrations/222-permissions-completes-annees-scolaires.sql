-- =============================================
-- Migration 222 — Permissions complètes Année Scolaire
-- =============================================
-- Attribution des permissions manquantes pour ADMIN et CHEF_ETABLISSEMENT
-- sur le module années-scolaires (create, edit, delete, activer, cloturer)
--
-- Contexte : La migration 221 n'a ajouté que reouvrir et audit:view.
-- Les permissions de base (create, edit, delete, activer, cloturer)
-- étaient uniquement attribuées à SUPER_ADMIN et PLATEFORME_SUPER_ADMIN.
--
-- Date: 2026-08-21
-- Auteur: franck arlos chendjou
-- =============================================

BEGIN;

-- =============================================
-- ÉTAPE 1 — Permissions manquantes pour le module
-- =============================================

-- Créer les permissions si elles n'existent pas déjà
INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES
    ('annees:activer', 'Activer une année scolaire', 'Activer une année scolaire (désactive les autres)', 'annees', 'activer', true),
    ('annees:cloturer', 'Clôturer une année scolaire', 'Clôturer une année scolaire non-active', 'annees', 'cloturer', true),
    ('annees:create', 'Créer une année scolaire', 'Créer une nouvelle année scolaire', 'annees', 'create', true),
    ('annees:edit', 'Modifier une année scolaire', 'Modifier une année scolaire existante', 'annees', 'edit', true),
    ('annees:delete', 'Supprimer une année scolaire', 'Supprimer une année scolaire non-active', 'annees', 'delete', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- ÉTAPE 2 — Attribution ADMIN
-- =============================================

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('annees:create', 'annees:edit', 'annees:delete', 'annees:activer', 'annees:cloturer')
ON CONFLICT DO NOTHING;

-- =============================================
-- ÉTAPE 3 — Attribution CHEF_ETABLISSEMENT
-- =============================================

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
  AND p.code IN ('annees:create', 'annees:edit', 'annees:delete', 'annees:activer', 'annees:cloturer')
ON CONFLICT DO NOTHING;

-- =============================================
-- ÉTAPE 4 — Attribution ENSEIGNANT (lecture seule + pas d'actions)
-- =============================================
-- Les enseignants n'ont pas besoin de permissions années-scolaires
-- (ils voient l'année active via le contexte global)

-- =============================================
-- ÉTAPE 5 — Vérification
-- =============================================

DO $$
DECLARE
    v_admin_perms INT;
    v_chef_perms INT;
BEGIN
    SELECT COUNT(*) INTO v_admin_perms
    FROM role_permissions rp
    JOIN roles r ON r.id = rp."roleId"
    JOIN permissions p ON p.id = rp."permissionId"
    WHERE r.code = 'ADMIN'
      AND p.code LIKE 'annees:%';

    SELECT COUNT(*) INTO v_chef_perms
    FROM role_permissions rp
    JOIN roles r ON r.id = rp."roleId"
    JOIN permissions p ON p.id = rp."permissionId"
    WHERE r.code = 'CHEF_ETABLISSEMENT'
      AND p.code LIKE 'annees:%';

    RAISE NOTICE '✅ Migration 222 terminée — Permissions annees:* : ADMIN=%, CHEF_ETABLISSEMENT=%',
        v_admin_perms, v_chef_perms;
END $$;

COMMIT;
