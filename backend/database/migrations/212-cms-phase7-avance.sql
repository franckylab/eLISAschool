-- ==================================
-- eLISAschool - Migration 212: CMS Phase 7 — Colonnes avancées
-- ==================================
-- Ajoute les colonnes pour :
-- 1. Conditions de visibilité dynamique (responsive, rôles, dates)
-- 2. Configuration de style structurée (StyleEditorPanel)
-- 3. Métadonnées de contenu (métriques, score qualité)
-- 4. Préférences de focus mode par page
-- ==================================

-- 1. Conditions de visibilité sur cms_sections
ALTER TABLE cms_sections ADD COLUMN IF NOT EXISTS "conditionsVisibilite" jsonb;
COMMENT ON COLUMN cms_sections."conditionsVisibilite" IS 'Conditions d''affichage: breakpoints, rôles, dates (VisibilityEditor)';

-- 2. Configuration de style structurée sur cms_sections
ALTER TABLE cms_sections ADD COLUMN IF NOT EXISTS "styleConfig" jsonb;
COMMENT ON COLUMN cms_sections."styleConfig" IS 'Configuration style: typographie, background, spacing, border, shadow, button (StyleEditorPanel)';

-- 3. Préférences focus mode sur cms_pages
ALTER TABLE cms_pages ADD COLUMN IF NOT EXISTS "focusPreferences" jsonb;
COMMENT ON COLUMN cms_pages."focusPreferences" IS 'Préférences mode focus: fond, largeur, opacity';

-- 4. Score qualité contenu sur cms_pages (calculé côté frontend, persisté pour analytics)
ALTER TABLE cms_pages ADD COLUMN IF NOT EXISTS "qualiteScore" integer DEFAULT 0;
COMMENT ON COLUMN cms_pages."qualiteScore" IS 'Score qualité contenu 0-100 (dernier calcul)';

-- 5. Métadonnées analytics sur cms_pages
ALTER TABLE cms_pages ADD COLUMN IF NOT EXISTS "analytics" jsonb;
COMMENT ON COLUMN cms_pages."analytics" IS 'Analytics: vues, temps lecture moyen, score SEO, mots';

-- Index pour les requêtes de visibilité
CREATE INDEX IF NOT EXISTS idx_cms_sections_visibilite ON cms_sections USING gin ("conditionsVisibilite");

-- Index pour le score qualité
CREATE INDEX IF NOT EXISTS idx_cms_pages_qualite ON cms_pages ("qualiteScore");

-- ==================================
-- Seed : Mettre à jour les sections existantes avec des valeurs par défaut
-- ==================================

-- Pas de données par défaut nécessaires — les colonnes sont nullable
-- Le frontend gère les valeurs par défaut via les composants

-- ==================================
-- Validation
-- ==================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 212 CMS Phase 7 terminée avec succès';
END $$;
