-- eLISAschool - Module Personnel/RH
-- Migration Phase 5: Dashboard & Statistiques

-- Permissions RH pour le dashboard
INSERT INTO permissions (id, code, label, module, description, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'rh_dashboard:view', 'Voir le dashboard RH', 'personnel', 'Consulter les statistiques et le dashboard RH', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Paramètre de configuration pour le cache du dashboard
INSERT INTO parametres_configurations (id, cle, valeur, type, categorie, label, description, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'personnel.dashboard_cache_ttl',
    '300',
    'number',
    'personnel',
    'Cache du dashboard (secondes)',
    'Durée de vie du cache du dashboard RH en secondes (300 = 5 minutes)',
    NOW(),
    NOW()
) ON CONFLICT (cle) DO NOTHING;
