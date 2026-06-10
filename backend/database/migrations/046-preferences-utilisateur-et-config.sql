-- ============================================
-- eLISAschool - Migration Préférences Utilisateur & Améliorations Config
-- ============================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Description: Système complet de préférences utilisateur avec reset,
--              héritage config globale, et audit trail amélioré
-- ============================================

-- ============================================
-- 1. TABLE PRÉFÉRENCES UTILISATEUR
-- ============================================

CREATE TABLE IF NOT EXISTS preferences_utilisateur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    cle VARCHAR(100) NOT NULL,
    valeur TEXT NOT NULL,
    type_valeur VARCHAR(20) DEFAULT 'string',
    categorie VARCHAR(50) DEFAULT 'PERSONNALISATION',
    valeur_defaut TEXT,
    herite_global BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT uk_user_preference UNIQUE (utilisateur_id, cle)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_pref_user ON preferences_utilisateur(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_pref_categorie ON preferences_utilisateur(utilisateur_id, categorie);

-- ============================================
-- 2. AMÉLIORATION TABLE PARAMÈTRES SYSTÈME
-- ============================================

-- Ajouter colonne pour versioning
ALTER TABLE parametres_systeme 
ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;

-- Ajouter colonne pour historique des modifications
ALTER TABLE parametres_systeme 
ADD COLUMN IF NOT EXISTS dernier_modificateur_id UUID REFERENCES utilisateurs(id);

-- Ajouter colonne pour audit
ALTER TABLE parametres_systeme 
ADD COLUMN IF NOT EXISTS historique_modifications JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- 3. CRÉER VUES POUR CONFIGURATION
-- ============================================

-- Vue: Configuration globale active
CREATE OR REPLACE VIEW v_config_globale_active AS
SELECT 
    cle,
    valeur,
    type_valeur as "typeValeur",
    categorie,
    module,
    description,
    valeur_defaut as "valeurDefaut",
    modifiable_runtime as "modifiableRuntime",
    visible,
    ordre,
    version
FROM parametres_systeme
WHERE etablissement_id IS NULL
  AND visible = true
ORDER BY categorie, ordre;

-- Vue: Override par établissement
CREATE OR REPLACE VIEW v_config_etablissement_override AS
SELECT 
    ps.cle,
    ps.valeur as valeur_override,
    ps.etablissement_id as "etablissementId",
    e.nom as etablissement_nom,
    ps_global.valeur as valeur_globale,
    ps.type_valeur as "typeValeur",
    ps.categorie,
    ps.version,
    ps.updated_at as "updatedAt"
FROM parametres_systeme ps
INNER JOIN etablissements e ON e.id = ps.etablissement_id
LEFT JOIN parametres_systeme ps_global 
    ON ps_global.cle = ps.cle 
    AND ps_global.etablissement_id IS NULL
WHERE ps.etablissement_id IS NOT NULL
  AND ps.visible = true
ORDER BY ps.etablissement_id, ps.categorie;

-- ============================================
-- 4. CRÉER FONCTION POUR RESET PRÉFÉRENCES
-- ============================================

CREATE OR REPLACE FUNCTION reset_preferences_utilisateur(
    p_utilisateur_id UUID,
    p_categorie VARCHAR DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    IF p_categorie IS NULL THEN
        -- Supprimer TOUTES les préférences
        DELETE FROM preferences_utilisateur 
        WHERE utilisateur_id = p_utilisateur_id;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
    ELSE
        -- Supprimer par catégorie
        DELETE FROM preferences_utilisateur 
        WHERE utilisateur_id = p_utilisateur_id
          AND categorie = p_categorie;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CRÉER TRIGGER POUR AUDIT CONFIG
-- ============================================

-- Table audit configuration (si n'existe pas déjà)
CREATE TABLE IF NOT EXISTS audit_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, RESET
    cible VARCHAR(100) NOT NULL, -- cle du paramètre
    ancienne_valeur TEXT,
    nouvelle_valeur TEXT,
    utilisateur_id UUID REFERENCES utilisateurs(id),
    etablissement_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_config_action ON audit_configuration(action);
CREATE INDEX IF NOT EXISTS idx_audit_config_cible ON audit_configuration(cible);
CREATE INDEX IF NOT EXISTS idx_audit_config_user ON audit_configuration(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_audit_config_etablissement ON audit_configuration(etablissement_id);

-- ============================================
-- 6. INSÉRER PARAMÈTRES SYSTÈME PAR DÉFAUT
-- ============================================

-- Paramètres de sécurité améliorés
INSERT INTO parametres_systeme (cle, valeur, type_valeur, categorie, description, valeur_defaut, ordre, visible)
VALUES 
    ('securite.mdp_complexite_min', '8', 'number', 'SECURITE', 'Complexité minimale mot de passe', '8', 10, true),
    ('securite.mdp_expiration_jours', '90', 'number', 'SECURITE', 'Expiration mot de passe (jours)', '90', 11, true),
    ('securite.max_tentatives_connexion', '5', 'number', 'SECURITE', 'Max tentatives connexion avant blocage', '5', 12, true),
    ('securite.duree_blocage_minutes', '30', 'number', 'SECURITE', 'Durée blocage compte (minutes)', '30', 13, true),
    ('securite.timeout_session_minutes', '30', 'number', 'SECURITE', 'Timeout session inactivité', '30', 14, true),
    ('securite.double_auth_obligatoire', 'false', 'boolean', 'SECURITE', '2FA obligatoire pour tous', 'false', 15, true)
ON CONFLICT (cle) DO NOTHING;

-- Paramètres de notification
INSERT INTO parametres_systeme (cle, valeur, type_valeur, categorie, description, valeur_defaut, ordre, visible)
VALUES 
    ('notifications.email_actif', 'true', 'boolean', 'NOTIFICATION', 'Activer notifications email', 'true', 20, true),
    ('notifications.sms_actif', 'false', 'boolean', 'NOTIFICATION', 'Activer notifications SMS', 'false', 21, true),
    ('notifications.push_actif', 'true', 'boolean', 'NOTIFICATION', 'Activer notifications push', 'true', 22, true),
    ('notifications.digest_quotidien', 'false', 'boolean', 'NOTIFICATION', 'Envoyer digest quotidien', 'false', 23, true)
ON CONFLICT (cle) DO NOTHING;

-- Paramètres d'affichage
INSERT INTO parametres_systeme (cle, valeur, type_valeur, categorie, description, valeur_defaut, ordre, visible)
VALUES 
    ('affichage.theme_defaut', 'default', 'string', 'THEME', 'Thème par défaut', 'default', 30, true),
    ('affichage.langue_defaut', 'fr', 'string', 'REGIONAL', 'Langue par défaut', 'fr', 31, true),
    ('affichage.pagination_defaut', '20', 'number', 'AFFICHAGE', 'Items par page par défaut', '20', 32, true),
    ('affichage.fuseau_horaire', 'Africa/Douala', 'string', 'REGIONAL', 'Fuseau horaire', 'Africa/Douala', 33, true)
ON CONFLICT (cle) DO NOTHING;

-- Paramètres de performance
INSERT INTO parametres_systeme (cle, valeur, type_valeur, categorie, description, valeur_defaut, ordre, visible)
VALUES 
    ('performance.cache_ttl_secondes', '300', 'number', 'SYSTEME', 'TTL cache par défaut', '300', 40, false),
    ('performance.max_resultats_api', '100', 'number', 'SYSTEME', 'Max résultats API par requête', '100', 41, false),
    ('performance.timeout_requete_secondes', '30', 'number', 'SYSTEME', 'Timeout requêtes', '30', 42, false)
ON CONFLICT (cle) DO NOTHING;

-- ============================================
-- 7. SEED PRÉFÉRENCES PAR DÉFAUT (exemple)
-- ============================================

-- Note: Les préférences utilisateur sont créées dynamiquement
-- Ce script crée seulement la structure

-- ============================================
-- 8. COMMENTAIRES SUR LES TABLES
-- ============================================

COMMENT ON TABLE preferences_utilisateur IS 'Stocke les préférences individuelles des utilisateurs avec support de reset et héritage config globale';
COMMENT ON COLUMN preferences_utilisateur.herite_global IS 'True = utilise la valeur de la config globale, False = override utilisateur';
COMMENT ON COLUMN preferences_utilisateur.valeur_defaut IS 'Valeur par défaut du système pour référence';
COMMENT ON TABLE audit_configuration IS 'Journal d''audit pour toutes les modifications de configuration';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- Vérification
DO $$
BEGIN
    RAISE NOTICE '✅ Migration préférences utilisateur terminée';
    RAISE NOTICE '   - Table preferences_utilisateur créée';
    RAISE NOTICE '   - Audit configuration créé';
    RAISE NOTICE '   - Vues de configuration créées';
    RAISE NOTICE '   - Paramètres système par défaut insérés';
    RAISE NOTICE '   - Fonction reset_preferences_utilisateur créée';
END $$;
