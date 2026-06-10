-- ==================================
-- eLISAschool - Migration préférences par rôle
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-02-09
-- ==================================

-- ==================================
-- ÉTAPE 1 : Création de la table
-- ==================================

CREATE TABLE IF NOT EXISTS preferences_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    cle VARCHAR(100) NOT NULL,
    valeur TEXT NOT NULL,
    type_valeur VARCHAR(20) DEFAULT 'string' CHECK (type_valeur IN ('string', 'number', 'boolean', 'json')),
    categorie VARCHAR(30) NOT NULL,
    est_modifiable_par_utilisateur BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(role_id, cle)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_pref_role_role ON preferences_role(role_id);
CREATE INDEX IF NOT EXISTS idx_pref_role_cle ON preferences_role(cle);

-- ==================================
-- ÉTAPE 2 : Seeds - Préférences par défaut par rôle
-- ==================================

-- ADMIN: Notifications complètes activées
INSERT INTO preferences_role (role_id, cle, valeur, type_valeur, categorie, est_modifiable_par_utilisateur, description)
SELECT 
    r.id,
    'notifications.email',
    'true',
    'boolean',
    'notifications',
    true,
    'Notifications email activées par défaut pour les admins'
FROM roles r
WHERE r.code = 'ADMIN'
ON CONFLICT (role_id, cle) DO NOTHING;

INSERT INTO preferences_role (role_id, cle, valeur, type_valeur, categorie, est_modifiable_par_utilisateur, description)
SELECT 
    r.id,
    'notifications.sms',
    'true',
    'boolean',
    'notifications',
    true,
    'Notifications SMS activées par défaut pour les admins'
FROM roles r
WHERE r.code = 'ADMIN'
ON CONFLICT (role_id, cle) DO NOTHING;

-- ENSEIGNANT: Thème sombre par défaut
INSERT INTO preferences_role (role_id, cle, valeur, type_valeur, categorie, est_modifiable_par_utilisateur, description)
SELECT 
    r.id,
    'theme',
    'dark',
    'string',
    'affichage',
    true,
    'Thème sombre par défaut pour les enseignants'
FROM roles r
WHERE r.code = 'ENSEIGNANT'
ON CONFLICT (role_id, cle) DO NOTHING;

-- ELEVE: Mode compact activé
INSERT INTO preferences_role (role_id, cle, valeur, type_valeur, categorie, est_modifiable_par_utilisateur, description)
SELECT 
    r.id,
    'compact_mode',
    'true',
    'boolean',
    'affichage',
    true,
    'Mode compact par défaut pour les élèves'
FROM roles r
WHERE r.code = 'ELEVE'
ON CONFLICT (role_id, cle) DO NOTHING;

-- PARENT: Rappels de paiement activés
INSERT INTO preferences_role (role_id, cle, valeur, type_valeur, categorie, est_modifiable_par_utilisateur, description)
SELECT 
    r.id,
    'notifications.rappel_paiement',
    'true',
    'boolean',
    'notifications',
    false,
    'Rappels de paiement obligatoires pour les parents'
FROM roles r
WHERE r.code = 'PARENT'
ON CONFLICT (role_id, cle) DO NOTHING;

-- SUPER_ADMIN: Sécurité renforcée
INSERT INTO preferences_role (role_id, cle, valeur, type_valeur, categorie, est_modifiable_par_utilisateur, description)
SELECT 
    r.id,
    'security.mfa_enabled',
    'true',
    'boolean',
    'securite',
    false,
    'MFA obligatoire pour les super admins'
FROM roles r
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT (role_id, cle) DO NOTHING;

INSERT INTO preferences_role (role_id, cle, valeur, type_valeur, categorie, est_modifiable_par_utilisateur, description)
SELECT 
    r.id,
    'security.session_timeout',
    '15',
    'number',
    'securite',
    false,
    'Timeout session court (15 min) pour les super admins'
FROM roles r
WHERE r.code = 'SUPER_ADMIN'
ON CONFLICT (role_id, cle) DO NOTHING;

-- ==================================
-- ÉTAPE 3 : Vérification
-- ==================================

SELECT 
    r.code AS role,
    pr.cle AS preference,
    pr.valeur,
    pr.categorie
FROM preferences_role pr
JOIN roles r ON pr.role_id = r.id
ORDER BY r.code, pr.categorie, pr.cle;

-- ==================================
-- FIN MIGRATION
-- ==================================
