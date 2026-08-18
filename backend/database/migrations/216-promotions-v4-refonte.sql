-- =============================================
-- eLISAschool - Migration 216 : Refonte Promotions v4.0
-- =============================================
--
-- Remplace le système de remises mono-scope (remises_abonnement)
-- par un système de promotions multi-scopes (promotions + bundle_promotions).
--
-- Scopes : PLAN, PACK, MODULE, BUNDLE
-- Types  : POURCENTAGE, MONTANT_FIXE, GRATUITE
-- Cascade: plan (plafond 40%) → packs (libre) → modules (libre) → gratuités
--
-- Stratégie : refonte complète
--   1. Créer les nouvelles tables
--   2. Migrer les données de remises_abonnement → promotions
--   3. Renommer l'ancienne table en _legacy_remises_abonnement
--   4. Seeds des nouvelles promotions scopées
--
-- Version: 4.0.0
-- Auteur: franck arlos chendjou
-- =============================================

BEGIN;

-- =============================================
-- 1. TABLE promotions (remplace remises_abonnement)
-- =============================================

CREATE TABLE IF NOT EXISTS promotions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(100) NOT NULL UNIQUE,
    nom             VARCHAR(150) NOT NULL,
    type_promotion  VARCHAR(20) NOT NULL DEFAULT 'POURCENTAGE',
    scope           VARCHAR(20) NOT NULL DEFAULT 'PLAN',
    cible_id        UUID,
    cible_ressource VARCHAR(100),
    valeur          DECIMAL(12,2) NOT NULL DEFAULT 0,
    duree_application VARCHAR(30) NOT NULL DEFAULT 'PREMIERE_FACTURE',
    conditions      JSONB,
    config          JSONB,
    cumulable       BOOLEAN NOT NULL DEFAULT false,
    priorite        INTEGER NOT NULL DEFAULT 0,
    code_coupon     VARCHAR(100),
    max_utilisations INTEGER,
    utilisations    INTEGER NOT NULL DEFAULT 0,
    date_debut      TIMESTAMP NOT NULL DEFAULT now(),
    date_fin        TIMESTAMP,
    actif           BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_promotions_scope_cible ON promotions (scope, cible_id);
CREATE INDEX IF NOT EXISTS idx_promotions_actif ON promotions (actif);
CREATE INDEX IF NOT EXISTS idx_promotions_code_coupon ON promotions (code_coupon) WHERE code_coupon IS NOT NULL;

-- Contraintes
ALTER TABLE promotions ADD CONSTRAINT chk_promotions_type CHECK (type_promotion IN ('POURCENTAGE', 'MONTANT_FIXE', 'GRATUITE'));
ALTER TABLE promotions ADD CONSTRAINT chk_promotions_scope CHECK (scope IN ('PLAN', 'PACK', 'MODULE', 'BUNDLE'));
ALTER TABLE promotions ADD CONSTRAINT chk_promotions_duree CHECK (duree_application IN ('PREMIERE_FACTURE', 'N_CYCLES', 'PERMANENTE', 'N_MOIS_GRATUIT'));
ALTER TABLE promotions ADD CONSTRAINT chk_promotions_valeur_pos CHECK (valeur >= 0);

-- =============================================
-- 2. TABLE bundle_promotions
-- =============================================

CREATE TABLE IF NOT EXISTS bundle_promotions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(100) NOT NULL UNIQUE,
    nom             VARCHAR(150) NOT NULL,
    description     TEXT,
    pack_ids        UUID[] NOT NULL DEFAULT '{}',
    type_remise     VARCHAR(20) NOT NULL DEFAULT 'POURCENTAGE',
    valeur          DECIMAL(12,2) NOT NULL DEFAULT 0,
    code_coupon     VARCHAR(100),
    date_debut      TIMESTAMP NOT NULL DEFAULT now(),
    date_fin        TIMESTAMP,
    max_utilisations INTEGER,
    utilisations    INTEGER NOT NULL DEFAULT 0,
    actif           BOOLEAN NOT NULL DEFAULT true,
    priorite        INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_bundle_promotions_actif ON bundle_promotions (actif);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bundle_promotions_code ON bundle_promotions (code);

-- Contraintes
ALTER TABLE bundle_promotions ADD CONSTRAINT chk_bundle_type CHECK (type_remise IN ('POURCENTAGE', 'MONTANT_FIXE'));
ALTER TABLE bundle_promotions ADD CONSTRAINT chk_bundle_min_packs CHECK (array_length(pack_ids, 1) >= 2);
ALTER TABLE bundle_promotions ADD CONSTRAINT chk_bundle_valeur_pos CHECK (valeur >= 0);

-- =============================================
-- 3. MIGRATION DES DONNÉES LEGACY
-- =============================================

-- Migrer les remises existantes vers promotions (scope = PLAN par défaut)
INSERT INTO promotions (
    code, nom, type_promotion, scope, cible_id, cible_ressource,
    valeur, duree_application, conditions, config,
    cumulable, priorite, code_coupon, max_utilisations, utilisations,
    date_debut, date_fin, actif
)
SELECT
    r.code,
    r.nom,
    CASE r.type_remise
        WHEN 'POURCENTAGE' THEN 'POURCENTAGE'
        WHEN 'MONTANT_FIXE' THEN 'MONTANT_FIXE'
        ELSE 'POURCENTAGE'
    END,
    'PLAN',  -- toutes les anciennes remises étaient scopées plan
    r.cible_id,
    NULL,    -- pas de cible_ressource pour les remises plan
    r.valeur,
    CASE r.duree_application
        WHEN 'PREMIERE_FACTURE' THEN 'PREMIERE_FACTURE'
        WHEN 'N_CYCLES' THEN 'N_CYCLES'
        WHEN 'PERMANENTE' THEN 'PERMANENTE'
        ELSE 'PREMIERE_FACTURE'
    END,
    -- Migrer les conditions dans le JSONB
    jsonb_strip_nulls(jsonb_build_object(
        'nombreElevesMin', r.condition_eleves_min,
        'ancienneteMois', r.condition_anciennete_mois,
        'nbCycles', r.nb_cycles
    )),
    NULL,  -- pas de config additionnelle
    r.cumulable,
    r.priorite,
    r.code_coupon,
    r.max_utilisations,
    r.utilisations,
    r.date_debut,
    r.date_fin,
    r.actif
