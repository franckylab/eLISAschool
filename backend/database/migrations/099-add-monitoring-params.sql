-- ==================================
-- eLISAschool - Migration Paramètres Module Monitoring
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Description: Paramètres de configuration pour le module monitoring
-- ==================================

-- Paramètres du module monitoring
INSERT INTO parametres (cle, valeur, type, description, categorie, actif, created_at, updated_at) VALUES
('monitoring.actif', 'true', 'BOOLEAN', 'Module monitoring activé', 'MONITORING', TRUE, NOW(), NOW()),
('monitoring.health_check_interval', '60', 'NUMBER', 'Intervalle health check (secondes)', 'MONITORING', TRUE, NOW(), NOW()),
('monitoring.metrics_retention_days', '30', 'NUMBER', 'Rétention des métriques (jours)', 'MONITORING', TRUE, NOW(), NOW()),
('monitoring.backup_alert_threshold', '86400', 'NUMBER', 'Seuil alerte backup sans maj (secondes, 24h)', 'MONITORING', TRUE, NOW(), NOW()),
('monitoring.maintenance_mode', 'false', 'BOOLEAN', 'Mode maintenance activé', 'MONITORING', TRUE, NOW(), NOW()),
('monitoring.log_retention_days', '90', 'NUMBER', 'Rétention des logs (jours)', 'MONITORING', TRUE, NOW(), NOW()),
('monitoring.cpu_alert_threshold', '90', 'NUMBER', 'Seuil alerte CPU (%)', 'MONITORING', TRUE, NOW(), NOW()),
('monitoring.memory_alert_threshold', '85', 'NUMBER', 'Seuil alerte mémoire (%)', 'MONITORING', TRUE, NOW(), NOW()),
('monitoring.disk_alert_threshold', '90', 'NUMBER', 'Seuil alerte disque (%)', 'MONITORING', TRUE, NOW(), NOW())
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW();

-- Vérification
SELECT cle, valeur, type, description 
FROM parametres 
WHERE cle LIKE 'monitoring.%'
ORDER BY cle;
