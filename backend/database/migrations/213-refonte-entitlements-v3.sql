-- ==================================
-- eLISAschool - Migration 213
-- Refonte Entitlements v3 — Plans, Modules, Quotas & Fonctionnalités
-- ==================================
-- Migration BRUTALE (sans double compatibilité) issue des rapports
-- RAPPORT-REFONTE-PLANS-MODULES-QUOTAS-ENTITLEMENTS-V2 et V3 :
--   1. Catalogue modules : BASE/PREMIUM/ADDON -> GRATUIT/PAYANT + estCritique
--   2. Plans : colonnes dures -> JSONB (tarification, quotas, entitlements) + rang + estParDefaut
--   3. Nouvelles tables : cycles_facturation, remises_abonnement, packs_quota,
--      abonnements_packs, strategies_expiration, usage_unifie
--   4. Suppression : tranches_*, modules_optionnels, quotas_utilisation, usage_meters
--   5. Backfill : plan Découverte + abonnement actif pour tout établissement
--   6. Paramètres billing persistés (onboarding_mode, essais)
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- ==================================
-- NOTE: Les colonnes sont en camelCase (convention TypeORM sans naming strategy)

BEGIN;

-- ═══════════════════════════════════════════════════════
-- 1. modules_catalogue — classification binaire GRATUIT / PAYANT
-- ═══════════════════════════════════════════════════════

UPDATE modules_catalogue SET categorie = 'GRATUIT' WHERE categorie IN ('BASE', 'CRITIQUE');
UPDATE modules_catalogue SET categorie = 'PAYANT' WHERE categorie IN ('PREMIUM', 'ADDON');

ALTER TABLE modules_catalogue ADD COLUMN IF NOT EXISTS "estCritique" BOOLEAN DEFAULT FALSE;
-- Cœur de plateforme (aligné avec le seed et MODULES_CRITIQUES du entitlement service)
UPDATE modules_catalogue SET "estCritique" = TRUE
WHERE code IN ('auth', 'utilisateurs', 'configuration', 'notifications');

-- La faille "accès sans plan" est fermée : actifParDefaut ne court-circuite plus
-- l'absence d'abonnement (logique corrigée côté entitlement.service v3).

-- ═══════════════════════════════════════════════════════
-- 2. plans_abonnement — pilotage 100% JSONB
-- ═══════════════════════════════════════════════════════

ALTER TABLE plans_abonnement ADD COLUMN IF NOT EXISTS rang INT DEFAULT 0;
ALTER TABLE plans_abonnement ADD COLUMN IF NOT EXISTS "estParDefaut" BOOLEAN DEFAULT FALSE;
ALTER TABLE plans_abonnement ADD COLUMN IF NOT EXISTS "visiblePubliquement" BOOLEAN DEFAULT TRUE;
ALTER TABLE plans_abonnement ADD COLUMN IF NOT EXISTS tarification JSONB DEFAULT '{}'::jsonb;
ALTER TABLE plans_abonnement ADD COLUMN IF NOT EXISTS quotas JSONB DEFAULT '{}'::jsonb;
ALTER TABLE plans_abonnement ADD COLUMN IF NOT EXISTS entitlements JSONB DEFAULT '{}'::jsonb;
ALTER TABLE plans_abonnement ADD COLUMN IF NOT EXISTS "cyclesAutorises" JSONB DEFAULT '["MENSUEL","ANNUEL"]'::jsonb;
ALTER TABLE plans_abonnement ADD COLUMN IF NOT EXISTS essai JSONB DEFAULT '{"autorise": false}'::jsonb;

