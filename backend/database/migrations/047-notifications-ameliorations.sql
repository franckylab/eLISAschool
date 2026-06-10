-- ==================================
-- eLISAschool - Migration Notifications Améliorées
-- ==================================
-- Version: 2.0.0
-- Auteur: franck arlos chendjou
-- Description: Permissions RBAC, paramètres de configuration, monitoring
-- Date: 2026-06-09

-- ============================================
-- 1. PERMISSIONS RBAC NOTIFICATIONS
-- ============================================

-- Permissions pour les notifications
INSERT INTO permissions (code, libelle, module, action, description, actif, "createdAt", "updatedAt")
VALUES 
    ('notifications:create', 'Créer des notifications', 'notifications', 'create', 'Permission de créer des notifications individuelles', true, NOW(), NOW()),
    ('notifications:view', 'Voir les notifications', 'notifications', 'view', 'Permission de voir ses notifications', true, NOW(), NOW()),
    ('notifications:delete', 'Supprimer des notifications', 'notifications', 'delete', 'Permission de supprimer des notifications', true, NOW(), NOW()),
    ('notifications:send:bulk', 'Envoyer en masse', 'notifications', 'send:bulk', 'Permission d''envoyer des notifications en masse', true, NOW(), NOW()),
    ('notifications:templates:manage', 'Gérer les templates', 'notifications', 'templates:manage', 'Permission de gérer les templates de notifications', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Permissions pour les providers de notifications
INSERT INTO permissions (code, libelle, module, action, description, actif, "createdAt", "updatedAt")
VALUES 
    ('notification_providers:manage', 'Gérer les providers', 'notifications', 'providers:manage', 'Permission de créer/modifier/supprimer des providers', true, NOW(), NOW()),
    ('notification_providers:view', 'Voir les providers', 'notifications', 'providers:view', 'Permission de voir la liste des providers', true, NOW(), NOW()),
    ('notification_providers:test', 'Tester les providers', 'notifications', 'providers:test', 'Permission de tester la configuration des providers', true, NOW(), NOW()),
    ('notification_providers:toggle', 'Activer/désactiver providers', 'notifications', 'providers:toggle', 'Permission d''activer/désactiver les providers', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. ATTRIBUTION DES PERMISSIONS AUX RÔLES
-- ============================================

-- ADMIN et SUPER_ADMIN : Toutes les permissions
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
  AND p.code IN (
    'notifications:create', 'notifications:view', 'notifications:delete', 'notifications:send:bulk', 'notifications:templates:manage',
    'notification_providers:manage', 'notification_providers:view', 'notification_providers:test', 'notification_providers:toggle'
  )
ON CONFLICT (roleId, permissionId) DO NOTHING;

-- CHEF_ETABLISSEMENT : Voir et créer, voir providers
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CHEF_ETABLISSEMENT'
  AND p.code IN (
    'notifications:create', 'notifications:view', 'notifications:delete',
    'notification_providers:view'
  )
ON CONFLICT (roleId, permissionId) DO NOTHING;

-- CENSEUR : Créer et voir notifications (pour absences/retards)
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CENSEUR'
  AND p.code IN (
    'notifications:create', 'notifications:view'
  )
ON CONFLICT (roleId, permissionId) DO NOTHING;

-- ENSEIGNANT : Voir uniquement ses notifications
INSERT INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ENSEIGNANT'
  AND p.code = 'notifications:view'
ON CONFLICT (roleId, permissionId) DO NOTHING;

-- ============================================
-- 3. PARAMÈTRES DE CONFIGURATION NOTIFICATIONS
-- ============================================

-- Paramètres existants (vérification)
INSERT INTO parametres_configurations (cle, valeur, type, categorie, description, public, actif, "createdAt", "updatedAt")
VALUES 
    ('notifications.enable_push', 'true', 'boolean', 'notifications', 'Activer les notifications push', false, true, NOW(), NOW()),
    ('notifications.enable_email', 'true', 'boolean', 'notifications', 'Activer les notifications email', false, true, NOW(), NOW()),
    ('notifications.enable_sms', 'false', 'boolean', 'notifications', 'Activer les notifications SMS', false, true, NOW(), NOW()),
    ('notifications.default_channel', 'IN_APP', 'string', 'notifications', 'Canal de notification par défaut', false, true, NOW(), NOW())
ON CONFLICT (cle) DO NOTHING;

-- NOUVEAUX PARAMÈTRES : Quotas et limites
INSERT INTO parametres_configurations (cle, valeur, type, categorie, description, public, actif, "createdAt", "updatedAt")
VALUES 
    ('notifications.quota_email_journalier', '1000', 'number', 'notifications', 'Nombre maximum d''emails par jour (0 = illimité)', false, true, NOW(), NOW()),
    ('notifications.quota_sms_journalier', '500', 'number', 'notifications', 'Nombre maximum de SMS par jour (0 = illimité)', false, true, NOW(), NOW()),
    ('notifications.quota_push_journalier', '5000', 'number', 'notifications', 'Nombre maximum de notifications push par jour (0 = illimité)', false, true, NOW(), NOW()),
    ('notifications.max_destinataires_bulk', '500', 'number', 'notifications', 'Nombre maximum de destinataires par envoi en masse', false, true, NOW(), NOW())
ON CONFLICT (cle) DO NOTHING;

-- NOUVEAUX PARAMÈTRES : Délais et programmations
INSERT INTO parametres_configurations (cle, valeur, type, categorie, description, public, actif, "createdAt", "updatedAt")
VALUES 
    ('notifications.delai_relance_minutes', '30', 'number', 'notifications', 'Délai avant relance en cas d''échec (minutes)', false, true, NOW(), NOW()),
    ('notifications.heure_debut_envoi', '07:00', 'string', 'notifications', 'Heure minimale d''envoi des notifications', false, true, NOW(), NOW()),
    ('notifications.heure_fin_envoi', '22:00', 'string', 'notifications', 'Heure maximale d''envoi des notifications', false, true, NOW(), NOW())
ON CONFLICT (cle) DO NOTHING;

-- NOUVEAUX PARAMÈTRES : Templates et personnalisation
INSERT INTO parametres_configurations (cle, valeur, type, categorie, description, public, actif, "createdAt", "updatedAt")
VALUES 
    ('notifications.template_par_defaut', '', 'string', 'notifications', 'ID du template de notification par défaut', false, true, NOW(), NOW()),
    ('notifications.signature_email', 'eLISAschool - Système de Gestion Scolaire', 'string', 'notifications', 'Signature dans les emails', false, true, NOW(), NOW()),
    ('notifications.expediteur_par_defaut', 'noreply@elisaschool.cm', 'string', 'notifications', 'Expéditeur email par défaut', false, true, NOW(), NOW())
ON CONFLICT (cle) DO NOTHING;

-- NOUVEAUX PARAMÈTRES : Fallback et résilience
INSERT INTO parametres_configurations (cle, valeur, type, categorie, description, public, actif, "createdAt", "updatedAt")
VALUES 
    ('notifications.fallback_actif', 'true', 'boolean', 'notifications', 'Activer le fallback automatique entre providers', false, true, NOW(), NOW()),
    ('notifications.max_erreurs_avant_desactivation', '5', 'number', 'notifications', 'Nombre d''erreurs consécutives avant désactivation automatique', false, true, NOW(), NOW()),
    ('notifications.delai_cooldown_erreurs', '30', 'number', 'notifications', 'Délai de cooldown après erreur (minutes)', false, true, NOW(), NOW())
ON CONFLICT (cle) DO NOTHING;

-- NOUVEAUX PARAMÈTRES : Préférences utilisateurs
INSERT INTO parametres_configurations (cle, valeur, type, categorie, description, public, actif, "createdAt", "updatedAt")
VALUES 
    ('notifications.allow_user_preferences', 'true', 'boolean', 'notifications', 'Permettre aux utilisateurs de choisir leurs canaux préférés', false, true, NOW(), NOW()),
    ('notifications.digest_actif', 'false', 'boolean', 'notifications', 'Activer les notifications groupées (digest)', false, true, NOW(), NOW()),
    ('notifications.digest_frequence', 'daily', 'string', 'notifications', 'Fréquence du digest (hourly/daily/weekly)', false, true, NOW(), NOW())
ON CONFLICT (cle) DO NOTHING;

-- ============================================
-- 4. INDEXES DE PERFORMANCE
-- ============================================

-- Index pour optimiser les requêtes de providers
CREATE INDEX IF NOT EXISTS idx_notification_provider_type_actif 
ON notification_providers(type, actif, estDefaut);

CREATE INDEX IF NOT EXISTS idx_notification_provider_etablissement 
ON notification_providers(etablissementId) 
WHERE etablissementId IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_provider_priorite 
ON notification_providers(priorite ASC);

-- Index pour optimiser les requêtes de notifications
CREATE INDEX IF NOT EXISTS idx_notification_destinataire_statut 
ON notifications(destinataireId, statut, createdAt DESC);

CREATE INDEX IF NOT EXISTS idx_notification_type_categorie 
ON notifications(type, categorie);

CREATE INDEX IF NOT EXISTS idx_notification_expediteur 
ON notifications(expediteurId) 
WHERE expediteurId IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_programmee 
ON notifications(programmeePour, statut) 
WHERE programmeePour IS NOT NULL;

-- ============================================
-- 5. VUES DE MONITORING (optionnel)
-- ============================================

-- Vue pour le monitoring des providers
CREATE OR REPLACE VIEW v_monitoring_providers AS
SELECT 
    p.id,
    p.nom,
    p.type,
    p.service,
    p.actif,
    p.estDefaut,
    p.quotaJournalier,
    p.quotaUtilise,
    CASE 
        WHEN p.quotaJournalier = 0 THEN 0
        ELSE ROUND((p.quotaUtilise::numeric / p.quotaJournalier::numeric) * 100, 2)
    END AS quotaPourcentage,
    p.erreursConsecutives,
    p.derniereErreurAt,
    p.priorite,
    p.etablissementId,
    CASE 
        WHEN p.derniereErreurAt IS NULL THEN 'OK'
        WHEN p.erreursConsecutives >= 5 THEN 'CRITIQUE'
        WHEN p.erreursConsecutives >= 3 THEN 'ATTENTION'
        ELSE 'OK'
    END AS statut
FROM notification_providers p
WHERE p.actif = true;

-- Vue pour les statistiques de notifications
CREATE OR REPLACE VIEW v_stats_notifications_24h AS
SELECT 
    type,
    statut,
    COUNT(*) as nombre,
    COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '1 hour') as dernieres_1h,
    COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '24 hours') as dernieres_24h
