-- ==================================
-- eLISAschool - Migration 163 : Providers paiement dynamiques
-- ==================================
-- Lot D v7 — Refonte SaaS
--
-- Crée la table `providers_paiement` pour la gestion centralisée
-- des providers de paiement au niveau plateforme.
-- Les credentials sont chiffrés AES-256-GCM avant stockage.
--
-- Scope : plateforme (SUPER_ADMIN)
-- Assignation : par plan ou par établissement
-- ==================================

-- 1. Table providers_paiement (plateforme)
CREATE TABLE IF NOT EXISTS providers_paiement (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "nom" varchar(100) NOT NULL,
    "slug" varchar(50) NOT NULL UNIQUE,
    "type" varchar(30) NOT NULL, -- 'mobile_money', 'card', 'bank_transfer', 'mixed'
    "icone" varchar(200),
    "description" text,
    "canaux" jsonb NOT NULL DEFAULT '[]', -- ["mtn_momo", "orange_money", "wave", "paystack", "flutterwave", "stripe", "manuel"]
    "credentials" text NOT NULL, -- JSON chiffré AES-256-GCM
    "webhookSecret" text, -- chiffré AES-256-GCM
    "sandbox" boolean NOT NULL DEFAULT true,
    "actif" boolean NOT NULL DEFAULT true,
    "metadata" jsonb, -- Infos supplémentaires (URLs API, etc.)
    "creePar" uuid,
    "creeAt" timestamptz NOT NULL DEFAULT now(),
    "majAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_providers_paiement_slug
    ON providers_paiement ("slug");

CREATE INDEX IF NOT EXISTS idx_providers_paiement_actif
    ON providers_paiement ("actif");

COMMENT ON TABLE providers_paiement IS
    'Providers de paiement centralisés (plateforme). Credentials chiffrés AES-256-GCM.';

-- 2. Table assignment providers → plans/établissements
CREATE TABLE IF NOT EXISTS provider_assignments (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "providerId" uuid NOT NULL REFERENCES providers_paiement(id) ON DELETE CASCADE,
    "scope" varchar(20) NOT NULL DEFAULT 'global', -- 'global', 'plan', 'etablissement'
    "planId" uuid REFERENCES plans_abonnement(id) ON DELETE CASCADE,
    "etablissementId" uuid,
    "priorite" int NOT NULL DEFAULT 0, -- Ordre de résolution (plus élevé = priorité)
    "actif" boolean NOT NULL DEFAULT true,
    "creeAt" timestamptz NOT NULL DEFAULT now(),
    "majAt" timestamptz NOT NULL DEFAULT now(),
    UNIQUE ("providerId", "scope", "planId", "etablissementId")
);

CREATE INDEX IF NOT EXISTS idx_provider_assignments_provider
    ON provider_assignments ("providerId");

CREATE INDEX IF NOT EXISTS idx_provider_assignments_scope
    ON provider_assignments ("scope");

COMMENT ON TABLE provider_assignments IS
    'Assignment des providers aux plans/établissements. Cascade : global → plan → établissement.';
