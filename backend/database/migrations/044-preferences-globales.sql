-- ==================================
-- eLISAschool - Migration préférences globales par établissement
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-02-09
-- ==================================

-- ==================================
-- ÉTAPE 1 : Création de la table
-- ==================================

CREATE TABLE IF NOT EXISTS preferences_globales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etablissement_id UUID NOT NULL,
    cle VARCHAR(100) NOT NULL,
    valeur TEXT NOT NULL,
    type_valeur VARCHAR(20) DEFAULT 'string' CHECK (type_valeur IN ('string', 'number', 'boolean', 'json')),
    categorie VARCHAR(30) NOT NULL,
    libelle VARCHAR(200) NOT NULL,
    description TEXT,
    est_modifiable_par_utilisateur BOOLEAN DEFAULT true,
    ordre INT DEFAULT 0,
    metadata JSONB,
    modifie_par UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(etablissement_id, cle)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_pref_globales_etablissement ON preferences_globales(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_pref_globales_categorie ON preferences_globales(categorie);
CREATE INDEX IF NOT EXISTS idx_pref_globales_cle ON preferences_globales(cle);

-- ==================================
-- ÉTAPE 2 : Données seeds - Thèmes par défaut
-- ==================================

INSERT INTO preferences_globales (cle, valeur, type_valeur, categorie, libelle, description, est_modifiable_par_utilisateur, ordre)
VALUES
    -- Affichage
    ('theme', 'default', 'string', 'affichage', 'Thème par défaut', 'Thème appliqué à tous les utilisateurs', true, 1),
    ('langue', 'fr', 'string', 'langue', 'Langue par défaut', 'Langue de l''interface', true, 2),
    ('items_par_page', '20', 'number', 'affichage', 'Éléments par page', 'Nombre d''éléments affichés dans les listes', true, 3),
    ('compact_mode', 'false', 'boolean', 'affichage', 'Mode compact', 'Réduire l''espacement dans l''interface', true, 4),
    
    -- Notifications
    ('notifications.email', 'true', 'boolean', 'notifications', 'Notifications email', 'Activer les notifications par email par défaut', true, 10),
    ('notifications.sms', 'false', 'boolean', 'notifications', 'Notifications SMS', 'Activer les notifications SMS par défaut', true, 11),
    ('notifications.push', 'false', 'boolean', 'notifications', 'Notifications Push', 'Activer les notifications push par défaut', true, 12),
    ('notifications.rappel_paiement', 'true', 'boolean', 'notifications', 'Rappels de paiement', 'Envoyer des rappels automatiques', true, 13),
    ('notifications.rappel_paiement_jours', '3', 'number', 'notifications', 'Jours avant rappel', 'Nombre de jours avant d''envoyer un rappel', true, 14),
    
    -- Sécurité
    ('security.mfa_enabled', 'false', 'boolean', 'securite', 'Authentification multi-facteurs', 'Activer MFA pour tous les utilisateurs', false, 20),
    ('security.session_timeout', '30', 'number', 'securite', 'Timeout session (minutes)', 'Durée d''inactivité avant déconnexion', false, 21),
    ('security.password_min_length', '8', 'number', 'securite', 'Longueur minimale mot de passe', 'Nombre de caractères minimum', false, 22),
    ('security.password_require_special', 'true', 'boolean', 'securite', 'Caractère spécial requis', 'Exiger un caractère spécial dans le mot de passe', false, 23),
    ('security.max_login_attempts', '5', 'number', 'securite', 'Tentatives de connexion max', 'Nombre de tentatives avant blocage', false, 24),
    
    -- Accessibilité
    ('accessibility.high_contrast', 'false', 'boolean', 'accessibilite', 'Contraste élevé', 'Activer le mode contraste élevé', true, 30),
    ('accessibility.font_size', 'medium', 'string', 'accessibilite', 'Taille de police', 'Small, medium, large, xlarge', true, 31),
    
    -- Personnalisation
    ('logo_url', '', 'string', 'personnalisation', 'URL du logo', 'Logo personnalisé de l''établissement', true, 40),
    ('couleur_primaire', '#1E40AF', 'string', 'personnalisation', 'Couleur primaire', 'Couleur principale de l''interface', true, 41)

ON CONFLICT (cle) DO NOTHING;

-- ==================================
-- ÉTAPE 3 : Vérification
-- ==================================

SELECT cle, libelle, categorie, valeur
FROM preferences_globales
ORDER BY categorie, ordre;

-- ==================================
-- FIN MIGRATION
-- ==================================
