-- ====================================================
-- Migration: Attribution Permissions RH aux Rôles
-- Description: Attribue toutes les permissions RH aux rôles appropriés
-- Date: 2026-02-07
-- ====================================================

-- Attribution des permissions RH aux rôles ADMIN et SUPER_ADMIN (accès total)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
AND p.code IN (
    'rh_contrats:manage', 'rh_contrats:view', 'rh_contrats:validate',
    'rh_heures_cours:manage', 'rh_heures_cours:view',
    'rh_absences:manage', 'rh_absences:view', 'rh_absences:justifier',
    'rh_evaluations:manage', 'rh_evaluations:view',
    'rh_progressions:manage', 'rh_progressions:view',
    'rh_paie:manage', 'rh_paie:view', 'rh_paie:generer', 'rh_paie:valider',
    'rh_dashboard:view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Attribution des permissions RH au CHEF_ETABLISSEMENT (gestion courante, pas de paie)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
AND p.code IN (
    'rh_contrats:manage', 'rh_contrats:view',
    'rh_heures_cours:manage', 'rh_heures_cours:view',
    'rh_absences:manage', 'rh_absences:view', 'rh_absences:justifier',
    'rh_evaluations:manage', 'rh_evaluations:view',
    'rh_progressions:manage', 'rh_progressions:view',
    'rh_dashboard:view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Attribution des permissions au DIRECTEUR/PROVISEUR/PRINCIPAL (équivalent chef établissement)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code IN ('DIRECTEUR', 'PROVISEUR', 'PRINCIPAL')
AND p.code IN (
    'rh_contrats:view',
    'rh_heures_cours:view',
    'rh_absences:view',
    'rh_evaluations:view',
    'rh_progressions:view',
    'rh_dashboard:view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Attribution des permissions au RESPONSABLE_PEDAGOGIQUE (évaluations et progressions uniquement)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code = 'RESPONSABLE_PEDAGOGIQUE'
AND p.code IN (
    'rh_evaluations:manage', 'rh_evaluations:view',
    'rh_progressions:manage', 'rh_progressions:view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Attribution des permissions au CENSEUR (absences et heures de cours)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code = 'CENSEUR'
AND p.code IN (
    'rh_absences:manage', 'rh_absences:view', 'rh_absences:justifier',
    'rh_heures_cours:view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Attribution des permissions à l'INSPECTEUR_PEDAGOGIQUE et INSPECTEUR_GENERAL (lecture seule + dashboard)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code IN ('INSPECTEUR_PEDAGOGIQUE', 'INSPECTEUR_GENERAL')
AND p.code IN (
    'rh_evaluations:view',
    'rh_progressions:view',
    'rh_absences:view',
    'rh_dashboard:view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Attribution des permissions à l'ENSEIGNANT et PROFESSEUR_CERTIFIE (uniquement leurs propres données)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p
WHERE r.code IN ('ENSEIGNANT', 'PROFESSEUR_CERTIFIE')
AND p.code IN (
    'rh_heures_cours:view',
    'rh_absences:view'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Vérification du nombre de permissions attribuées
DO $$
DECLARE
    total_perms INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_perms 
    FROM role_permission rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE p.code LIKE 'rh_%';
    
    RAISE NOTICE 'Total permissions RH attribuées: %', total_perms;
END $$;

-- ====================================================
-- FIN Migration Attribution Permissions RH
-- ====================================================
