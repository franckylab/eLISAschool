-- ==================================
-- Migration: Permissions Validation Académique
-- ==================================
-- Version: 1.0.0
-- Date: 2026-06-07
-- Description: Ajoute les permissions et colonnes statut pour le workflow
--              de validation des modules académiques (classes, matières, périodes)
-- ==================================

BEGIN;

-- ==================================
-- 1. INSÉRER LES NOUVELLES PERMISSIONS
-- ==================================

-- Permissions CLASSES (affectations élèves)
INSERT INTO permissions (code, description, module, actif, "createdAt")
VALUES 
    ('validation:classes:level1', 'Validation affectations élèves - Niveau 1 (Enseignant)', 'validation-workflow', true, NOW()),
    ('validation:classes:level2', 'Validation affectations élèves - Niveau 2 (Chef établissement)', 'validation-workflow', true, NOW()),
    ('validation:classes:level3', 'Validation affectations élèves - Niveau 3 (Admin)', 'validation-workflow', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- Permissions MATIÈRES (affectations enseignants et programmes)
INSERT INTO permissions (code, description, module, actif, "createdAt")
VALUES 
    ('validation:matieres:level1', 'Validation programmes/affectations - Niveau 1 (Enseignant)', 'validation-workflow', true, NOW()),
    ('validation:matieres:level2', 'Validation programmes/affectations - Niveau 2 (Chef établissement)', 'validation-workflow', true, NOW()),
    ('validation:matieres:level3', 'Validation programmes/affectations - Niveau 3 (Admin)', 'validation-workflow', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- Permissions PÉRIODES (clôture)
INSERT INTO permissions (code, description, module, actif, "createdAt")
VALUES 
    ('validation:periodes:level1', 'Validation clôture périodes - Niveau 1 (Chef établissement)', 'validation-workflow', true, NOW()),
    ('validation:periodes:level2', 'Validation clôture périodes - Niveau 2 (Admin)', 'validation-workflow', true, NOW())
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 2. ATTRIBUER LES PERMISSIONS AUX RÔLES
-- ==================================

-- Fonction helper pour récupérer un rôle par son nom
CREATE OR REPLACE FUNCTION get_role_id_acad(role_name VARCHAR)
RETURNS UUID AS $$
DECLARE role_id UUID;
BEGIN
    SELECT id INTO role_id FROM roles WHERE nom = role_name LIMIT 1;
    RETURN role_id;
END;
$$ LANGUAGE plpgsql;

-- ADMIN: Toutes les permissions académiques
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT get_role_id_acad('ADMIN'), id, NOW()
FROM permissions WHERE code IN (
    'validation:classes:level1', 'validation:classes:level2', 'validation:classes:level3',
    'validation:matieres:level1', 'validation:matieres:level2', 'validation:matieres:level3',
    'validation:periodes:level1', 'validation:periodes:level2'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp."roleId" = get_role_id_acad('ADMIN')
    AND rp."permissionId" = permissions.id
);

-- CHEF_ETABLISSEMENT: Niveaux 2 et 3 + périodes niveau 1
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT get_role_id_acad('CHEF_ETABLISSEMENT'), id, NOW()
FROM permissions WHERE code IN (
    'validation:classes:level2', 'validation:classes:level3',
    'validation:matieres:level2', 'validation:matieres:level3',
    'validation:periodes:level1', 'validation:periodes:level2'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp."roleId" = get_role_id_acad('CHEF_ETABLISSEMENT')
    AND rp."permissionId" = permissions.id
);

-- ENSEIGNANT: Niveau 1 seulement
INSERT INTO role_permissions ("roleId", "permissionId", "createdAt")
SELECT get_role_id_acad('ENSEIGNANT'), id, NOW()
FROM permissions WHERE code IN (
    'validation:classes:level1',
    'validation:matieres:level1'
)
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp."roleId" = get_role_id_acad('ENSEIGNANT')
    AND rp."permissionId" = permissions.id
);

-- ==================================
-- 3. AJOUTER LES COLONNES STATUT
-- ==================================

-- Table affectations_eleves: ajout colonne statut
ALTER TABLE affectations_eleves
ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'ACTIVE';

-- Mettre à jour les enregistrements existants
UPDATE affectations_eleves SET statut = 'ACTIVE' WHERE statut IS NULL;

-- Index sur statut pour les requêtes de workflow
CREATE INDEX IF NOT EXISTS idx_affectations_eleves_statut ON affectations_eleves(statut);

-- Table affectations_matieres: ajout colonne statut
ALTER TABLE affectations_matieres
ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'ACTIVE';

-- Mettre à jour les enregistrements existants
UPDATE affectations_matieres SET statut = 'ACTIVE' WHERE statut IS NULL;

-- Index sur statut pour les requêtes de workflow
CREATE INDEX IF NOT EXISTS idx_affectations_matieres_statut ON affectations_matieres(statut);

-- Table matieres_niveaux: ajout colonne statut
ALTER TABLE matieres_niveaux
ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'ACTIF';

-- Mettre à jour les enregistrements existants
UPDATE matieres_niveaux SET statut = 'ACTIF' WHERE statut IS NULL;

-- Index sur statut pour les requêtes de workflow
CREATE INDEX IF NOT EXISTS idx_matieres_niveaux_statut ON matieres_niveaux(statut);

-- Table periodes: ajout colonne statut
ALTER TABLE periodes
ADD COLUMN IF NOT EXISTS statut VARCHAR(30) DEFAULT 'OUVERTE';

-- Mettre à jour les enregistrements existants (CLOTUREE si cloturee=true, sinon OUVERTE)
UPDATE periodes SET statut = 'CLOTUREE' WHERE cloturee = true;
UPDATE periodes SET statut = 'OUVERTE' WHERE cloturee = false AND statut IS NULL;

-- Index sur statut pour les requêtes de workflow
CREATE INDEX IF NOT EXISTS idx_periodes_statut ON periodes(statut);

-- ==================================
-- 4. NETTOYAGE
-- ==================================

-- Supprimer la fonction helper temporaire
DROP FUNCTION IF EXISTS get_role_id_acad(VARCHAR);

COMMIT;

-- ==================================
-- NOTES DE MIGRATION
-- ==================================
-- - Cette migration est idempotente (peut être rejouée)
-- - Les colonnes statut sont ajoutées avec des valeurs par défaut
-- - Les permissions sont créées avec ON CONFLICT DO NOTHING
-- - Les attributions de rôles vérifient l'existence avant insertion
-- ==================================
