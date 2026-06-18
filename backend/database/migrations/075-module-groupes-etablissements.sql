/**
 * ==================================
 * eLISAschool - Migration 075: Module Groupes Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée les tables pour le module de gestion des groupes d'établissements :
 * - groupes_etablissements : Groupes logiques d'établissements
 * - groupe_etablissement_liens : Association groupes <-> établissements
 * - groupe_admins : Administrateurs des groupes
 * 
 * Fonctionnalités :
 * - Consolidation de dashboards multi-établissements
 * - Rapports financiers et scolaires consolidés
 * - Gestion partagée avec co-administrateurs
 */

-- ==================================
-- 1. Table: groupes_etablissements
-- ==================================
CREATE TABLE IF NOT EXISTS groupes_etablissements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    proprietaire_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE RESTRICT,
    code VARCHAR(50) UNIQUE NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    cree_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    maj_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherche par propriétaire et statut actif
CREATE INDEX IF NOT EXISTS idx_groupes_proprietaire_actif 
    ON groupes_etablissements(proprietaire_id, actif);

-- Index pour recherche textuelle (nom, code)
CREATE INDEX IF NOT EXISTS idx_groupes_nom 
    ON groupes_etablissements USING gin (nom gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_groupes_code 
    ON groupes_etablissements(code);

COMMENT ON TABLE groupes_etablissements IS 'Groupes logiques d''établissements pour consolidation dashboards et rapports';
COMMENT ON COLUMN groupes_etablissements.proprietaire_id IS 'UUID du propriétaire/créateur du groupe';
COMMENT ON COLUMN groupes_etablissements.code IS 'Code unique du groupe (ex: GROUPE_SUD, GROUPE_NORD)';

-- ==================================
-- 2. Table: groupe_etablissement_liens
-- ==================================
CREATE TABLE IF NOT EXISTS groupe_etablissement_liens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    groupe_id UUID NOT NULL REFERENCES groupes_etablissements(id) ON DELETE CASCADE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    ajoute_par UUID REFERENCES utilisateurs(id),
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte d'unicité : un établissement ne peut être dans un groupe qu'une seule fois
    CONSTRAINT uq_groupe_etablissement UNIQUE (groupe_id, etablissement_id)
);

-- Index pour recherche rapide des établissements d'un groupe
CREATE INDEX IF NOT EXISTS idx_liens_groupe_id 
    ON groupe_etablissement_liens(groupe_id);

-- Index pour recherche rapide des groupes d'un établissement
CREATE INDEX IF NOT EXISTS idx_liens_etablissement_id 
    ON groupe_etablissement_liens(etablissement_id);

COMMENT ON TABLE groupe_etablissement_liens IS 'Table de jointure entre groupes et établissements';
COMMENT ON COLUMN groupe_etablissement_liens.ajoute_par IS 'Utilisateur qui a ajouté l''établissement au groupe';

-- ==================================
-- 3. Table: groupe_admins
-- ==================================
CREATE TABLE IF NOT EXISTS groupe_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    groupe_id UUID NOT NULL REFERENCES groupes_etablissements(id) ON DELETE CASCADE,
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    assigne_par UUID REFERENCES utilisateurs(id),
    date_assignation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte d'unicité : un utilisateur ne peut être admin d'un groupe qu'une seule fois
    CONSTRAINT uq_groupe_admin UNIQUE (groupe_id, utilisateur_id)
);

-- Index pour recherche rapide des admins d'un groupe
CREATE INDEX IF NOT EXISTS idx_groupe_admins_groupe_id 
    ON groupe_admins(groupe_id);

-- Index pour recherche rapide des groupes d'un admin
CREATE INDEX IF NOT EXISTS idx_groupe_admins_utilisateur_id 
    ON groupe_admins(utilisateur_id);

COMMENT ON TABLE groupe_admins IS 'Administrateurs assignés à un groupe d''établissements';
COMMENT ON COLUMN groupe_admins.assigne_par IS 'Utilisateur qui a assigné cet administrateur';

-- ==================================
-- 4. Permissions RBAC
-- ==================================

-- Créer les permissions pour le module groupes si elles n'existent pas
INSERT INTO permissions (cle, nom, description, module, categorie)
VALUES 
    ('groupes-etablissements:create', 'Créer groupe', 'Peut créer un nouveau groupe d''établissements', 'groupes-etablissements', 'groupes'),
    ('groupes-etablissements:view', 'Voir groupes', 'Peut voir les groupes d''établissements', 'groupes-etablissements', 'groupes'),
    ('groupes-etablissements:edit', 'Modifier groupes', 'Peut modifier un groupe d''établissements', 'groupes-etablissements', 'groupes'),
    ('groupes-etablissements:delete', 'Supprimer groupes', 'Peut supprimer un groupe d''établissements', 'groupes-etablissements', 'groupes'),
    ('groupes-etablissements:manage-etablissements', 'Gérer établissements', 'Peut ajouter/retirer des établissements d''un groupe', 'groupes-etablissements', 'etablissements'),
    ('groupes-etablissements:manage-admins', 'Gérer admins', 'Peut ajouter/retirer des administrateurs d''un groupe', 'groupes-etablissements', 'admins'),
    ('groupes-etablissements:dashboard', 'Voir dashboard consolidé', 'Peut voir le dashboard consolidé du groupe', 'groupes-etablissements', 'dashboard'),
    ('groupes-etablissements:rapports', 'Voir rapports consolidés', 'Peut voir les rapports consolidés du groupe', 'groupes-etablissements', 'rapports')
