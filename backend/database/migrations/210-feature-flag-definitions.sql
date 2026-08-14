-- ==================================
-- eLISAschool - Migration 210
-- Feature Flag Definitions + History
-- ==================================
-- Registre centralisé des feature flags (R1)
-- Table d'audit pour versioning/rollback (R3/R5)
-- Progressive rollout (R2) + Expiration automatique (R4)
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- ==================================
-- NOTE: Les colonnes sont en camelCase (convention TypeORM sans naming strategy)

-- ═══════════════════════════════════════════════════════
-- 1. Table feature_flag_definitions — Registre centralisé
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feature_flag_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cle VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(150) NOT NULL,
    description TEXT,
    categorie VARCHAR(50) DEFAULT 'general',
    -- Catégories : 'general', 'billing', 'integration', 'security', 'ux', 'pedagogie'
    type VARCHAR(30) DEFAULT 'release',
    -- Types : 'release', 'ops', 'experiment', 'permission'
    "valeurDefaut" BOOLEAN DEFAULT false,
    "planMinimal" VARCHAR(50),
    -- Slug du plan minimal requis (ex: 'starter', 'standard', 'pro', 'enterprise')
    "rolloutPercentage" INT DEFAULT 100 CHECK ("rolloutPercentage" >= 0 AND "rolloutPercentage" <= 100),
    -- Pour progressive rollout : 0-100% des établissements
    segments JSONB DEFAULT '[]'::jsonb,
    -- Règles de ciblage segments : [{champ, operateur, valeur}]
    "estSysteme" BOOLEAN DEFAULT false,
    -- Si true : non supprimable (flags critiques)
    "estActif" BOOLEAN DEFAULT true,
    -- Permet de désactiver un flag globalement
    "expiresAt" TIMESTAMPTZ,
    -- Date d'expiration (alerte si dépassée)
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_ffd_cle ON feature_flag_definitions(cle);
CREATE INDEX IF NOT EXISTS idx_ffd_categorie ON feature_flag_definitions(categorie);
CREATE INDEX IF NOT EXISTS idx_ffd_type ON feature_flag_definitions(type);
CREATE INDEX IF NOT EXISTS idx_ffd_est_actif ON feature_flag_definitions("estActif");
CREATE INDEX IF NOT EXISTS idx_ffd_expires_at ON feature_flag_definitions("expiresAt") WHERE "expiresAt" IS NOT NULL;

-- ═══════════════════════════════════════════════════════
-- 2. Table feature_flags_history — Audit trail (R3/R5)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feature_flags_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "flagDefinitionId" UUID REFERENCES feature_flag_definitions(id) ON DELETE SET NULL,
    "etablissementId" UUID,
    action VARCHAR(30) NOT NULL,
    -- Actions : 'CREATE', 'TOGGLE_ON', 'TOGGLE_OFF', 'DELETE', 'ROLLOUT_CHANGE',
    --           'SEGMENT_CHANGE', 'EXPIRE', 'RESET'
    "ancienneValeur" TEXT,
    "nouvelleValeur" TEXT,
    "modifiePar" UUID,
    -- ID utilisateur ayant fait le changement
    commentaire TEXT,
    -- Note optionnelle (ex: raison du toggle)
    "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Index pour requêtes d'audit
