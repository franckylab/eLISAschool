/**
 * ==================================
 * eLISAschool - Migration 076: Permissions Groupes Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * CORRIGE la migration 075 :
 * - Les tables existent déjà avec la bonne structure (camelCase)
 * - Ajoute les index manquants pour la recherche textuelle
 * - Crée les permissions avec les bons noms de colonnes (code, libelle)
 * - Attribue les permissions aux rôles
 */

-- ==================================
-- 1. Index manquants pour la recherche textuelle
-- ==================================

-- Vérifier si l'extension pg_trgm est activée
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index de recherche textuelle sur le nom du groupe
CREATE INDEX IF NOT EXISTS idx_groupes_nom_search 
    ON groupes_etablissements USING gin (nom gin_trgm_ops);

-- Index sur la date de création pour le tri
CREATE INDEX IF NOT EXISTS idx_groupes_cree_at 
    ON groupes_etablissements(cree_at DESC);

COMMENT ON INDEX idx_groupes_nom_search IS 'Recherche textuelle rapide (LIKE, ILIKE) sur le nom des groupes';

-- ==================================
-- 2. Permissions RBAC
-- ==================================

-- Créer les permissions pour le module groupes
INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES 
    ('groupes-etablissements:create', 'Créer groupe', 'Peut créer un nouveau groupe d''établissements', 'groupes-etablissements', 'create', true),
    ('groupes-etablissements:view', 'Voir groupes', 'Peut voir les groupes d''établissements', 'groupes-etablissements', 'view', true),
    ('groupes-etablissements:edit', 'Modifier groupes', 'Peut modifier un groupe d''établissements', 'groupes-etablissements', 'edit', true),
    ('groupes-etablissements:delete', 'Supprimer groupes', 'Peut supprimer un groupe d''établissements', 'groupes-etablissements', 'delete', true),
    ('groupes-etablissements:manage-etablissements', 'Gérer établissements', 'Peut ajouter/retirer des établissements d''un groupe', 'groupes-etablissements', 'manage-etablissements', true),
    ('groupes-etablissements:manage-admins', 'Gérer admins', 'Peut ajouter/retirer des administrateurs d''un groupe', 'groupes-etablissements', 'manage-admins', true),
    ('groupes-etablissements:dashboard', 'Voir dashboard consolidé', 'Peut voir le dashboard consolidé du groupe', 'groupes-etablissements', 'dashboard', true),
    ('groupes-etablissements:rapports', 'Voir rapports consolidés', 'Peut voir les rapports consolidés du groupe', 'groupes-etablissements', 'rapports', true)
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 3. Attribution des permissions aux rôles
-- ==================================

-- SUPER_ADMIN : Toutes les permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id as "roleId",
    p.id as "permissionId"
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN'
    AND p.code LIKE 'groupes-etablissements:%'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- CHEF_ETABLISSEMENT : Toutes les permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id as "roleId",
    p.id as "permissionId"
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
    AND p.code LIKE 'groupes-etablissements:%'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- DIRECTEUR : Toutes les permissions
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id as "roleId",
    p.id as "permissionId"
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'DIRECTEUR'
    AND p.code LIKE 'groupes-etablissements:%'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- DIRECTEUR_ADJOINT : Lecture et dashboard uniquement
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT 
    r.id as "roleId",
    p.id as "permissionId"
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'DIRECTEUR_ADJOINT'
    AND p.code IN (
        'groupes-etablissements:view',
        'groupes-etablissements:dashboard',
        'groupes-etablissements:rapports'
    )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ==================================
-- 4. Fonctions utilitaires
-- ==================================

-- Fonction pour compter les établissements d'un groupe
CREATE OR REPLACE FUNCTION fn_count_etablissements_groupe(p_groupe_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM groupe_etablissement_liens
        WHERE "groupeId" = p_groupe_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_count_etablissements_groupe IS 'Compte le nombre d''établissements dans un groupe';

-- Fonction pour vérifier si un utilisateur a accès à un groupe
CREATE OR REPLACE FUNCTION fn_user_has_groupe_access(
    p_groupe_id UUID,
    p_utilisateur_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM groupes_etablissements g
        LEFT JOIN groupe_admins ga ON g.id = ga."groupeId"
        WHERE g.id = p_groupe_id
            AND g.actif = TRUE
            AND (
                g."proprietaireId" = p_utilisateur_id
                OR ga."utilisateurId" = p_utilisateur_id
            )
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_user_has_groupe_access IS 'Vérifie si un utilisateur a accès à un groupe (propriétaire ou admin)';

-- ==================================
-- 5. Vérification finale
-- ==================================

DO $$
DECLARE
    v_permissions_count INTEGER;
    v_roles_count INTEGER;
    v_indexes_count INTEGER;
BEGIN
    -- Compter les permissions créées
    SELECT COUNT(*) INTO v_permissions_count
    FROM permissions
    WHERE code LIKE 'groupes-etablissements:%';

    -- Compter les rôles avec permissions
    SELECT COUNT(DISTINCT r.id) INTO v_roles_count
    FROM roles r
    JOIN role_permissions rp ON r.id = rp."roleId"
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE p.code LIKE 'groupes-etablissements:%';

    -- Compter les index sur la table groupes
    SELECT COUNT(*) INTO v_indexes_count
    FROM pg_indexes
    WHERE tablename = 'groupes_etablissements';

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Migration 076: Permissions Groupes Établissements';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Permissions créées: %', v_permissions_count;
    RAISE NOTICE '✅ Rôles configurés: %', v_roles_count;
    RAISE NOTICE '✅ Index sur groupes_etablissements: %', v_indexes_count;
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Tables existantes confirmées:';
    RAISE NOTICE '  - groupes_etablissements (camelCase)';
    RAISE NOTICE '  - groupe_etablissement_liens';
    RAISE NOTICE '  - groupe_admins';
    RAISE NOTICE '==========================================';
END $$;
