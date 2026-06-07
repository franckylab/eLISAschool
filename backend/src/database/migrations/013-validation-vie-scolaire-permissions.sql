/**
 * ==================================
 * eLISAschool - Migration 013 : Validation Workflow Vie Scolaire
 * ==================================
 * Version: 1.0.0
 *
 * Étend le système de validation workflow aux modules :
 * - ÉLÈVES (inscriptions)
 * - PERSONNEL (embauches)
 * - CLUBS (création + inscriptions)
 * - MATÉRIEL (acquisition + prêts)
 *
 * IDEMPOTENTE : peut être rejouée sans erreur
 */

-- ==================================
-- 1. NOUVELLES PERMISSIONS DE VALIDATION
-- ==================================

-- ÉLÈVES (3 niveaux)
INSERT INTO permissions (code, libelle, module, description)
VALUES
    ('validation:eleves:level1', 'Validation élèves niveau 1', 'validation', 'Valider les inscriptions élèves (niveau 1)'),
    ('validation:eleves:level2', 'Validation élèves niveau 2', 'validation', 'Valider les inscriptions élèves (niveau 2)'),
    ('validation:eleves:level3', 'Validation élèves niveau 3', 'validation', 'Valider les inscriptions élèves (niveau 3)')
ON CONFLICT (code) DO NOTHING;

-- PERSONNEL (2 niveaux)
INSERT INTO permissions (code, libelle, module, description)
VALUES
    ('validation:personnel:level1', 'Validation personnel niveau 1', 'validation', 'Valider les embauches personnel (niveau 1)'),
    ('validation:personnel:level2', 'Validation personnel niveau 2', 'validation', 'Valider les embauches personnel (niveau 2)')
ON CONFLICT (code) DO NOTHING;

-- CLUBS (3 niveaux)
INSERT INTO permissions (code, libelle, module, description)
VALUES
    ('validation:clubs:level1', 'Validation clubs niveau 1', 'validation', 'Valider la création/inscription clubs (niveau 1)'),
    ('validation:clubs:level2', 'Validation clubs niveau 2', 'validation', 'Valider la création/inscription clubs (niveau 2)'),
    ('validation:clubs:level3', 'Validation clubs niveau 3', 'validation', 'Valider la création/inscription clubs (niveau 3)')
ON CONFLICT (code) DO NOTHING;

-- MATÉRIEL (2 niveaux)
INSERT INTO permissions (code, libelle, module, description)
VALUES
    ('validation:materiel:level1', 'Validation matériel niveau 1', 'validation', 'Valider les acquisitions/prêts matériel (niveau 1)'),
    ('validation:materiel:level2', 'Validation matériel niveau 2', 'validation', 'Valider les acquisitions/prêts matériel (niveau 2)')
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 2. ATTRIBUTION DES PERMISSIONS AUX RÔLES
-- ==================================

-- Helper: récupérer l'ID d'un rôle par son code
CREATE OR REPLACE FUNCTION get_role_id_vie(code TEXT) RETURNS UUID AS $$
    SELECT id FROM roles WHERE code = $1 LIMIT 1;
$$ LANGUAGE SQL;

-- ADMIN : toutes les nouvelles permissions (10)
INSERT INTO role_permissions (role_id, permission_id)
SELECT get_role_id_vie('ADMIN'), p.id
FROM permissions p
WHERE p.code IN (
    'validation:eleves:level1', 'validation:eleves:level2', 'validation:eleves:level3',
    'validation:personnel:level1', 'validation:personnel:level2',
    'validation:clubs:level1', 'validation:clubs:level2', 'validation:clubs:level3',
    'validation:materiel:level1', 'validation:materiel:level2'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = get_role_id_vie('ADMIN') AND rp.permission_id = p.id
);

-- CHEF_ETABLISSEMENT : niveaux 2-3 (eleves, clubs) + niveaux 1-2 (personnel, materiel)
INSERT INTO role_permissions (role_id, permission_id)
SELECT get_role_id_vie('CHEF_ETABLISSEMENT'), p.id
FROM permissions p
WHERE p.code IN (
    'validation:eleves:level2', 'validation:eleves:level3',
    'validation:personnel:level1', 'validation:personnel:level2',
    'validation:clubs:level2', 'validation:clubs:level3',
    'validation:materiel:level1', 'validation:materiel:level2'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = get_role_id_vie('CHEF_ETABLISSEMENT') AND rp.permission_id = p.id
);

