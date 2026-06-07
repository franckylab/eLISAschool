/**
 * ==================================
 * eLISAschool - Migration 015 : Validation Workflow Établissement
 * ==================================
 * Version: 1.0.0
 *
 * Étend le système de validation workflow au module :
 * - ÉTABLISSEMENT (création + désactivation + réactivation)
 *
 * IDEMPOTENTE : peut être rejouée sans erreur
 */

-- ==================================
-- 1. NOUVELLES PERMISSIONS DE VALIDATION
-- ==================================

-- ÉTABLISSEMENT (2 niveaux)
INSERT INTO permissions (code, libelle, module, description)
VALUES
    ('validation:etablissement:level1', 'Validation établissement niveau 1', 'validation', 'Valider les créations/désactivations d''établissement (niveau 1)'),
    ('validation:etablissement:level2', 'Validation établissement niveau 2', 'validation', 'Valider les créations/désactivations d''établissement (niveau 2)')
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 2. ATTRIBUTION DES PERMISSIONS AUX RÔLES
-- ==================================

DO $$
DECLARE
    v_role_id UUID;
    v_perm_id UUID;

    FUNCTION get_role_id_etab(p_code VARCHAR) RETURNS UUID AS $fn$
        SELECT id FROM roles WHERE code = p_code;
    $fn$ LANGUAGE SQL STABLE;

BEGIN
    -- ADMIN : toutes les permissions (2)
    v_role_id := get_role_id_etab('ADMIN');
    IF v_role_id IS NOT NULL THEN
        FOR v_perm_id IN SELECT id FROM permissions WHERE code IN (
            'validation:etablissement:level1', 'validation:etablissement:level2'
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
-- 3. COLONNE STATUT POUR WORKFLOW
-- ==================================

-- ÉTABLISSEMENTS : ajouter colonne statut
ALTER TABLE etablissements ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'ACTIF';

-- Mettre à jour les établissements existants sans statut
UPDATE etablissements SET statut = CASE
    WHEN actif = true THEN 'ACTIF'
    ELSE 'INACTIF'
END WHERE statut IS NULL;

-- ==================================
-- 4. INDEX
-- ==================================

CREATE INDEX IF NOT EXISTS idx_etablissements_statut ON etablissements (statut);

-- ==================================
-- FIN MIGRATION 015
-- ==================================
