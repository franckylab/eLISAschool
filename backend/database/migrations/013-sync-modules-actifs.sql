-- ==================================
-- Migration 013: Synchronisation modulesActifs
-- ==================================
-- Réconcilie ConfigurationApp.modulesActifs avec EtablissementConfig.modulesActifs
-- Date: 2026-06-07
-- Description: Synchronise les modules actifs depuis la configuration legacy
--              vers la configuration multi-établissements

-- Synchroniser EtablissementConfig depuis ConfigurationApp pour les établissements sans config
UPDATE etablissement_config ec
SET modules_actifs = ca.modules_actifs
FROM configuration_app ca
WHERE (ec.modules_actifs IS NULL OR ec.modules_actifs = '{}')
  AND ca.modules_actifs IS NOT NULL
  AND ca.modules_actifs != '{}'
  AND ca.id = (SELECT id FROM configuration_app LIMIT 1);

-- Créer une config pour les établissements qui n'en ont pas
INSERT INTO etablissement_config (
    etablissement_id, 
    modules_actifs, 
    cycles_actifs,
    created_at, 
    updated_at
)
SELECT 
    e.id,
    ca.modules_actifs,
    '["COLLEGE", "LYCEE"]',
    NOW(),
    NOW()
FROM etablissements e
LEFT JOIN etablissement_config ec ON ec.etablissement_id = e.id
CROSS JOIN LATERAL (
    SELECT modules_actifs 
    FROM configuration_app 
    WHERE modules_actifs IS NOT NULL AND modules_actifs != '{}'
    LIMIT 1
) ca
WHERE ec.id IS NULL
  AND ca.modules_actifs IS NOT NULL;

-- Vérification : afficher les établissements avec leur config modules_actifs
SELECT 
    e.id,
    e.nom,
    ec.modules_actifs,
    CASE 
        WHEN ec.modules_actifs IS NULL OR ec.modules_actifs = '{}' THEN '❌ NON CONFIGURÉ'
        ELSE '✅ CONFIGURÉ'
    END AS statut
FROM etablissements e
LEFT JOIN etablissement_config ec ON ec.etablissement_id = e.id
ORDER BY e.nom;
