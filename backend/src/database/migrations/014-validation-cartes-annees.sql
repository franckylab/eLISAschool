/**
 * ==================================
 * eLISAschool - Migration 014 : Validation Workflow Cartes & Années Scolaires
 * ==================================
 * Version: 1.0.0
 *
 * Étend le système de validation workflow aux modules :
 * - CARTES (demandes + renouvellements)
 * - ANNÉES SCOLAIRES (création + clôture)
 *
 * IDEMPOTENTE : peut être rejouée sans erreur
 */

-- ==================================
-- 1. NOUVELLES PERMISSIONS DE VALIDATION
-- ==================================

-- CARTES (2 niveaux)
INSERT INTO permissions (code, libelle, module, description)
VALUES
    ('validation:cartes:level1', 'Validation cartes niveau 1', 'validation', 'Valider les demandes de carte (niveau 1)'),
    ('validation:cartes:level2', 'Validation cartes niveau 2', 'validation', 'Valider les demandes de carte (niveau 2)')
ON CONFLICT (code) DO NOTHING;

-- ANNÉES SCOLAIRES (2 niveaux)
INSERT INTO permissions (code, libelle, module, description)
VALUES
    ('validation:annees_scolaires:level1', 'Validation années scolaires niveau 1', 'validation', 'Valider les années scolaires (niveau 1)'),
    ('validation:annees_scolaires:level2', 'Validation années scolaires niveau 2', 'validation', 'Valider les années scolaires (niveau 2)')
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 2. ATTRIBUTION DES PERMISSIONS AUX RÔLES
-- ==================================

-- Fonction helper pour récupérer un rôle par code
DO $$
DECLARE
    v_role_id UUID;
    v_perm_id UUID;

    -- Helper: récupérer ID rôle
    FUNCTION get_role_id_cartes(p_code VARCHAR) RETURNS UUID AS $fn$
        SELECT id FROM roles WHERE code = p_code;
    $fn$ LANGUAGE SQL STABLE;

BEGIN
    -- ADMIN : toutes les permissions (4)
    v_role_id := get_role_id_cartes('ADMIN');
    IF v_role_id IS NOT NULL THEN
        FOR v_perm_id IN SELECT id FROM permissions WHERE code IN (
            'validation:cartes:level1', 'validation:cartes:level2',
            'validation:annees_scolaires:level1', 'validation:annees_scolaires:level2'
        )
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT v_role_id, v_perm_id
            WHERE NOT EXISTS (
                SELECT 1 FROM role_permissions WHERE role_id = v_role_id AND permission_id = v_perm_id
            );
        END LOOP;
    END IF;

    -- CHEF_ETABLISSEMENT : toutes les permissions (4)
    v_role_id := get_role_id_cartes('CHEF_ETABLISSEMENT');
    IF v_role_id IS NOT NULL THEN
        FOR v_perm_id IN SELECT id FROM permissions WHERE code IN (
            'validation:cartes:level1', 'validation:cartes:level2',
            'validation:annees_scolaires:level1', 'validation:annees_scolaires:level2'
        )
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT v_role_id, v_perm_id
            WHERE NOT EXISTS (
                SELECT 1 FROM role_permissions WHERE role_id = v_role_id AND permission_id = v_perm_id
            );
        END LOOP;
    END IF;
END $$;

-- ==================================
-- 3. COLONNES STATUT POUR WORKFLOW
-- ==================================

-- CARTES : convertir enum statut en varchar(30) pour supporter EN_ATTENTE_VALIDATION
ALTER TABLE cartes ALTER COLUMN statut TYPE VARCHAR(30) USING statut::text;
ALTER TABLE cartes ALTER COLUMN statut SET DEFAULT 'ACTIVE';

-- ANNÉES SCOLAIRES : ajouter colonne statut
ALTER TABLE annees_scolaires ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'OUVERTE';

-- Mettre à jour les années existantes sans statut
UPDATE annees_scolaires SET statut = CASE
    WHEN "cloturee" = true THEN 'CLOTUREE'
    WHEN "enCours" = true THEN 'EN_COURS'
    ELSE 'OUVERTE'
END WHERE statut IS NULL;

-- ==================================
-- 4. INDEX
-- ==================================

CREATE INDEX IF NOT EXISTS idx_cartes_statut ON cartes (statut);
CREATE INDEX IF NOT EXISTS idx_annees_scolaires_statut ON annees_scolaires (statut);

-- ==================================
-- FIN MIGRATION 014
-- ==================================
