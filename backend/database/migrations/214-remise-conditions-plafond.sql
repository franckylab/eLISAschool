-- ================================================
-- Migration 214 — Remise conditions (v3.1)
-- ================================================
-- Ajoute les colonnes conditionnelles sur remises_abonnement :
--   - condition_eleves_min : nombre minimum d'élèves pour éligibilité
--   - condition_anciennete_mois : ancienneté minimum en mois révolus
--
-- Met à jour les remises volume et fidélité existantes avec leurs conditions.
--
-- Version: 3.1.0
-- Auteur: franck arlos chendjou
-- ================================================

-- 1. Ajouter les colonnes conditionnelles
ALTER TABLE remises_abonnement
    ADD COLUMN IF NOT EXISTS condition_eleves_min INTEGER,
    ADD COLUMN IF NOT EXISTS condition_anciennete_mois INTEGER;

-- 2. Mettre à jour les remises de volume avec leurs seuils
UPDATE remises_abonnement
    SET condition_eleves_min = 500
    WHERE code = 'VOL-500' AND condition_eleves_min IS NULL;

UPDATE remises_abonnement
    SET condition_eleves_min = 1000
    WHERE code = 'VOL-1000' AND condition_eleves_min IS NULL;

-- 3. Mettre à jour les remises de fidélité avec leur ancienneté
UPDATE remises_abonnement
    SET condition_anciennete_mois = 12
    WHERE code = 'FID-12M' AND condition_anciennete_mois IS NULL;

UPDATE remises_abonnement
    SET condition_anciennete_mois = 24
    WHERE code = 'FID-24M' AND condition_anciennete_mois IS NULL;

-- 4. Index pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_remises_condition_eleves
    ON remises_abonnement (condition_eleves_min)
    WHERE condition_eleves_min IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_remises_condition_anciennete
    ON remises_abonnement (condition_anciennete_mois)
    WHERE condition_anciennete_mois IS NOT NULL;