-- Backfill JSONB depuis les colonnes dures (avant leur suppression).
-- Gardé conditionnel : les bases créées par TypeORM synchronize (entités v3)
-- n'ont jamais eu ces colonnes dures.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans_abonnement' AND column_name = 'maxEleves'
    ) THEN
        UPDATE plans_abonnement SET
            tarification = jsonb_build_object(
                'prixBase', COALESCE("prixBase", 0)::float8,
                'prixParEleve', 0,
                'elevesInclusGratuits', COALESCE("maxEleves", 0),
                'paliers', '[]'::jsonb
            ),
            quotas = jsonb_build_object(
                'eleves', COALESCE("maxEleves", 0),
                'utilisateurs', COALESCE("maxUtilisateurs", 0),
                'classes', COALESCE("maxClasses", 0),
                'stockageGo', COALESCE("stockageMaxGo", 0)::float8,
                'sms', COALESCE("smsInclus", 0)
            ),
            entitlements = jsonb_build_object(
                'modules', CASE WHEN "modulesInclus" IS NULL OR "modulesInclus" = '' THEN '[]'::jsonb ELSE "modulesInclus"::jsonb END,
                'fonctionnalites', CASE WHEN "featureFlags" IS NULL OR "featureFlags" = '' THEN '[]'::jsonb
                    ELSE (SELECT COALESCE(jsonb_agg(k), '[]'::jsonb)
                          FROM jsonb_each_text("featureFlags"::jsonb) AS kv(k, v) WHERE kv.v = 'true') END
            )
        WHERE tarification = '{}'::jsonb;
    END IF;
END $$;

-- Rang dérivé du prix (ordre croissant) pour remplacer les rangs hardcodés
UPDATE plans_abonnement p SET rang = sub.r
FROM (
    SELECT id, (ROW_NUMBER() OVER (ORDER BY COALESCE("prixBase", 0) ASC, "createdAt" ASC))::int - 1 AS r
    FROM plans_abonnement
) sub WHERE p.id = sub.id;

UPDATE plans_abonnement SET "visiblePubliquement" = visible;

-- Suppression brutale des colonnes dures (données migrées en JSONB).
-- Gardée conditionnelle : absentes sur les bases créées par synchronize v3.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans_abonnement' AND column_name = 'maxEleves'
    ) THEN
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "maxEleves";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "maxUtilisateurs";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "maxClasses";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "stockageMaxGo";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "smsInclus";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "toleranceDepassement";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "blocageAuDela";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "plafondMaxEleves";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "modeFacturationTranches";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "prorataImmediat";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "tranchesConfigurables";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "modulesInclus";
        ALTER TABLE plans_abonnement DROP COLUMN IF EXISTS "featureFlags";
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════
-- 3. abonnements_client — cycle varchar + expiration réelle
-- ═══════════════════════════════════════════════════════

ALTER TABLE abonnements_client ALTER COLUMN "cycleFacturation" TYPE VARCHAR(30) USING "cycleFacturation"::text;
ALTER TABLE abonnements_client ALTER COLUMN "cycleFacturation" SET DEFAULT 'MENSUEL';
DROP TYPE IF EXISTS abonnements_client_cyclefacturation_enum;
DROP TYPE IF EXISTS "abonnements_client_cycleFacturation_enum";

UPDATE abonnements_client SET "dateExpirationReelle" = "dateFin"
WHERE statut = 'EXPIRE' AND "dateExpirationReelle" IS NULL;

-- ═══════════════════════════════════════════════════════
-- 4. Nouvelles tables du modèle v3
-- ═══════════════════════════════════════════════════════