FROM notifications
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY type, statut;

-- ============================================
-- 6. FONCTION UTILITAIRE : Reset quotas
-- ============================================

-- Fonction pour réinitialiser les quotas journaliers
CREATE OR REPLACE FUNCTION reset_quotas_notification_providers()
RETURNS void AS $$
BEGIN
    UPDATE notification_providers 
    SET quotaUtilise = 0 
    WHERE quotaJournalier > 0;
    
    RAISE NOTICE 'Quotas de notification réinitialisés';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. TRIGGER : Audit automatique
-- ============================================

-- Trigger pour journaliser automatiquement les modifications de providers
CREATE OR REPLACE FUNCTION audit_notification_provider_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (action, cible, cibleId, description, nouvellesValeurs, module, "createdAt")
        VALUES (
            'NOTIFICATION_PROVIDER_CREATE',
            'NotificationProvider',
            NEW.id,
            format('Création provider %s (%s)', NEW.nom, NEW.type),
            jsonb_build_object('nom', NEW.nom, 'type', NEW.type, 'service', NEW.service),
            'notifications',
            NOW()
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (action, cible, cibleId, description, anciennesValeurs, nouvellesValeurs, module, "createdAt")
        VALUES (
            'NOTIFICATION_PROVIDER_UPDATE',
            'NotificationProvider',
            NEW.id,
            format('Modification provider %s', NEW.nom),
            jsonb_build_object('actif', OLD.actif, 'estDefaut', OLD.estDefaut),
            jsonb_build_object('actif', NEW.actif, 'estDefaut', NEW.estDefaut),
            'notifications',
            NOW()
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (action, cible, cibleId, description, module, "createdAt")
        VALUES (
            'NOTIFICATION_PROVIDER_DELETE',
            'NotificationProvider',
            OLD.id,
            format('Suppression provider %s', OLD.nom),
            'notifications',
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger (si n'existe pas déjà)
DROP TRIGGER IF EXISTS trigger_audit_notification_provider ON notification_providers;
CREATE TRIGGER trigger_audit_notification_provider
    AFTER INSERT OR UPDATE OR DELETE ON notification_providers
    FOR EACH ROW
    EXECUTE FUNCTION audit_notification_provider_changes();

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

COMMENT ON VIEW v_monitoring_providers IS 'Vue de monitoring des providers de notifications actifs';
COMMENT ON VIEW v_stats_notifications_24h IS 'Statistiques des notifications des dernières 24h';
COMMENT ON FUNCTION reset_quotas_notification_providers() IS 'Réinitialise les quotas journaliers des providers';
