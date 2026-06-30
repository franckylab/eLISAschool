-- Migration 100 : Ajout de sallePrincipale à la table classes
-- Description : Ajoute le champ salle principale à l'entité Classe (modèle permanent)
-- Date : 2026-06-30
-- Auteur : eLISAschool

BEGIN;

-- Ajouter la colonne sallePrincipale si elle n'existe pas
ALTER TABLE classes ADD COLUMN IF NOT EXISTS "sallePrincipale" VARCHAR(100);

-- Index pour les recherches par salle
CREATE INDEX IF NOT EXISTS idx_classes_salle_principale ON classes ("sallePrincipale");

COMMIT;
