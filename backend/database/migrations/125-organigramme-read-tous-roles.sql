-- =============================================
-- Migration 125 : organigramme:read pour tous les rôles
-- =============================================
-- Contexte :
--   - Nouvelle permission granulaire `organisation:organigramme:read`.
--   - Décision RBAC : l'organigramme est consultable par TOUTE la communauté
--     scolaire (enseignants, élèves, parents, personnel…) sans donner accès
--     au reste du module organisation.
--   - Rôles intermédiaires CENSEUR et COORDINATEUR_DISCIPLINE : lecture
--     complète du module organisation (unites/postes/fonctions/hierarchie).
-- Idempotente : ON CONFLICT DO NOTHING / NOT EXISTS partout.
-- =============================================

BEGIN;

-- =============================================
-- ÉTAPE 1 : Créer la permission organisation:organigramme:read
-- =============================================
INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES (
    'organisation:organigramme:read',
    'Consulter l''organigramme',
    'Visualiser l''organigramme de l''établissement (lecture seule)',
    'organisation',
    'read',
    true
)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- ÉTAPE 2 : Attribuer organisation:organigramme:read à TOUS les rôles
-- =============================================
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE p.code = 'organisation:organigramme:read'
ON CONFLICT DO NOTHING;

-- =============================================
-- ÉTAPE 3 : Lecture organisation pour les rôles intermédiaires
--           CENSEUR (discipline & organisation)
--           COORDINATEUR_DISCIPLINE (chef de département)
-- =============================================
INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('CENSEUR', 'COORDINATEUR_DISCIPLINE')
  AND p.code IN (
      'organisation:view',
      'organisation:unites:read',
      'organisation:postes:read',
      'organisation:fonctions:read',
      'organisation:hierarchie:read'
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================
-- Vérification (informative)
-- =============================================
SELECT p.code, COUNT(rp."roleId") AS nb_roles
FROM permissions p
LEFT JOIN role_permissions rp ON rp."permissionId" = p.id
WHERE p.code IN (
    'organisation:organigramme:read',
    'organisation:unites:read',
    'organisation:hierarchie:read'
)
GROUP BY p.code
ORDER BY p.code;
