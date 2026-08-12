-- Migration 184: Historique scores santé établissement
-- Permet de stocker les snapshots de score à chaque recalcul
-- pour visualisation de l'évolution dans le temps (sparkline)

CREATE TABLE IF NOT EXISTS historique_score_sante (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "etablissementId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "categorie" VARCHAR(20) NOT NULL,
    "scoreAbonnement" INTEGER,
    "scorePaiements" INTEGER,
    "scoreActivite" INTEGER,
    "scoreModules" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes par établissement
CREATE INDEX IF NOT EXISTS idx_historique_score_etablissement ON historique_score_sante ("etablissementId");

-- Index pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_historique_score_created ON historique_score_sante ("createdAt");

-- Index composite pour les requêtes par établissement + date
CREATE INDEX IF NOT EXISTS idx_historique_score_etablissement_created ON historique_score_sante ("etablissementId", "createdAt" DESC);
