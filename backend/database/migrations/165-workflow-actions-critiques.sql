-- ==================================
-- eLISAschool - Migration 165: Workflow Actions Critiques
-- ==================================
-- Refonte SaaS v7 — Lot F.2
--
-- Table `actions_critiques` : workflow d'approbation 2 facteurs (MFA)
-- pour les opérations sensibles de la plateforme.
--
-- Flux :
--   1. Un SUPER_ADMIN demande une action critique → statut EN_ATTENTE
--   2. Un 2ᵉ SUPER_ADMIN (ou le même avec MFA) approuve avec code TOTP
--   3. Si approuvé → statut APPROUVEE → l'action est exécutée → statut EXECUTEE
--   4. Si rejeté → statut REJETEE
--
-- Types d'actions critiques :
--   RESILIER, SUSPENDRE, UPGRADE, SUPPRIMER_ETABLISSEMENT,
--   ACCORDER_AVOIR, RESTAURER_BACKUP, REINITIALISER_GLOBAL, MODIFIER_TARIFS
--
-- ==================================

-- Table actions_critiques
CREATE TABLE IF NOT EXISTS actions_critiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Type d'action critique
    type_action VARCHAR(30) NOT NULL,

    -- Statut du workflow
    statut VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',

    -- Données de l'action (JSON structuré selon le type)
    -- Ex: { etablissementId: "...", planId: "...", montant: 50000, raison: "..." }
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Demandeur (1er SUPER_ADMIN qui initie)
    demandeur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE RESTRICT,

    -- Approbateur (2ᵉ SUPER_ADMIN qui approuve avec MFA)
    approuveur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,

    -- Établissement cible (nullable pour actions globales)
    etablissement_id UUID REFERENCES etablissements(id) ON DELETE SET NULL,

    -- Référence à l'entité cible (ex: abonnementId, factureId)
    cible_type VARCHAR(50),
    cible_id UUID,

    -- Résultats de l'exécution (JSON)
    resultat_execution JSONB,

    -- Dates du workflow
    date_demande TIMESTAMP NOT NULL DEFAULT NOW(),
    date_approbation TIMESTAMP,
    date_execution TIMESTAMP,
    date_expiration TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

    -- Code MFA utilisé pour l'approbation (hashé, non le code en clair)
    mfa_verification_hash VARCHAR(255),

    -- Raison / commentaire de la demande
    raison TEXT,

    -- Rejet : raison du refus
    motif_rejet TEXT,

    -- Nombre de tentatives d'approbation échouées
    tentatives_approbation INT NOT NULL DEFAULT 0,

    -- IP et user-agent du demandeur
    demandeur_ip VARCHAR(45),
    demandeur_user_agent TEXT,

    -- IP et user-agent de l'approbateur
    approuveur_ip VARCHAR(45),
    approuveur_user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Index de performance
-- ==========================================

-- Recherche par statut (requête principale : liste des actions en attente)
CREATE INDEX IF NOT EXISTS idx_actions_critiques_statut
    ON actions_critiques(statut);

-- Recherche par type d'action
CREATE INDEX IF NOT EXISTS idx_actions_critiques_type_action
    ON actions_critiques(type_action);

-- Recherche par demandeur
CREATE INDEX IF NOT EXISTS idx_actions_critiques_demandeur
    ON actions_critiques(demandeur_id);

-- Recherche par établissement cible
CREATE INDEX IF NOT EXISTS idx_actions_critiques_etablissement
    ON actions_critiques(etablissement_id);

-- Actions non expirées (requête courante)
CREATE INDEX IF NOT EXISTS idx_actions_critiques_expiration
    ON actions_critiques(date_expiration)
    WHERE statut = 'EN_ATTENTE';

-- Recherche par cible (ex: tous les actions sur un abonnement)
CREATE INDEX IF NOT EXISTS idx_actions_critiques_cible
    ON actions_critiques(cible_type, cible_id)
    WHERE cible_id IS NOT NULL;

