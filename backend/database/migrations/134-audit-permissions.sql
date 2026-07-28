/**
 * ==================================
 * eLISAschool - Migration 134
 * ==================================
 * Audit permissions — contrôle d'accès aux logs d'audit par module
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Crée 11 permissions audit:{module}:view + 1 permission globale audit:view
 * Attributions:
 *   - ADMIN: toutes (11 modules + audit:view global)
 *   - CHEF_ETABLISSEMENT: 6 modules (notes, bulletins, personnel, eleves, classes, organisation)
 *   - DIRECTEUR_ADJOINT: 4 modules (notes, bulletins, eleves, classes)
 */

BEGIN;

-- ==================================
-- 1. Permissions audit par module (11)
-- ==================================

INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES
    ('audit:notes:view', 'Consulter l''audit des notes', 'Voir l''historique des modifications du module notes', 'audit', 'view', true),
    ('audit:bulletins:view', 'Consulter l''audit des bulletins', 'Voir l''historique des modifications du module bulletins', 'audit', 'view', true),
    ('audit:personnel:view', 'Consulter l''audit du personnel', 'Voir l''historique des modifications du module personnel', 'audit', 'view', true),
    ('audit:contrats:view', 'Consulter l''audit des contrats', 'Voir l''historique des modifications du module contrats', 'audit', 'view', true),
    ('audit:paie:view', 'Consulter l''audit de la paie', 'Voir l''historique des modifications du module paie', 'audit', 'view', true),
    ('audit:eleves:view', 'Consulter l''audit des élèves', 'Voir l''historique des modifications du module élèves', 'audit', 'view', true),
    ('audit:classes:view', 'Consulter l''audit des classes', 'Voir l''historique des modifications du module classes', 'audit', 'view', true),
    ('audit:matieres:view', 'Consulter l''audit des matières', 'Voir l''historique des modifications du module matières', 'audit', 'view', true),
    ('audit:periodes:view', 'Consulter l''audit des périodes', 'Voir l''historique des modifications du module périodes', 'audit', 'view', true),
    ('audit:emploi-du-temps:view', 'Consulter l''audit de l''emploi du temps', 'Voir l''historique des modifications du module emploi du temps', 'audit', 'view', true),
    ('audit:organisation:view', 'Consulter l''audit de l''organisation', 'Voir l''historique des modifications du module organisation', 'audit', 'view', true)
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 2. Permission globale audit:view
-- ==================================

INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES (
    'audit:view',
    'Consulter tous les audits',
    'Accès global à tous les logs d''audit (tous modules)',
    'audit',
    'view',
    true
)
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 3. Attributions — ADMIN (toutes permissions)
-- ==================================

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN (
      'audit:notes:view',
      'audit:bulletins:view',
      'audit:personnel:view',
      'audit:contrats:view',
      'audit:paie:view',
      'audit:eleves:view',
      'audit:classes:view',
      'audit:matieres:view',
      'audit:periodes:view',
      'audit:emploi-du-temps:view',
      'audit:organisation:view',
      'audit:view'
  )
ON CONFLICT DO NOTHING;

-- ==================================
-- 4. Attributions — CHEF_ETABLISSEMENT (6 modules)
-- ==================================

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
  AND p.code IN (
      'audit:notes:view',
      'audit:bulletins:view',
      'audit:personnel:view',
      'audit:eleves:view',
      'audit:classes:view',
      'audit:organisation:view'
  )
ON CONFLICT DO NOTHING;

-- ==================================
-- 5. Attributions — DIRECTEUR_ADJOINT (4 modules)
-- ==================================

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'DIRECTEUR_ADJOINT'
  AND p.code IN (
      'audit:notes:view',
      'audit:bulletins:view',
      'audit:eleves:view',
      'audit:classes:view'
  )
ON CONFLICT DO NOTHING;

COMMIT;
