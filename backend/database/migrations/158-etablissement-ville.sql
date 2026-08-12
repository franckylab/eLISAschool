-- =============================================
-- Migration 158 — Ajout colonne ville sur etablissements
-- =============================================
-- Permet le filtrage et l'affichage direct de la ville
-- sans extraction depuis le champ adresse (texte libre).
-- =============================================

ALTER TABLE "etablissements"
ADD COLUMN IF NOT EXISTS "ville" VARCHAR(100);

-- Index pour les recherches par ville (utile pour le filtrage plateforme)
CREATE INDEX IF NOT EXISTS "idx_etablissements_ville"
ON "etablissements" ("ville");