-- 4.1 Cycles de facturation configurables (ex-enum dur MENSUEL/ANNUEL)
CREATE TABLE IF NOT EXISTS cycles_facturation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    "nomEn" VARCHAR(100),
    "dureeMois" INT NOT NULL DEFAULT 1,
    "remisePourcent" NUMERIC(5,2) DEFAULT 0,
    actif BOOLEAN DEFAULT TRUE,
    ordre INT DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 4.2 Remises abonnements (CRUD plateforme + stratégie d'application)
CREATE TABLE IF NOT EXISTS remises_abonnement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    nom VARCHAR(150) NOT NULL,
    "typeRemise" VARCHAR(20) NOT NULL DEFAULT 'POURCENTAGE'
        CHECK ("typeRemise" IN ('POURCENTAGE', 'MONTANT_FIXE')),
    valeur NUMERIC(12,2) NOT NULL,
    "dureeApplication" VARCHAR(30) NOT NULL DEFAULT 'PREMIERE_FACTURE'
        CHECK ("dureeApplication" IN ('PREMIERE_FACTURE', 'N_CYCLES', 'PERMANENTE')),
    "nbCycles" INT,
    cible VARCHAR(20) NOT NULL DEFAULT 'GLOBAL'
        CHECK (cible IN ('GLOBAL', 'PLAN', 'TENANT', 'CYCLE')),
    "cibleId" UUID,
    "cibleCycle" VARCHAR(30),
    "dateDebut" TIMESTAMPTZ DEFAULT now(),
    "dateFin" TIMESTAMPTZ,
    "maxUtilisations" INT,
    utilisations INT DEFAULT 0,
    cumulable BOOLEAN DEFAULT FALSE,
    priorite INT DEFAULT 0,
    "codeCoupon" VARCHAR(100),
    actif BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_remises_cible ON remises_abonnement(cible, "cibleId");
CREATE INDEX IF NOT EXISTS idx_remises_actif ON remises_abonnement(actif);
CREATE INDEX IF NOT EXISTS idx_remises_coupon ON remises_abonnement("codeCoupon") WHERE "codeCoupon" IS NOT NULL;

-- 4.3 Packs de quota achetables au dépassement
CREATE TABLE IF NOT EXISTS packs_quota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    nom VARCHAR(150) NOT NULL,
    ressource VARCHAR(100) NOT NULL,
    quantite INT NOT NULL,
    prix NUMERIC(12,2) NOT NULL DEFAULT 0,
    devise VARCHAR(10) DEFAULT 'XAF',
    "dureeValidite" VARCHAR(20) NOT NULL DEFAULT 'CYCLE_COURANT'
        CHECK ("dureeValidite" IN ('CYCLE_COURANT', 'ILLIMITE')),
    description TEXT,
    actif BOOLEAN DEFAULT TRUE,
    ordre INT DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_packs_ressource ON packs_quota(ressource);

-- 4.4 Packs souscrits par abonnement
CREATE TABLE IF NOT EXISTS abonnements_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "abonnementId" UUID NOT NULL REFERENCES abonnements_client(id) ON DELETE CASCADE,
    "packId" UUID NOT NULL REFERENCES packs_quota(id) ON DELETE RESTRICT,
    "dateSouscription" TIMESTAMPTZ DEFAULT now(),
    "dateFin" TIMESTAMPTZ,
    "montantFacture" NUMERIC(12,2) DEFAULT 0,
    actif BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_abo_packs_abonnement ON abonnements_packs("abonnementId");

-- 4.5 Stratégies d'expiration (phases configurables)
CREATE TABLE IF NOT EXISTS strategies_expiration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    nom VARCHAR(150) NOT NULL,
    phases JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- [{ nom, jours, comportement: 'READ_ONLY' | 'LOCKED' | 'ARCHIVED' }]
    "planSlug" VARCHAR(100),
    "estDefaut" BOOLEAN DEFAULT FALSE,
    actif BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 4.6 Usage unifié (fusion quotas_utilisation + usage_meters)
CREATE TABLE IF NOT EXISTS usage_unifie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" UUID NOT NULL,
    ressource VARCHAR(100) NOT NULL,
    periode VARCHAR(7) NOT NULL DEFAULT 'GLOBAL',
    consommation INT NOT NULL DEFAULT 0,
    source VARCHAR(30) NOT NULL DEFAULT 'QUOTA',
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now(),
    UNIQUE ("etablissementId", ressource, periode)
);
CREATE INDEX IF NOT EXISTS idx_usage_unifie_etab ON usage_unifie("etablissementId");

-- ═══════════════════════════════════════════════════════
-- 5. Bascule des données d'usage puis suppression des doublons
-- ═══════════════════════════════════════════════════════

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='quotas_utilisation') THEN
        EXECUTE '
            INSERT INTO usage_unifie ("etablissementId", ressource, periode, consommation, source)
            SELECT "etablissementId", "typeQuota", ''GLOBAL'', "utilisationActuelle", ''QUOTA''
            FROM quotas_utilisation
            ON CONFLICT ("etablissementId", ressource, periode) DO UPDATE
            SET consommation = EXCLUDED.consommation, "updatedAt" = now()
        ';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='usage_meters') THEN
        EXECUTE '
            INSERT INTO usage_unifie ("etablissementId", ressource, periode, consommation, source)
            SELECT "etablissementId", "moduleNom", periode, consommation, ''METER''
            FROM usage_meters
            ON CONFLICT ("etablissementId", ressource, periode) DO UPDATE
            SET consommation = usage_unifie.consommation + EXCLUDED.consommation, "updatedAt" = now()
        ';
    END IF;
