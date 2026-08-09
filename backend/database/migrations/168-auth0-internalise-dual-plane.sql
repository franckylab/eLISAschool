-- ==================================
-- eLISAschool — Migration 168
-- ==================================
-- Modèle C — Auth0 Internalisé (Dual-Plane)
-- Big-bang : 4 nouvelles tables + migration données
--
-- Tables créées :
--   1. identites              — Source unique de vérité (auth global)
--   2. utilisateurs_plateforme — Admins/opérateurs de la plateforme
--   3. memberships            — Table pivot (identité × contexte)
--   4. permissions_plateforme — Registre des ~40 permissions Control Plane
--   5. sessions_plateforme    — Sessions actives plateforme
--
-- Auteurs : franck arlos chendjou
-- ==================================

-- =============================================
-- 1. TABLE identites
-- =============================================
CREATE TABLE IF NOT EXISTS identites (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    email_verifie     BOOLEAN NOT NULL DEFAULT false,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    mfa_active        BOOLEAN NOT NULL DEFAULT false,
    mfa_secret        VARCHAR(255),
    derniere_connexion TIMESTAMPTZ,
    statut            VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
                      CHECK (statut IN ('ACTIF', 'SUSPENDU', 'DESACTIVE')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_identites_email ON identites(email);
CREATE INDEX IF NOT EXISTS idx_identites_statut ON identites(statut);

COMMENT ON TABLE identites IS 'Source unique de vérité pour l''identité (Modèle C — Auth0 Internalisé)';

-- Migration des données depuis utilisateurs → identites
INSERT INTO identites (email, email_verifie, mot_de_passe_hash, mfa_active, derniere_connexion, statut, created_at, updated_at)
SELECT
    u.email,
    u.email_verifie,
    u.mot_de_passe AS mot_de_passe_hash,
    COALESCE(u.deux_facteurs_actif, false) AS mfa_active,
    u.derniere_connexion,
    CASE
        WHEN u.statut = 'ACTIF' THEN 'ACTIF'
        WHEN u.statut = 'SUSPENDU' THEN 'SUSPENDU'
        WHEN u.statut = 'INACTIF' THEN 'DESACTIVE'
        ELSE 'ACTIF'
    END AS statut,
    u.created_at,
    u.updated_at
FROM utilisateurs u
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 2. TABLE utilisateurs_plateforme
-- =============================================
CREATE TABLE IF NOT EXISTS utilisateurs_plateforme (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identite_id      UUID NOT NULL REFERENCES identites(id) ON DELETE CASCADE,
    role_plateforme  VARCHAR(30) NOT NULL
                     CHECK (role_plateforme IN (
                         'SUPER_ADMIN', 'ADMIN_PLATEFORME', 'SUPPORT',
                         'BILLING_MANAGER', 'ANALYST', 'AUDITOR'
                     )),
    prenom           VARCHAR(100) NOT NULL DEFAULT '',
    nom              VARCHAR(100) NOT NULL DEFAULT '',
    avatar_url       VARCHAR(500),
    dernier_acces    TIMESTAMPTZ,
    est_actif        BOOLEAN NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_utilisateurs_plateforme_identite ON utilisateurs_plateforme(identite_id);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_plateforme_role ON utilisateurs_plateforme(role_plateforme);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_plateforme_actif ON utilisateurs_plateforme(est_actif);

COMMENT ON TABLE utilisateurs_plateforme IS 'Admins et opérateurs de la plateforme (Control Plane)';

-- Migration des utilisateurs ayant un rôle plateforme vers utilisateurs_plateforme
INSERT INTO utilisateurs_plateforme (identite_id, role_plateforme, prenom, nom, dernier_acces, est_actif, created_at, updated_at)
SELECT
    i.id AS identite_id,
    CASE
        WHEN u.role = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'
        ELSE 'ADMIN_PLATEFORME'
    END AS role_plateforme,
    COALESCE(pu.prenom, '') AS prenom,
    COALESCE(pu.nom, '') AS nom,
    u.derniere_connexion AS dernier_acces,
    (u.statut = 'ACTIF') AS est_actif,
    u.created_at,
    u.updated_at
FROM utilisateurs u
JOIN identites i ON i.email = u.email
LEFT JOIN profils_utilisateurs pu ON pu."utilisateurId" = u.id
WHERE u.role IN ('SUPER_ADMIN')
ON CONFLICT DO NOTHING;

-- =============================================
-- 3. TABLE memberships (pivot)
-- =============================================
CREATE TABLE IF NOT EXISTS memberships (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identite_id       UUID NOT NULL REFERENCES identites(id) ON DELETE CASCADE,
    contexte_type     VARCHAR(20) NOT NULL
                      CHECK (contexte_type IN ('PLATEFORME', 'ETABLISSEMENT')),
    contexte_id       UUID,
    role              VARCHAR(50) NOT NULL,
    permissions_custom JSONB,
    est_actif         BOOLEAN NOT NULL DEFAULT true,
    date_activation   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index unique composite : une identité ne peut avoir qu'un seul membership par contexte
CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_identite_contexte
    ON memberships(identite_id, contexte_type, COALESCE(contexte_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS idx_memberships_contexte ON memberships(contexte_type, contexte_id);
CREATE INDEX IF NOT EXISTS idx_memberships_actif ON memberships(est_actif);

COMMENT ON TABLE memberships IS 'Table pivot : associe une Identité à un contexte (Plateforme ou Établissement)';

-- Migration des memberships PLATEFORME depuis utilisateurs_plateforme
INSERT INTO memberships (identite_id, contexte_type, contexte_id, role, est_actif, date_activation, created_at, updated_at)
SELECT
    up.identite_id,
    'PLATEFORME' AS contexte_type,
    NULL AS contexte_id,
    up.role_plateforme AS role,
    up.est_actif,
    NOW() AS date_activation,
    up.created_at,
    up.updated_at
FROM utilisateurs_plateforme up
ON CONFLICT DO NOTHING;

-- Migration des memberships ETABLISSEMENT depuis utilisateur_etablissements
INSERT INTO memberships (identite_id, contexte_type, contexte_id, role, est_actif, date_activation, created_at, updated_at)
SELECT
    i.id AS identite_id,
    'ETABLISSEMENT' AS contexte_type,
    ue."etablissementId" AS contexte_id,
    COALESCE(ue.role, u.role) AS role,
    COALESCE(ue.actif, true) AS est_actif,
    COALESCE(ue."dateActivation", NOW()) AS date_activation,
    ue.created_at,
    ue.updated_at
FROM utilisateur_etablissements ue
JOIN utilisateurs u ON u.id = ue."utilisateurId"
JOIN identites i ON i.email = u.email
ON CONFLICT DO NOTHING;

-- =============================================
-- 4. TABLE permissions_plateforme
-- =============================================
CREATE TABLE IF NOT EXISTS permissions_plateforme (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(100) NOT NULL UNIQUE,
    libelle     VARCHAR(200) NOT NULL,
    module      VARCHAR(50) NOT NULL,
    description TEXT,
    est_systeme BOOLEAN NOT NULL DEFAULT true,
    ordre       INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_plateforme_code ON permissions_plateforme(code);
CREATE INDEX IF NOT EXISTS idx_permissions_plateforme_module ON permissions_plateforme(module);
CREATE INDEX IF NOT EXISTS idx_permissions_plateforme_ordre ON permissions_plateforme(ordre);

COMMENT ON TABLE permissions_plateforme IS 'Registre des permissions plateforme (Control Plane) — ~40 permissions';

-- Seed des ~40 permissions plateforme
INSERT INTO permissions_plateforme (code, libelle, module, description, est_systeme, ordre) VALUES
-- PILOTAGE (5)
('platform:dashboard:view',         'Voir le tableau de bord',            'PILOTAGE',  'Accès au dashboard plateforme',                    true, 1),
('platform:monitoring:view',        'Voir le monitoring',                 'PILOTAGE',  'Consulter les métriques de monitoring',            true, 2),
('platform:monitoring:manage',      'Gérer le monitoring',                'PILOTAGE',  'Configurer les alertes et le monitoring',          true, 3),
('platform:revenus:view',           'Voir les revenus',                   'PILOTAGE',  'Consulter les revenus de la plateforme',           true, 4),
('platform:revenus:export',         'Exporter les revenus',               'PILOTAGE',  'Exporter les données de revenus',                  true, 5),

-- TENANTS / ÉTABLISSEMENTS (8)
('platform:etablissements:read',    'Lire les établissements',            'TENANTS',   'Consulter la liste des établissements',            true, 10),
('platform:etablissements:write',   'Modifier les établissements',        'TENANTS',   'Créer/modifier les établissements',                true, 11),
('platform:etablissements:delete',  'Supprimer un établissement',         'TENANTS',   'Supprimer un établissement',                       true, 12),
('platform:groupes:read',           'Lire les groupes',                   'TENANTS',   'Consulter les groupes d''établissements',          true, 13),
('platform:groupes:write',          'Modifier les groupes',               'TENANTS',   'Créer/modifier les groupes d''établissements',     true, 14),
('platform:abonnements:read',       'Lire les abonnements',               'TENANTS',   'Consulter les abonnements des établissements',     true, 15),
('platform:abonnements:write',      'Modifier les abonnements',           'TENANTS',   'Gérer les abonnements',                            true, 16),
('platform:abonnements:suspend',    'Suspendre un abonnement',            'TENANTS',   'Suspendre ou réactiver un abonnement',             true, 17),

-- FACTURATION (5)
('platform:facturation:read',       'Lire la facturation',                'FACTURATION', 'Consulter la facturation plateforme',            true, 20),
('platform:facturation:manage',     'Gérer la facturation',               'FACTURATION', 'Créer/modifier les factures',                    true, 21),
('platform:plans:read',             'Lire les plans tarifaires',          'FACTURATION', 'Consulter les plans et offres',                  true, 22),
('platform:plans:write',            'Modifier les plans tarifaires',      'FACTURATION', 'Créer/modifier les plans tarifaires',            true, 23),
('platform:tranches:manage',        'Gérer les tranches',                 'FACTURATION', 'Configurer les tranches de facturation',         true, 24),

-- TECHNIQUE (6)
('platform:modules:manage',         'Gérer les modules',                  'TECHNIQUE', 'Activer/désactiver les modules globaux',         true, 30),
('platform:configuration:read',     'Lire la configuration',              'TECHNIQUE', 'Consulter la configuration globale',              true, 31),
('platform:configuration:write',    'Modifier la configuration',          'TECHNIQUE', 'Modifier la configuration globale',               true, 32),
('platform:notifications:manage',   'Gérer les notifications',            'TECHNIQUE', 'Envoyer des notifications globales',              true, 33),
('platform:providers:manage',       'Gérer les providers',                'TECHNIQUE', 'Configurer les providers (SMS, email, etc.)',     true, 34),
('platform:cascade:manage',         'Gérer les paramètres cascade',       'TECHNIQUE', 'Gérer les paramètres en cascade',                 true, 35),

-- IDENTITÉ (9)
('platform:users:read',             'Lire les utilisateurs',              'IDENTITE',  'Consulter les utilisateurs plateforme',           true, 40),
('platform:users:write',            'Modifier les utilisateurs',          'IDENTITE',  'Créer/modifier les utilisateurs plateforme',      true, 41),
('platform:users:delete',           'Supprimer un utilisateur',           'IDENTITE',  'Supprimer un utilisateur plateforme',             true, 42),
('platform:users:suspend',          'Suspendre un utilisateur',           'IDENTITE',  'Suspendre ou réactiver un compte',                true, 43),
('platform:users:invite',           'Inviter un utilisateur',             'IDENTITE',  'Envoyer une invitation par email',                true, 44),
('platform:roles:read',             'Lire les rôles',                     'IDENTITE',  'Consulter les rôles plateforme',                  true, 45),
('platform:roles:write',            'Modifier les rôles',                 'IDENTITE',  'Modifier les permissions des rôles',              true, 46),
('platform:sessions:view',          'Voir les sessions',                  'IDENTITE',  'Consulter les sessions actives',                  true, 47),
('platform:sessions:revoke',        'Révoquer les sessions',              'IDENTITE',  'Révoquer une ou toutes les sessions',             true, 48),

-- SÉCURITÉ (5)
('platform:audit:read',             'Lire les logs d''audit',             'SECURITE',  'Consulter les logs d''audit plateforme',          true, 50),
('platform:audit:export',           'Exporter les logs d''audit',         'SECURITE',  'Exporter les logs d''audit',                      true, 51),
('platform:webhooks:manage',        'Gérer les webhooks',                 'SECURITE',  'Configurer les webhooks de la plateforme',        true, 52),
('platform:actions-critiques:approve', 'Approuver les actions critiques', 'SECURITE',  'Valider les actions à haut risque',               true, 53),
('platform:impersonate',            'Impersonate (futur)',                'SECURITE',  'Se connecter en tant qu''autre utilisateur',      true, 54)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 5. TABLE sessions_plateforme
-- =============================================
CREATE TABLE IF NOT EXISTS sessions_plateforme (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_plateforme_id UUID NOT NULL REFERENCES utilisateurs_plateforme(id) ON DELETE CASCADE,
    token                   VARCHAR(500) NOT NULL UNIQUE,
    ip                      VARCHAR(45),
    user_agent              TEXT,
    expires_at              TIMESTAMPTZ NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_plateforme_user ON sessions_plateforme(utilisateur_plateforme_id);
CREATE INDEX IF NOT EXISTS idx_sessions_plateforme_token ON sessions_plateforme(token);
CREATE INDEX IF NOT EXISTS idx_sessions_plateforme_expires ON sessions_plateforme(expires_at);

COMMENT ON TABLE sessions_plateforme IS 'Sessions actives des utilisateurs plateforme (limite 3 LRU)';

-- =============================================
-- 6. TRIGGERS updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_identites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_utilisateurs_plateforme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_permissions_plateforme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_identites_updated_at ON identites;
CREATE TRIGGER trg_identites_updated_at
    BEFORE UPDATE ON identites
    FOR EACH ROW EXECUTE FUNCTION update_identites_updated_at();

DROP TRIGGER IF EXISTS trg_utilisateurs_plateforme_updated_at ON utilisateurs_plateforme;
CREATE TRIGGER trg_utilisateurs_plateforme_updated_at
    BEFORE UPDATE ON utilisateurs_plateforme
    FOR EACH ROW EXECUTE FUNCTION update_utilisateurs_plateforme_updated_at();

DROP TRIGGER IF EXISTS trg_memberships_updated_at ON memberships;
CREATE TRIGGER trg_memberships_updated_at
    BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_memberships_updated_at();

DROP TRIGGER IF EXISTS trg_permissions_plateforme_updated_at ON permissions_plateforme;
CREATE TRIGGER trg_permissions_plateforme_updated_at
    BEFORE UPDATE ON permissions_plateforme
    FOR EACH ROW EXECUTE FUNCTION update_permissions_plateforme_updated_at();

-- =============================================
-- 7. VUE RÉSUMÉ (optionnelle — debug)
-- =============================================
CREATE OR REPLACE VIEW vue_memberships_complets AS
SELECT
    m.id AS membership_id,
    i.email,
    m.contexte_type,
    m.contexte_id,
    m.role,
    m.est_actif,
    up.role_plateforme,
    up.prenom,
    up.nom
FROM memberships m
JOIN identites i ON i.id = m.identite_id
LEFT JOIN utilisateurs_plateforme up ON up.identite_id = i.id;

COMMENT ON VIEW vue_memberships_complets IS 'Vue de debug : récapitulatif des memberships avec infos identité';
