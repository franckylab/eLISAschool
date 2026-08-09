-- ==================================
-- eLISAschool - Migration 162 : Groupes SaaS (Lot C v7)
-- ==================================
-- Ajoute les tables de configuration SaaS par groupe d'établissements :
--   - modules_groupe : override modules par groupe
--   - tranches_groupe : override tranches de pricing par groupe
--   - feature_flags_groupe : feature flags par groupe
--   - abonnements_groupe : plan d'abonnement du groupe
--   - parametres_systeme.groupeEtablissementId : paramètres scopés groupe
--
-- Cascade : groupe → plan → établissement → catalogue/système
--
-- Idempotent : CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS
-- ==================================

-- 1. ModulesGroupe — Override des modules par groupe
CREATE TABLE IF NOT EXISTS modules_groupe (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "groupeEtablissementId" uuid NOT NULL REFERENCES groupes_etablissements(id) ON DELETE CASCADE,
    "moduleCatalogueId" uuid NOT NULL REFERENCES modules_catalogue(id) ON DELETE CASCADE,
    "actif" boolean NOT NULL DEFAULT true,
    "creePar" uuid,
    "creeAt" timestamptz NOT NULL DEFAULT now(),
    "majAt" timestamptz NOT NULL DEFAULT now(),
    UNIQUE ("groupeEtablissementId", "moduleCatalogueId")
);

CREATE INDEX IF NOT EXISTS idx_modules_groupe_groupe
    ON modules_groupe ("groupeEtablissementId");

COMMENT ON TABLE modules_groupe IS
    'Override des modules du catalogue par groupe. Cascade : groupe → plan → étab → catalogue.';

-- 2. TrancheGroupe — Override des tranches de pricing par groupe
CREATE TABLE IF NOT EXISTS tranches_groupe (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "groupeEtablissementId" uuid NOT NULL REFERENCES groupes_etablissements(id) ON DELETE CASCADE,
    "ordre" int NOT NULL DEFAULT 0,
    "minEleves" int NOT NULL,
    "maxEleves" int,
    "montantSupplementaire" int NOT NULL DEFAULT 0,
    "label" varchar(200),
    "actif" boolean NOT NULL DEFAULT true,
    "trancheOriginaleId" uuid,
    "creeAt" timestamptz NOT NULL DEFAULT now(),
    "majAt" timestamptz NOT NULL DEFAULT now(),
    UNIQUE ("groupeEtablissementId", "ordre")
);

CREATE INDEX IF NOT EXISTS idx_tranches_groupe_groupe
    ON tranches_groupe ("groupeEtablissementId");

COMMENT ON TABLE tranches_groupe IS
    'Override des tranches de pricing par groupe. Cascade entre tranche_supplement (étab) et tranche_eleves (plan).';

-- 3. FeatureFlagGroupe — Feature flags activés au niveau groupe
CREATE TABLE IF NOT EXISTS feature_flags_groupe (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "groupeEtablissementId" uuid NOT NULL REFERENCES groupes_etablissements(id) ON DELETE CASCADE,
    "cle" varchar(100) NOT NULL,
    "actif" boolean NOT NULL DEFAULT true,
    "creeAt" timestamptz NOT NULL DEFAULT now(),
    "majAt" timestamptz NOT NULL DEFAULT now(),
    UNIQUE ("groupeEtablissementId", "cle")
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_groupe
    ON feature_flags_groupe ("groupeEtablissementId");

-- 4. AbonnementGroupe — Plan d'abonnement du groupe
CREATE TABLE IF NOT EXISTS abonnements_groupe (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "groupeEtablissementId" uuid NOT NULL REFERENCES groupes_etablissements(id) ON DELETE CASCADE,
    "planId" uuid NOT NULL REFERENCES plans_abonnement(id),
    "statut" varchar(30) NOT NULL DEFAULT 'ACTIF',
    "modeFacturation" varchar(20) NOT NULL DEFAULT 'consolidee',
    "tarifDegressif" jsonb,
    "repartitionFacturation" varchar(30) NOT NULL DEFAULT 'proportionnelle',
    "dateDebut" date NOT NULL DEFAULT CURRENT_DATE,
    "dateFin" date,
    "creePar" uuid,
    "creeAt" timestamptz NOT NULL DEFAULT now(),
    "majAt" timestamptz NOT NULL DEFAULT now(),
    UNIQUE ("groupeEtablissementId")
);

CREATE INDEX IF NOT EXISTS idx_abonnements_groupe_plan
    ON abonnements_groupe ("planId");

COMMENT ON TABLE abonnements_groupe IS
    'Abonnement SaaS du groupe. modeFacturation: consolidee|individuelle|hybride. repartitionFacturation: egale|proportionnelle|personnalisee.';

-- 5. Colonne groupeEtablissementId sur parametres_systeme
ALTER TABLE parametres_systeme
    ADD COLUMN IF NOT EXISTS "groupeEtablissementId" uuid
    REFERENCES groupes_etablissements(id) ON DELETE CASCADE;

COMMENT ON COLUMN parametres_systeme."groupeEtablissementId" IS
    'Scope groupe pour les paramètres système. NULL = global ou établissement.';

-- 6. Index pour les paramètres scopés groupe
CREATE INDEX IF NOT EXISTS idx_params_systeme_groupe
    ON parametres_systeme ("groupeEtablissementId")
    WHERE "groupeEtablissementId" IS NOT NULL;