END $$;
DROP TABLE IF EXISTS tranches_eleves CASCADE;
DROP TABLE IF EXISTS tranches_supplement CASCADE;
DROP TABLE IF EXISTS tranches_groupe CASCADE;
DROP TABLE IF EXISTS modules_optionnels CASCADE;
DROP TABLE IF EXISTS quotas_utilisation CASCADE;
DROP TABLE IF EXISTS usage_meters CASCADE;

-- abonnements_modules référençait modules_optionnels (supprimée) :
-- purge des orphelins + réancrage sur le catalogue unique
TRUNCATE TABLE abonnements_modules;
ALTER TABLE abonnements_modules DROP CONSTRAINT IF EXISTS abonnements_modules_moduleoptionnelid_fkey;
ALTER TABLE abonnements_modules
    ADD CONSTRAINT abonnements_modules_module_catalogue_fkey
    FOREIGN KEY ("moduleOptionnelId") REFERENCES modules_catalogue(id) ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════
-- 6. Plan Découverte + invariant « tout tenant a un abonnement actif »
-- ═══════════════════════════════════════════════════════

-- Nettoyage des plans invalides (slug vide — artefacts de synchronize/seed)
DELETE FROM abonnements_client
WHERE "planId" IN (SELECT id FROM plans_abonnement WHERE slug IS NULL OR slug = '');
DELETE FROM plans_abonnement WHERE slug IS NULL OR slug = '';

INSERT INTO plans_abonnement (id, nom, slug, description, "prixBase", devise, statut, visible, ordre, actif,
    rang, "estParDefaut", "visiblePubliquement", tarification, quotas, entitlements, "cyclesAutorises", essai, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Découverte', 'decouverte',
    'Plan gratuit de base — accès permanent aux modules cœur pour démarrer.',
    0, 'XAF', 'ACTIF', TRUE, 0, TRUE,
    0, FALSE, TRUE,
    '{"prixBase": 0, "prixParEleve": 0, "elevesInclusGratuits": 50, "paliers": []}'::jsonb,
    '{"eleves": 50, "utilisateurs": 10, "classes": 3, "stockageGo": 1, "sms": 0}'::jsonb,
    '{"modules": ["eleves", "classes", "notes", "bulletins", "annees-scolaires", "messagerie"], "fonctionnalites": []}'::jsonb,
    '["MENSUEL"]'::jsonb, '{"autorise": false}'::jsonb, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM plans_abonnement WHERE slug = 'decouverte');

-- Un abonnement ACTIF Découverte pour tout établissement orphelin
INSERT INTO abonnements_client (id, "etablissementId", "planId", "dateDebut", "dateFin", statut,
    "cycleFacturation", "autoRenouvellement", "montantMensuel", "nombreElevesActuel", "createdAt", "updatedAt")
SELECT gen_random_uuid(), e.id, p.id, now(), now() + interval '100 years', 'ACTIF',
    'MENSUEL', TRUE, 0, 0, now(), now()
FROM etablissements e
CROSS JOIN (SELECT id FROM plans_abonnement WHERE slug = 'decouverte' LIMIT 1) p
WHERE NOT EXISTS (
    SELECT 1 FROM abonnements_client a
    WHERE a."etablissementId" = e.id AND a.statut IN ('ACTIF', 'ESSAI')
);

-- ═══════════════════════════════════════════════════════
-- 7. Données par défaut : cycles, stratégie d'expiration, packs
-- ═══════════════════════════════════════════════════════