CREATE INDEX IF NOT EXISTS idx_ffh_flag_definition ON feature_flags_history("flagDefinitionId");
CREATE INDEX IF NOT EXISTS idx_ffh_etablissement ON feature_flags_history("etablissementId");
CREATE INDEX IF NOT EXISTS idx_ffh_created_at ON feature_flags_history("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_ffh_action ON feature_flags_history(action);

-- ═══════════════════════════════════════════════════════
-- 3. Seed — 8 flags transverses existants (R1)
-- ═══════════════════════════════════════════════════════

INSERT INTO feature_flag_definitions (cle, label, description, categorie, type, "valeurDefaut", "planMinimal", "rolloutPercentage", "estSysteme") VALUES
-- Flags généraux
(
    'multi_etablissement',
    'Multi-établissement',
    'Permet la gestion de plusieurs établissements depuis un compte administrateur',
    'general',
    'permission',
    false,
    'pro',
    100,
    true
),
(
    'export_pdf',
    'Export PDF',
    'Active la génération de PDF pour les bulletins, factures, rapports et certificats',
    'general',
    'release',
    false,
    'starter',
    100,
    true
),
-- Flags intégration
(
    'api_rest',
    'API REST publique',
    'Expose une API publique pour les intégrations avec des systèmes tiers',
    'integration',
    'permission',
    false,
    'standard',
    100,
    true
),
(
    'webhooks',
    'Webhooks',
    'Envoi de notifications webhook vers des systèmes externes (CRM, ERP, etc.)',
    'integration',
    'permission',
    false,
    'pro',
    100,
    true
),
-- Flags sécurité
(
    'sso',
    'Single Sign-On',
    'Authentification unifiée via Google Workspace, Microsoft Azure AD ou SAML',
    'security',
    'permission',
    false,
    'enterprise',
    100,
    true
),
(
    'backup_auto',
    'Backup automatique',
    'Sauvegardes automatiques planifiées quotidiennement avec rétention configurable',
    'security',
    'release',
    false,
    'standard',
    100,
    true
),
-- Flags UX
(
    'white_label',
    'White Label',
    'Personnalisation complète de la marque : domaine personnalisé, logo, couleurs',
    'ux',
    'permission',
    false,
    'enterprise',
    100,
    true
),
-- Flags monitoring
(
    'monitoring_advanced',
    'Monitoring avancé',
    'Métriques détaillées, alertes personnalisées et tableaux de bord temps réel',
    'general',
    'release',
    false,
    'pro',
    100,
    true
)
ON CONFLICT (cle) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- 4. Trigger updated_at automatique
-- ═══════════════════════════════════════════════════════

-- Fonction de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_feature_flag_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur la table
DROP TRIGGER IF EXISTS trigger_ffd_updated_at ON feature_flag_definitions;
CREATE TRIGGER trigger_ffd_updated_at
    BEFORE UPDATE ON feature_flag_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flag_definitions_updated_at();

-- ═══════════════════════════════════════════════════════
-- 5. Vue utilitaire — Flags expirés
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_feature_flags_expired AS
SELECT 
    id,
    cle,
    label,
    categorie,
    type,
    "expiresAt",
    "estActif",
    NOW() - "expiresAt" AS duree_depuis_expiration
FROM feature_flag_definitions
WHERE "expiresAt" IS NOT NULL
  AND "expiresAt" < NOW()
  AND "estActif" = true;

-- ═══════════════════════════════════════════════════════
-- 6. Commentaires
-- ═══════════════════════════════════════════════════════

COMMENT ON TABLE feature_flag_definitions IS 'Registre centralisé des feature flags — source unique de vérité pour les métadonnées des flags';
COMMENT ON TABLE feature_flags_history IS 'Journal d audit des modifications de feature flags — traçabilité complète des toggles';
COMMENT ON COLUMN feature_flag_definitions.cle IS 'Clé unique du flag (ex: export_pdf, multi_etablissement)';
COMMENT ON COLUMN feature_flag_definitions."rolloutPercentage" IS 'Pourcentage d établissements ciblés (0-100). Hash stable sur etablissementId';
COMMENT ON COLUMN feature_flag_definitions.segments IS 'Règles JSONB de ciblage avancé : [{"champ":"plan","operateur":"eq","valeur":"pro"}]';
COMMENT ON COLUMN feature_flag_definitions."estSysteme" IS 'Si true, le flag ne peut pas être supprimé (protection des flags critiques)';
COMMENT ON COLUMN feature_flags_history.action IS 'Type de modification : CREATE, TOGGLE_ON, TOGGLE_OFF, DELETE, ROLLOUT_CHANGE, SEGMENT_CHANGE, EXPIRE, RESET';
