-- ==================================
-- Migration 156 — Billing Configurable Avancé
-- ==================================
-- Phase 3.1-3.2 — Refonte SaaS v5
--
-- Ajoute les capacités de configuration avancée du billing :
--   1. Colonne `estCustomisable` sur tranches_eleves
--   2. Colonne `tranchesConfigurables` sur plans_abonnement
--   3. Table `tranches_supplement` (overrides par établissement)
--
-- Migration idempotente — peut être relancée sans erreur.
-- ==================================

-- 1. Ajouter estCustomisable aux tranches du plan
ALTER TABLE tranches_eleves ADD COLUMN IF NOT EXISTS "estCustomisable" boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN tranches_eleves."estCustomisable" IS
    'Indique si cette tranche peut être customisée par l''établissement (override)';

-- 2. Ajouter tranchesConfigurables aux plans d'abonnement
ALTER TABLE plans_abonnement ADD COLUMN IF NOT EXISTS "tranchesConfigurables" boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN plans_abonnement."tranchesConfigurables" IS
    'Active la customisation des tranches par établissement pour ce plan';

-- 3. Créer la table des tranches supplément (overrides par établissement)
CREATE TABLE IF NOT EXISTS tranches_supplement (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" uuid NOT NULL,
    ordre int NOT NULL DEFAULT 0,
    "minEleves" int NOT NULL,
    "maxEleves" int,
    "montantSupplementaire" int NOT NULL,
    label varchar(100),
    actif boolean NOT NULL DEFAULT true,
    "trancheOriginaleId" uuid,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Index unique par établissement + ordre
CREATE UNIQUE INDEX IF NOT EXISTS idx_tranches_supplement_etab_ordre
    ON tranches_supplement ("etablissementId", ordre);

-- Index pour les recherches par établissement
CREATE INDEX IF NOT EXISTS idx_tranches_supplement_etablissement
    ON tranches_supplement ("etablissementId");

-- Contrainte FK optionnelle vers la tranche originale
COMMENT ON TABLE tranches_supplement IS
    'Overrides de tranches par établissement — cascade : établissement → plan → système';
