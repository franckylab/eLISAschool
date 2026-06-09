-- ==================================
-- eLISAschool - Migration Notification Providers
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- 
-- Crée la table notification_providers pour gérer les providers de notifications
-- Permet d'ajouter, configurer, activer/désactiver des providers dynamiquement

-- ==================================
-- Table: notification_providers
-- ==================================

CREATE TABLE IF NOT EXISTS notification_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PUSH', 'EMAIL', 'IN_APP', 'SMS')),
    service VARCHAR(50) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT true,
    est_defaut BOOLEAN NOT NULL DEFAULT false,
    configuration JSONB NOT NULL,
    quota_journalier INTEGER NOT NULL DEFAULT 0,
    quota_utilise INTEGER NOT NULL DEFAULT 0,
    priorite INTEGER NOT NULL DEFAULT 1,
    etablissement_id UUID,
    description TEXT,
    derniere_erreur_at TIMESTAMP,
    dernier_message_erreur TEXT,
    erreurs_consecutives INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==================================
-- Index
-- ==================================

CREATE INDEX idx_notification_providers_type_actif 
    ON notification_providers(type, actif);

CREATE INDEX idx_notification_providers_etablissement 
    ON notification_providers(etablissement_id);

CREATE INDEX idx_notification_providers_est_defaut 
    ON notification_providers(est_defaut);

-- ==================================
-- Trigger pour updated_at
-- ==================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_providers_updated_at
    BEFORE UPDATE ON notification_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================================
-- Données initiales : In-App provider (toujours actif)
-- ==================================

INSERT INTO notification_providers (
    nom, 
    type, 
    service, 
    actif, 
    est_defaut, 
    configuration, 
    quota_journalier, 
    priorite,
    description
) VALUES (
    'in-app-default',
    'IN_APP',
    'in-app',
    true,
    true,
    '{}',
    0,
    1,
    'Provider in-app par défaut (stockage en base)'
) ON CONFLICT DO NOTHING;

-- ==================================
-- Commentaires
-- ==================================

COMMENT ON TABLE notification_providers IS 'Providers de notifications configurables (SMTP, Firebase, Twilio, etc.)';
COMMENT ON COLUMN notification_providers.type IS 'Type de notification: PUSH, EMAIL, IN_APP, SMS';
COMMENT ON COLUMN notification_providers.service IS 'Service utilisé: nodemailer, firebase-fcm, twilio, etc.';
COMMENT ON COLUMN notification_providers.configuration IS 'Configuration JSON spécifique au service (credentials, paramètres)';
COMMENT ON COLUMN notification_providers.quota_journalier IS 'Quota journalier (0 = illimité)';
COMMENT ON COLUMN notification_providers.priorite IS 'Priorité pour fallback (1 = primaire, 2 = secondaire)';
COMMENT ON COLUMN notification_providers.erreurs_consecutives IS 'Compteur d''erreurs consécutives pour monitoring';

-- ==================================
-- Exemples de configuration pour documentation
-- ==================================

-- Email (Nodemailer/SMTP):
-- {
--   "host": "smtp.example.com",
--   "port": 587,
--   "secure": false,
--   "user": "noreply@elisaschool.cm",
--   "password": "secret",
--   "from_email": "noreply@elisaschool.cm",
--   "from_name": "eLISAschool",
--   "tls_reject_unauthorized": true
-- }

-- Push (Firebase FCM):
-- {
--   "project_id": "my-project-id",
--   "server_key": "AAAA...",
--   "vapid_key": "BNc...",
--   "credentials": { ... service account JSON ... }
-- }

-- SMS (Twilio):
-- {
--   "account_sid": "AC...",
--   "auth_token": "secret",
--   "from_number": "+1234567890"
-- }