INSERT INTO cycles_facturation (code, nom, "nomEn", "dureeMois", "remisePourcent", actif, ordre)
SELECT * FROM (VALUES
    ('MENSUEL', 'Mensuel', 'Monthly', 1, 0.00, TRUE, 1),
    ('TRIMESTRIEL', 'Trimestriel', 'Quarterly', 3, 5.00, TRUE, 2),
    ('SEMESTRIEL', 'Semestriel', 'Semi-annual', 6, 7.50, TRUE, 3),
    ('ANNUEL', 'Annuel', 'Yearly', 12, 10.00, TRUE, 4)
) AS v(code, nom, "nomEn", "dureeMois", "remisePourcent", actif, ordre)
WHERE NOT EXISTS (SELECT 1 FROM cycles_facturation c WHERE c.code = v.code);

INSERT INTO strategies_expiration (code, nom, phases, "planSlug", "estDefaut", actif)
SELECT 'standard', 'Dégradation gracieuse standard (30 jours)',
    '[{"nom": "LECTURE_SEULE", "jours": 15, "comportement": "READ_ONLY"},
      {"nom": "VERROUILLE", "jours": 15, "comportement": "LOCKED"},
      {"nom": "ARCHIVE", "jours": null, "comportement": "ARCHIVED"}]'::jsonb,
    NULL, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM strategies_expiration WHERE code = 'standard');

INSERT INTO packs_quota (code, nom, ressource, quantite, prix, devise, "dureeValidite", actif, ordre)
SELECT * FROM (VALUES
    ('PACK_ELEVES_50', 'Pack +50 élèves', 'eleves', 50, 5000.00, 'XAF', 'CYCLE_COURANT', TRUE, 1),
    ('PACK_ELEVES_200', 'Pack +200 élèves', 'eleves', 200, 18000.00, 'XAF', 'CYCLE_COURANT', TRUE, 2),
    ('PACK_STOCKAGE_10GO', 'Pack +10 Go stockage', 'stockageGo', 10, 3000.00, 'XAF', 'ILLIMITE', TRUE, 3),
    ('PACK_SMS_500', 'Pack 500 SMS', 'sms', 500, 7500.00, 'XAF', 'CYCLE_COURANT', TRUE, 4)
) AS v(code, nom, ressource, quantite, prix, devise, "dureeValidite", actif, ordre)
WHERE NOT EXISTS (SELECT 1 FROM packs_quota p WHERE p.code = v.code);

-- ═══════════════════════════════════════════════════════
-- 8. Fonctionnalités — catégorie commerciale binaire (§5.8)
--    Les feature flags deviennent des « Fonctionnalités » de 1er rang
--    du marché : GRATUIT | PAYANT (tables conservées, enum technique intact).
-- ═══════════════════════════════════════════════════════

ALTER TABLE feature_flag_definitions
    ADD COLUMN IF NOT EXISTS "categorieCommerciale" VARCHAR(10) NOT NULL DEFAULT 'PAYANT';

-- ═══════════════════════════════════════════════════════
-- 9. Paramètres billing persistés
-- ═══════════════════════════════════════════════════════

INSERT INTO parametres_systeme (id, cle, valeur, "typeValeur", description, "createdAt", "updatedAt")
SELECT gen_random_uuid(), v.cle, v.valeur, v.type_valeur::parametres_systeme_typevaleur_enum, v.description, now(), now()
FROM (VALUES
    ('billing.onboarding_mode', 'CHOIX_PLAN', 'STRING', 'Mode d''inscription tenant : CHOIX_PLAN | PLAN_DEFAUT | ESSAI_AUTO'),
    ('billing.essai.duree_jours', '14', 'NUMBER', 'Durée par défaut de la période d''essai (jours)'),
    ('billing.essai.quota_reduit', 'false', 'BOOLEAN', 'Appliquer des quotas réduits pendant l''essai'),
    ('billing.expiration.strategie_code', 'standard', 'STRING', 'Stratégie d''expiration appliquée par défaut')
) AS v(cle, valeur, type_valeur, description)
WHERE NOT EXISTS (
    SELECT 1 FROM parametres_systeme ps WHERE ps.cle = v.cle AND ps."etablissementId" IS NULL
);

COMMIT;