-- ==========================================
-- Contraintes
-- ==========================================

-- Contrainte : type_action doit être une valeur connue
ALTER TABLE actions_critiques
    ADD CONSTRAINT chk_actions_critiques_type_action
    CHECK (type_action IN (
        'RESILIER',
        'SUSPENDRE',
        'UPGRADE',
        'SUPPRIMER_ETABLISSEMENT',
        'ACCORDER_AVOIR',
        'RESTAURER_BACKUP',
        'REINITIALISER_GLOBAL',
        'MODIFIER_TARIFS'
    ));

-- Contrainte : statut doit être une valeur connue
ALTER TABLE actions_critiques
    ADD CONSTRAINT chk_actions_critiques_statut
    CHECK (statut IN (
        'EN_ATTENTE',
        'APPROUVEE',
        'REJETEE',
        'EXECUTEE',
        'EXPIREE',
        'ANNULEE'
    ));

-- ==========================================
-- Trigger auto-update timestamp
-- ==========================================

CREATE OR REPLACE FUNCTION update_actions_critiques_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actions_critiques_updated_at
    BEFORE UPDATE ON actions_critiques
    FOR EACH ROW
    EXECUTE FUNCTION update_actions_critiques_updated_at();

-- ==========================================
-- Fonction : expiration automatique des actions en attente
-- ==========================================

-- Cette fonction sera appelée par un cron job pour marquer les actions expirées
CREATE OR REPLACE FUNCTION expirer_actions_critiques_obsoletes()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE actions_critiques
    SET statut = 'EXPIREE',
        updated_at = NOW()
    WHERE statut = 'EN_ATTENTE'
      AND date_expiration < NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;

    IF v_count > 0 THEN
        RAISE NOTICE '✅ Actions critiques expirées : %', v_count;
    END IF;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Commentaires
-- ==========================================

COMMENT ON TABLE actions_critiques IS
    'Workflow d''approbation 2F (MFA) pour les actions sensibles de la plateforme — Refonte SaaS v7 Lot F';

COMMENT ON COLUMN actions_critiques.type_action IS
    'Type d''action critique : RESILIER, SUSPENDRE, UPGRADE, SUPPRIMER_ETABLISSEMENT, ACCORDER_AVOIR, RESTAURER_BACKUP, REINITIALISER_GLOBAL, MODIFIER_TARIFS';

COMMENT ON COLUMN actions_critiques.statut IS
    'Statut workflow : EN_ATTENTE → APPROUVEE → EXECUTEE | REJETEE | EXPIREE | ANNULEE';

COMMENT ON COLUMN actions_critiques.payload IS
    'Données JSON de l''action (structure variable selon type_action)';

COMMENT ON COLUMN actions_critiques.demandeur_id IS
    'SUPER_ADMIN qui a initié la demande d''action';

COMMENT ON COLUMN actions_critiques.approuveur_id IS
    'SUPER_ADMIN qui a approuvé (avec vérification MFA TOTP)';

COMMENT ON COLUMN actions_critiques.date_expiration IS
    'Date d''expiration de la demande (défaut 24h). Après : statut EXPIREE';

COMMENT ON COLUMN actions_critiques.mfa_verification_hash IS
    'Hash de vérification MFA (proof que le code TOTP a été vérifié)';

COMMENT ON COLUMN actions_critiques.tentatives_approbation IS
    'Nombre de tentatives d''approbation échouées (max 5 avant blocage)';

-- ==========================================
-- Vue de diagnostic : actions critiques par statut
-- ==========================================

CREATE OR REPLACE VIEW v_actions_critiques_synthese AS
SELECT
    type_action,
    statut,
    COUNT(*) as nombre,
    MIN(date_demande) as plus_ancienne,
    MAX(date_demande) as plus_recente
FROM actions_critiques
GROUP BY type_action, statut
ORDER BY type_action, statut;

COMMENT ON VIEW v_actions_critiques_synthese IS
    'Synthèse des actions critiques par type et statut — diagnostic plateforme';