-- ENSEIGNANT : niveau 1 (eleves seulement)
INSERT INTO role_permissions (role_id, permission_id)
SELECT get_role_id_vie('ENSEIGNANT'), p.id
FROM permissions p
WHERE p.code IN (
    'validation:eleves:level1'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = get_role_id_vie('ENSEIGNANT') AND rp.permission_id = p.id
);

-- PERSONNEL : niveau 1 (eleves + materiel)
INSERT INTO role_permissions (role_id, permission_id)
SELECT get_role_id_vie('PERSONNEL'), p.id
FROM permissions p
WHERE p.code IN (
    'validation:eleves:level1',
    'validation:materiel:level1'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = get_role_id_vie('PERSONNEL') AND rp.permission_id = p.id
);

-- ==================================
-- 3. COLONNES STATUT POUR WORKFLOW
-- ==================================

-- ÉLÈVES : changer le type enum en varchar(30) pour supporter EN_ATTENTE_VALIDATION
-- Note : si la colonne est déjà en enum PostgreSQL, on doit la convertir
DO $$
BEGIN
    -- Vérifier si la colonne est encore un type enum (pas varchar)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'eleves'
        AND column_name = 'statut'
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE eleves ALTER COLUMN statut TYPE VARCHAR(30)
        USING statut::text;
    END IF;

    -- Ajouter EN_ATTENTE_VALIDATION aux valeurs possibles si pas déjà fait
    IF NOT EXISTS (
        SELECT 1 FROM eleves WHERE statut = 'EN_ATTENTE_VALIDATION' LIMIT 1
    ) THEN
        -- La valeur est maintenant possible dans varchar(30)
        NULL;
    END IF;
END $$;

-- Valeur par défaut pour les enregistrements existants
UPDATE eleves SET statut = 'ACTIF' WHERE statut IS NULL;

-- PERSONNEL : changer le type enum en varchar(30)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'membres_personnel'
        AND column_name = 'statut'
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE membres_personnel ALTER COLUMN statut TYPE VARCHAR(30)
        USING statut::text;
    END IF;
END $$;

UPDATE membres_personnel SET statut = 'ACTIF' WHERE statut IS NULL;

-- CLUBS : ajouter la colonne statut si elle n'existe pas
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'ACTIF';
UPDATE clubs SET statut = 'ACTIF' WHERE statut IS NULL;

-- MATÉRIEL : ajouter la colonne statut si elle n'existe pas
ALTER TABLE materiels ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'DISPONIBLE';
UPDATE materiels SET statut = 'DISPONIBLE' WHERE statut IS NULL;

-- PRÊTS MATÉRIEL : ajouter la colonne statut si elle n'existe pas
ALTER TABLE prets_materiels ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'EN_COURS';
UPDATE prets_materiels SET statut = 'EN_COURS' WHERE statut IS NULL;

-- ==================================
-- 4. INDEX SUR LES COLONNES STATUT
-- ==================================

CREATE INDEX IF NOT EXISTS idx_eleves_statut ON eleves (statut);
CREATE INDEX IF NOT EXISTS idx_membres_personnel_statut ON membres_personnel (statut);
CREATE INDEX IF NOT EXISTS idx_clubs_statut ON clubs (statut);
CREATE INDEX IF NOT EXISTS idx_materiels_statut ON materiels (statut);
CREATE INDEX IF NOT EXISTS idx_prets_materiels_statut ON prets_materiels (statut);

-- ==================================
-- 5. NETTOYAGE
-- ==================================

DROP FUNCTION IF EXISTS get_role_id_vie(TEXT);

-- ==================================
-- RÉSUMÉ
-- ==================================
-- ✅ 10 nouvelles permissions de validation (eleves×3, personnel×2, clubs×3, materiel×2)
-- ✅ Attribution aux rôles : ADMIN (toutes), CHEF (niveaux 2-3), ENSEIGNANT (eleves L1), PERSONNEL (eleves L1 + materiel L1)
-- ✅ Colonnes statut ajoutées/migrées : eleves, membres_personnel, clubs, materiels, prets_materiels
-- ✅ Index créés sur les colonnes statut
