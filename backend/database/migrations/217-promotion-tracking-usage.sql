-- ==========================================
-- eLISAschool - Migration 217
-- Tracking utilisations promotions (R3 audit v4.1)
-- ==========================================
--
-- Table : promotion_utilisees
-- Rôle  : Enregistre chaque utilisation de promotion par établissement.
--         Permet analytics, reporting, détection abus, audit commercial.
--
-- Version: 4.1.0
-- Auteur: franck arlos chendjou
-- ==========================================

-- 1. Table promotion_utilisees
CREATE TABLE IF NOT EXISTS promotion_utilisees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "promotionId"   UUID NOT NULL,
    "etablissementId" UUID NOT NULL,
    "factureId"     UUID,
    "codePromotion" VARCHAR(100) NOT NULL,
    scope           VARCHAR(20) NOT NULL,
    "montantDeduit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dateUtilisation" TIMESTAMP NOT NULL DEFAULT now(),
    "createdAt"     TIMESTAMP NOT NULL DEFAULT now()
);

-- 2. Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_promo_utilisees_etablissement
    ON promotion_utilisees ("etablissementId");

CREATE INDEX IF NOT EXISTS idx_promo_utilisees_promotion
    ON promotion_utilisees ("promotionId");

CREATE INDEX IF NOT EXISTS idx_promo_utilisees_date
    ON promotion_utilisees ("dateUtilisation");

-- 3. RLS (multi-tenant isolation)
ALTER TABLE promotion_utilisees ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE policyname = 'rls_promo_utilisees_tenant'
        AND tablename = 'promotion_utilisees'
    ) THEN
        CREATE POLICY rls_promo_utilisees_tenant
        ON promotion_utilisees
        FOR ALL
        USING ("etablissementId"::text = current_setting('app.current_tenant', true));
    END IF;
END $$;

-- 4. Commentaires
COMMENT ON TABLE promotion_utilisees IS 'Tracking des utilisations de promotions par établissement (audit v4.1)';
COMMENT ON COLUMN promotion_utilisees.scope IS 'Scope de la promotion : PLAN, PACK, MODULE, BUNDLE';
