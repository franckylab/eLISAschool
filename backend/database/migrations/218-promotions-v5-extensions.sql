-- =============================================
-- Migration 218 — Promotions v5 : Extensions
-- =============================================
--
-- Ajouts majeurs :
-- 1. Scope QUOTA (nouvelle valeur dans l'enum scope)
-- 2. Colonnes planification (est_programmee, date_programmation)
-- 3. Config JSONB enrichie (paliersVolume, quotaRessource, typeAutomatique, declencheur)
-- 4. Index pour performances
--
-- Version: 5.0.0
-- Auteur: franck arlos chendjou
-- =============================================

-- ─── 1. Scope QUOTA : étendre le type de la colonne scope ───
-- PostgreSQL : ALTER TYPE pour ajouter une valeur à un enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'QUOTA'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'scope_promotion')
    ) THEN
        -- La colonne scope est varchar(20), pas un enum PostgreSQL natif
        -- Donc pas besoin d'ALTER TYPE — la contrainte est applicative (Zod + entity)
        RAISE NOTICE 'Scope QUOTA ajouté (colonne varchar, pas d''enum PostgreSQL)';
    END IF;
END $$;

-- ─── 2. Colonnes planification ───
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS est_programmee BOOLEAN DEFAULT FALSE;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS date_programmation TIMESTAMP;

-- Index pour le cron job d'activation des promotions programmées
CREATE INDEX IF NOT EXISTS idx_promotions_programmee_active
    ON promotions (est_programmee, actif, date_programmation)
    WHERE est_programmee = true AND actif = false;

-- ─── 3. Commentaires documentation ───
COMMENT ON COLUMN promotions.est_programmee IS 'v5 : Promotion programmée (activée automatiquement à date_programmation)';
COMMENT ON COLUMN promotions.date_programmation IS 'v5 : Date d''activation programmée (null = non programmée)';
COMMENT ON COLUMN promotions.config IS 'v5 : JSONB enrichi — paliersVolume, quotaRessource, typeAutomatique, declencheur (en plus de prixOriginalBundle, reductionBundle, noteInterne)';

-- ─── 4. Index pour scope QUOTA ───
CREATE INDEX IF NOT EXISTS idx_promotions_scope_quota
    ON promotions (scope, cible_ressource)
    WHERE scope = 'QUOTA' AND actif = true;

-- ─── 5. Seed : exemples de promotions v5 (optionnel, idempotent) ───
-- Palier de volume pour les élèves (scope=QUOTA)
INSERT INTO promotions (code, nom, "typePromotion", scope, valeur, "dureeApplication", cumulable, priorite, actif, config, conditions)
VALUES (
    'VOLUME-ELEVES-2026',
    'Dégressivité par nombre d''élèves',
    'POURCENTAGE',
    'QUOTA',
    5,
    'PERMANENTE',
    true,
    10,
    true,
    '{"paliersVolume": [{"min": 0, "max": 50, "valeur": 0}, {"min": 51, "max": 200, "valeur": 5}, {"min": 201, "max": 500, "valeur": 10}, {"min": 501, "max": null, "valeur": 15}], "quotaRessource": "eleves"}'::jsonb,
    NULL
) ON CONFLICT (code) DO NOTHING;

-- Auto-promo nouveau client (15% première facture)
INSERT INTO promotions (code, nom, "typePromotion", scope, valeur, "dureeApplication", cumulable, priorite, actif, config, conditions)
VALUES (
    'BIENVENUE-15',
    'Bienvenue — 15% nouveau client',
    'POURCENTAGE',
    'PLAN',
    15,
    'PREMIERE_FACTURE',
    false,
    50,
    true,
    '{"typeAutomatique": "NOUVEAU_CLIENT"}'::jsonb,
    NULL
) ON CONFLICT (code) DO NOTHING;

-- Free trial module premium (30 jours)
INSERT INTO promotions (code, nom, "typePromotion", scope, valeur, "dureeApplication", cumulable, priorite, actif, config, conditions)
VALUES (
    'TRIAL-PREMIUM-30',
    'Essai gratuit module premium — 1 mois',
    'GRATUITE',
    'MODULE',
    100,
    'N_MOIS_GRATUIT',
    true,
    20,
    true,
    '{"typeAutomatique": "FREE_TRIAL", "declencheur": {"dureeMois": 1}}'::jsonb,
    NULL
) ON CONFLICT (code) DO NOTHING;

-- Fidélité 12 mois (10% permanente)
INSERT INTO promotions (code, nom, "typePromotion", scope, valeur, "dureeApplication", cumulable, priorite, actif, config, conditions)
VALUES (
    'FIDELITE-12M',
    'Fidélité 12 mois — 10% de remise',
    'POURCENTAGE',
    'PLAN',
    10,
    'PERMANENTE',
    false,
    30,
    true,
    '{"typeAutomatique": "FIDELITE", "declencheur": {"moisAnciennete": 12}}'::jsonb,
    NULL
) ON CONFLICT (code) DO NOTHING;