ON CONFLICT (cle) DO NOTHING;

-- ==================================
-- 5. Attribution des permissions aux rôles
-- ==================================

-- SUPER_ADMIN : Toutes les permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.nom = 'SUPER_ADMIN'
    AND p.cle LIKE 'groupes-etablissements:%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CHEF_ETABLISSEMENT : Permissions de gestion complète
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.nom = 'CHEF_ETABLISSEMENT'
    AND p.cle IN (
        'groupes-etablissements:create',
        'groupes-etablissements:view',
        'groupes-etablissements:edit',
        'groupes-etablissements:delete',
        'groupes-etablissements:manage-etablissements',
        'groupes-etablissements:manage-admins',
        'groupes-etablissements:dashboard',
        'groupes-etablissements:rapports'
    )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DIRECTEUR : Permissions similaires au chef d'établissement
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.nom = 'DIRECTEUR'
    AND p.cle IN (
        'groupes-etablissements:create',
        'groupes-etablissements:view',
        'groupes-etablissements:edit',
        'groupes-etablissements:delete',
        'groupes-etablissements:manage-etablissements',
        'groupes-etablissements:manage-admins',
        'groupes-etablissements:dashboard',
        'groupes-etablissements:rapports'
    )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DIRECTEUR_ADJOINT : Lecture et dashboard
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.nom = 'DIRECTEUR_ADJOINT'
    AND p.cle IN (
        'groupes-etablissements:view',
        'groupes-etablissements:dashboard',
        'groupes-etablissements:rapports'
    )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================================
-- 6. Données de test (optionnel)
-- ==================================

-- Créer un groupe de démonstration si aucun groupe n'existe
DO $$
DECLARE
    premier_admin_id UUID;
    groupe_id UUID;
BEGIN
    -- Récupérer le premier SUPER_ADMIN
    SELECT u.id INTO premier_admin_id
    FROM utilisateurs u
    JOIN utilisateurs_roles ur ON u.id = ur.utilisateur_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.nom = 'SUPER_ADMIN'
    LIMIT 1;

    -- Si un admin existe, créer un groupe de démo
    IF premier_admin_id IS NOT NULL THEN
        INSERT INTO groupes_etablissements (nom, description, proprietaire_id, code, actif)
        VALUES (
            'Groupe Démonstration',
            'Groupe de démonstration pour tester la consolidation multi-établissements',
            premier_admin_id,
            'GROUPE_DEMO',
            TRUE
        )
        RETURNING id INTO groupe_id;

        -- Ajouter le créateur comme admin
        INSERT INTO groupe_admins (groupe_id, utilisateur_id, assigne_par)
        VALUES (groupe_id, premier_admin_id, premier_admin_id);

        RAISE NOTICE 'Groupe de démonstration créé avec ID: %', groupe_id;
    ELSE
        RAISE NOTICE 'Aucun SUPER_ADMIN trouvé - pas de groupe de démonstration créé';
    END IF;
END $$;

-- ==================================
-- 7. Fonctions utilitaires
-- ==================================

-- Fonction pour compter les établissements d'un groupe
CREATE OR REPLACE FUNCTION fn_count_etablissements_groupe(p_groupe_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM groupe_etablissement_liens
        WHERE groupe_id = p_groupe_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

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
        LEFT JOIN groupe_admins ga ON g.id = ga.groupe_id
        WHERE g.id = p_groupe_id
            AND g.actif = TRUE
            AND (
                g.proprietaire_id = p_utilisateur_id
                OR ga.utilisateur_id = p_utilisateur_id
            )
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_count_etablissements_groupe IS 'Compte le nombre d''établissements dans un groupe';
COMMENT ON FUNCTION fn_user_has_groupe_access IS 'Vérifie si un utilisateur a accès à un groupe (propriétaire ou admin)';

-- ==================================
-- 8. Triggers pour maj_at automatique
-- ==================================

-- Trigger pour mettre à jour maj_at automatiquement
CREATE OR REPLACE TRIGGER trg_groupes_maj_at
    BEFORE UPDATE ON groupes_etablissements
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_maj_at();

-- La fonction fn_update_maj_at devrait exister (créée par une migration précédente)
-- Si elle n'existe pas, la créer :
CREATE OR REPLACE FUNCTION fn_update_maj_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.maj_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- FIN DE LA MIGRATION
-- ==================================

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Migration 075: Module Groupes Établissements';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Tables créées:';
    RAISE NOTICE '  - groupes_etablissements';
    RAISE NOTICE '  - groupe_etablissement_liens';
    RAISE NOTICE '  - groupe_admins';
    RAISE NOTICE 'Permissions créées: 8';
    RAISE NOTICE 'Rôles configurés: SUPER_ADMIN, CHEF_ETABLISSEMENT, DIRECTEUR, DIRECTEUR_ADJOINT';
    RAISE NOTICE '==========================================';
END $$;
