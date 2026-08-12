-- ==================================
-- Migration 185 — Auto-renouvellement abonnement
-- ==================================
-- Ajoute le champ autoRenouvellement à la table etablissement_config
-- pour le suivi du renouvellement automatique des abonnements SaaS.

ALTER TABLE "etablissement_config"
    ADD COLUMN IF NOT EXISTS "autoRenouvellement" boolean NOT NULL DEFAULT false;