FROM remises_abonnement r
ON CONFLICT (code) DO NOTHING;  -- skip si le code existe déjà

-- Renommer l'ancienne table (conservation pour rollback)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = '_legacy_remises_abonnement') THEN
        ALTER TABLE remises_abonnement RENAME TO _legacy_remises_abonnement;
    END IF;
END $$;

-- =============================================
-- 4. SEEDS — Nouvelles promotions scopées v4.0
-- =============================================

-- ─── Promotions PLAN (migrées depuis legacy, déjà insérées ci-dessus) ───
-- Les 7 remises legacy sont maintenant scope=PLAN

-- ─── Promotions PACK (nouvelles) ───

-- Pack stockage : -30% si plan Standard+
INSERT INTO promotions (code, nom, type_promotion, scope, cible_ressource, valeur, duree_application, conditions, cumulable, priorite, actif)
VALUES (
    'PACK-STOCK-30',
    'Remise 30% pack stockage — plan Standard+',
    'POURCENTAGE',
    'PACK',
    'stockageGo',
    30,
    'PERMANENTE',
    '{"ressourceCible": "stockageGo", "plansRequis": []}',
    true,
    50,
    true
)
ON CONFLICT (code) DO UPDATE SET
    nom = EXCLUDED.nom,
    conditions = EXCLUDED.conditions,
    updated_at = now();

-- Pack SMS : -20% si plan Standard+
INSERT INTO promotions (code, nom, type_promotion, scope, cible_ressource, valeur, duree_application, conditions, cumulable, priorite, actif)
VALUES (
    'PACK-SMS-20',
    'Remise 20% pack SMS — plan Standard+',
    'POURCENTAGE',
    'PACK',
    'sms',
    20,
    'PERMANENTE',
    '{"ressourceCible": "sms", "plansRequis": []}',
    true,
    50,
    true
)
ON CONFLICT (code) DO UPDATE SET
    nom = EXCLUDED.nom,
    conditions = EXCLUDED.conditions,
    updated_at = now();

-- Pack élèves : -15% (cross-sell, si ≥2 packs déjà souscrits)
INSERT INTO promotions (code, nom, type_promotion, scope, cible_ressource, valeur, duree_application, conditions, cumulable, priorite, actif)
VALUES (
    'PACK-ELEVES-XSELL',
    'Remise 15% pack élèves — cross-sell',
    'POURCENTAGE',
    'PACK',
    'eleves',
    15,
    'PERMANENTE',
    '{"ressourceCible": "eleves", "packsRequis": []}',
    true,
    40,
    true
)
ON CONFLICT (code) DO UPDATE SET
    nom = EXCLUDED.nom,
    conditions = EXCLUDED.conditions,
    updated_at = now();

-- ─── Promotions MODULE (nouvelles) ───

-- Module Bulletins : gratuit 3 mois si plan Premium
INSERT INTO promotions (code, nom, type_promotion, scope, valeur, duree_application, conditions, cumulable, priorite, actif)
VALUES (
    'MOD-BUL-3M-GRATUIT',
    'Module Bulletins gratuit 3 mois — Premium',
    'GRATUITE',
    'MODULE',
    100,
    'N_MOIS_GRATUIT',
    '{"dureeGratuiteMois": 3, "plansRequis": []}',
    false,
    100,
    true
)
ON CONFLICT (code) DO UPDATE SET
    nom = EXCLUDED.nom,
    conditions = EXCLUDED.conditions,
    updated_at = now();

-- Module Sondages : -50% premier mois (tous plans)
INSERT INTO promotions (code, nom, type_promotion, scope, valeur, duree_application, conditions, cumulable, priorite, code_coupon, max_utilisations, actif)
VALUES (
    'MOD-SOND-50',
    'Module Sondages -50% premier mois',
    'POURCENTAGE',
    'MODULE',
    50,
    'PREMIERE_FACTURE',
    '{}',
    false,
    80,
    'SOND50',
    100,
    true
)
ON CONFLICT (code) DO UPDATE SET
    nom = EXCLUDED.nom,
    updated_at = now();

-- Module CMS : -25% 3 cycles (code promo)
INSERT INTO promotions (code, nom, type_promotion, scope, valeur, duree_application, conditions, cumulable, priorite, code_coupon, max_utilisations, date_debut, date_fin, actif)
VALUES (
    'PROMO-CMS-2026',
    'Module CMS -25% pendant 3 cycles',
    'POURCENTAGE',
    'MODULE',
    25,
    'N_CYCLES',
    '{"nbCycles": 3}',
    false,
    90,
    'CMS25',
    50,
    '2026-08-01',
    '2027-02-28',
    true
)
ON CONFLICT (code) DO UPDATE SET
    nom = EXCLUDED.nom,
    updated_at = now();

-- ─── Bundles (nouveaux) ───

-- Bundle Éducatif : pack élèves + pack stockage → -20%
-- Note: les packIds seront mis à jour par le seed script TypeScript
-- car on ne connaît pas les UUIDs des packs ici.
-- Le seed TypeScript (seed-bundles.ts) gérera l'insertion avec les vrais IDs.

COMMIT;
