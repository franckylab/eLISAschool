-- ================================================================
-- eLISAschool - Migration du module Annonces (CORRIGÉE)
-- ================================================================
-- Version: 1.0.1
-- Description: Permissions et paramètres avec structure réelle
-- ================================================================

-- ============================================================
-- 1. TABLES (DÉJÀ CRÉÉES - Skip si existent)
-- ============================================================

-- Les tables annonces et annonce_ciblages ont déjà été créées
-- Cette migration ajoute uniquement permissions et paramètres

-- ============================================================
-- 2. PERMISSIONS RBAC
-- ============================================================

-- Permissions de base (CRUD)
INSERT INTO permissions (code, libelle, description, module, action) VALUES
    ('annonce:view', 'Voir les annonces', 'Permission de voir les annonces', 'annonces', 'annonce:view'),
    ('annonce:create', 'Créer des annonces', 'Permission de créer des annonces', 'annonces', 'annonce:create'),
    ('annonce:edit', 'Modifier des annonces', 'Permission de modifier des annonces', 'annonces', 'annonce:edit'),
    ('annonce:delete', 'Supprimer des annonces', 'Permission de supprimer des annonces', 'annonces', 'annonce:delete')
ON CONFLICT (code) DO NOTHING;

-- Permissions de gestion
INSERT INTO permissions (code, libelle, description, module, action) VALUES
    ('annonce:manage', 'Gestion complète des annonces', 'Permission de gestion complète', 'annonces', 'annonce:manage'),
    ('annonce:configurer', 'Configurer la bande d''annonces', 'Permission de configurer les annonces', 'annonces', 'annonce:configurer')
ON CONFLICT (code) DO NOTHING;

-- Permissions de workflow et validation
INSERT INTO permissions (code, libelle, description, module, action) VALUES
    ('annonce:valider', 'Valider/refuser des annonces', 'Permission de valider les annonces', 'annonces', 'annonce:valider'),
    ('annonce:publier', 'Publier/activer des annonces', 'Permission de publier des annonces', 'annonces', 'annonce:publier'),
    ('annonce:programmer', 'Programmer des annonces', 'Permission de programmer des annonces', 'annonces', 'annonce:programmer'),
    ('annonce:archiver', 'Archiver des annonces', 'Permission d''archiver des annonces', 'annonces', 'annonce:archiver'),
    ('annonce:desactiver', 'Désactiver des annonces', 'Permission de désactiver des annonces', 'annonces', 'annonce:desactiver'),
    ('annonce:activer', 'Activer des annonces', 'Permission d''activer des annonces', 'annonces', 'annonce:activer')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. ATTRIBUTION DES PERMISSIONS AUX RÔLES
-- ============================================================

-- SUPER_ADMIN : toutes les permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
  AND p.module = 'annonces'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  )
ON CONFLICT DO NOTHING;

-- ADMIN : toutes les permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.module = 'annonces'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  )
ON CONFLICT DO NOTHING;

-- CHEF_ETABLISSEMENT : permissions complètes
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
  AND p.module = 'annonces'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  )
ON CONFLICT DO NOTHING;

-- ENSEIGNANT, PERSONNEL, PARENT, ELEVE : lecture seule
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('ENSEIGNANT', 'PERSONNEL', 'PARENT', 'ELEVE')
  AND p.module = 'annonces'
  AND p.action = 'annonce:view'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. PARAMÈTRES SYSTÈME POUR LA CONFIGURATION
-- ============================================================

INSERT INTO parametres_systeme (cle, valeur, "typeValeur", categorie, module, "etablissementId", "modifiableRuntime") VALUES
    ('annonces.actif', 'true', 'BOOLEAN', 'MODULE', 'annonces', NULL, true),
    ('annonces.require_validation', 'false', 'BOOLEAN', 'MODULE', 'annonces', NULL, true),
    ('annonces.validation_levels', '1', 'NUMBER', 'MODULE', 'annonces', NULL, true),
    ('annonces.validation_roles', '{"1": "ADMIN"}', 'JSON', 'MODULE', 'annonces', NULL, true),
    ('annonces.vitesse_defilement', '50', 'NUMBER', 'MODULE', 'annonces', NULL, true),
    ('annonces.hauteur_bande', '40', 'NUMBER', 'MODULE', 'annonces', NULL, true),
    ('annonces.intervalle_actualisation', '30', 'NUMBER', 'MODULE', 'annonces', NULL, true),
    ('annonces.types_contenu_autorises', '["texte", "html"]', 'JSON', 'MODULE', 'annonces', NULL, true),
    ('annonces.taille_max_contenu', '5000', 'NUMBER', 'MODULE', 'annonces', NULL, true),
    ('annonces.pause_sur_vol', 'true', 'BOOLEAN', 'MODULE', 'annonces', NULL, true),
    ('annonces.arret_automatique', '0', 'NUMBER', 'MODULE', 'annonces', NULL, true),
    ('annonces.delai_apparition', '600', 'NUMBER', 'MODULE', 'annonces', NULL, true),
    ('annonces.delai_reapparition', '600', 'NUMBER', 'MODULE', 'annonces', NULL, true)
ON CONFLICT (cle, "etablissementId") DO NOTHING;

-- ============================================================
-- 5. VÉRIFICATION
-- ============================================================

DO $$
DECLARE
    perm_count INTEGER;
    role_perm_count INTEGER;
    param_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO perm_count
    FROM permissions
    WHERE module = 'annonces';

    SELECT COUNT(*) INTO role_perm_count
    FROM role_permissions rp
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE p.module = 'annonces';

    SELECT COUNT(*) INTO param_count
    FROM parametres_systeme
    WHERE cle LIKE 'annonces.%';

    RAISE NOTICE '✅ Migration module Annonces terminée';
    RAISE NOTICE '   - Permissions créées: %', perm_count;
    RAISE NOTICE '   - Attributions rôle-permission: %', role_perm_count;
    RAISE NOTICE '   - Paramètres créés: %', param_count;
END $$;
