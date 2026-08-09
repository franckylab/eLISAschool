-- =============================================
-- eLISAschool — Migration 173 : Permissions plateforme séparées
-- =============================================
-- Modèle C — Auth0 Internalisé (Dual-Plane)
-- Permissions dédiées à la plateforme (~40 permissions).
-- Séparées des permissions tenant pour isolation stricte.
-- =============================================

-- 1. Création de la table permissions_plateforme
CREATE TABLE IF NOT EXISTS permissions_plateforme (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(100) NOT NULL UNIQUE,
    libelle     VARCHAR(200) NOT NULL,
    module      VARCHAR(50) NOT NULL,
    description TEXT,
    "estSysteme" BOOLEAN DEFAULT true,
    ordre       INTEGER DEFAULT 0
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_pp_module ON permissions_plateforme(module);
CREATE INDEX IF NOT EXISTS idx_pp_ordre ON permissions_plateforme(ordre);

-- 3. Seed : permissions plateforme (~40 permissions organisées par module)
INSERT INTO permissions_plateforme (code, libelle, module, description, ordre) VALUES
    -- Dashboard (1-9)
    ('platform:dashboard:view',       'Voir le dashboard',           'dashboard',    'Accès au tableau de bord plateforme', 1),
    ('platform:dashboard:export',     'Exporter les données',        'dashboard',    'Export CSV/PDF du dashboard', 2),

    -- Tenants / Établissements (10-19)
    ('platform:etablissements:read',   'Lister les établissements',   'tenants',      'Voir la liste des établissements clients', 10),
    ('platform:etablissements:write',  'Gérer les établissements',    'tenants',      'Créer/modifier/supprimer des établissements', 11),
    ('platform:etablissements:stats',  'Voir les statistiques',       'tenants',      'Statistiques détaillées par établissement', 12),
    ('platform:groupes:read',          'Lister les groupes',          'tenants',      'Voir les groupes d''établissements', 13),
    ('platform:groupes:write',         'Gérer les groupes',           'tenants',      'Créer/modifier les groupes', 14),

    -- Facturation (20-29)
    ('platform:facturation:read',      'Voir la facturation',         'facturation',  'Accès aux factures et abonnements', 20),
    ('platform:facturation:manage',    'Gérer la facturation',        'facturation',  'Créer/modifier factures, plans, tarifs', 21),
    ('platform:plans:manage',          'Gérer les plans',             'facturation',  'Configuration des plans d''abonnement', 22),
    ('platform:providers:manage',      'Gérer les providers',         'facturation',  'Configuration des providers de paiement', 23),

    -- Monitoring (30-39)
    ('platform:monitoring:view',       'Voir le monitoring',          'monitoring',   'Accès aux métriques et health checks', 30),
    ('platform:monitoring:manage',     'Gérer les alertes',           'monitoring',   'Configuration des seuils et alertes', 31),
    ('platform:monitoring:export',     'Exporter les métriques',      'monitoring',   'Export des données de monitoring', 32),

    -- Sécurité / Identité (40-49)
    ('platform:users:read',            'Lister les users plateforme', 'securite',     'Voir les comptes admin plateforme', 40),
    ('platform:users:manage',          'Gérer les users plateforme',  'securite',     'Créer/modifier/supprimer les comptes admin', 41),
    ('platform:roles:read',            'Voir les rôles plateforme',   'securite',     'Lister les rôles et leurs permissions', 42),
    ('platform:roles:manage',          'Gérer les rôles plateforme',  'securite',     'Créer/modifier les rôles personnalisés', 43),
    ('platform:permissions:read',      'Voir les permissions',        'securite',     'Consulter la matrice des permissions', 44),
    ('platform:permissions:manage',    'Gérer les permissions',       'securite',     'Modifier la matrice des permissions', 45),
    ('platform:sessions:read',         'Voir les sessions',           'securite',     'Consulter les sessions actives', 46),
    ('platform:sessions:revoke',       'Révoquer les sessions',       'securite',     'Terminer les sessions actives', 47),

    -- Audit (50-59)
    ('platform:audit:read',            'Voir les logs d''audit',      'audit',        'Consulter les logs d''audit globaux', 50),
    ('platform:audit:export',          'Exporter les audits',         'audit',        'Export CSV/JSON des logs d''audit', 51),

    -- Actions critiques (60-69)
    ('platform:actions:approve',       'Approuver actions critiques', 'actions',      'Validation des actions sensibles (MFA requis)', 60),
    ('platform:backup:manage',         'Gérer les backups',           'actions',      'Trigger/restore des backups tenant', 61),

    -- Configuration (70-79)
    ('platform:config:read',           'Voir la configuration',       'config',       'Consulter la configuration globale', 70),
    ('platform:config:write',          'Modifier la configuration',   'config',       'Modifier les paramètres système', 71),
    ('platform:modules:toggle',        'Activer/désactiver modules',  'config',       'Toggle des modules globaux', 72),
    ('platform:notifications:manage',  'Gérer les notifications',     'config',       'Configuration des providers de notification', 73),
    ('platform:cascade:manage',        'Gérer les paramètres cascade','config',       'Configuration cascade multi-niveaux', 74)
ON CONFLICT (code) DO NOTHING;

-- 4. Vérification
DO $$
DECLARE
    nb_perms INTEGER;
BEGIN
    SELECT COUNT(*) INTO nb_perms FROM permissions_plateforme;
    RAISE NOTICE 'Migration 173 terminée : % permissions plateforme disponibles', nb_perms;
END $$;
