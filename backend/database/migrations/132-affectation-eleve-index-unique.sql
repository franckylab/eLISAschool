-- ==================================
-- eLISAschool - Migration 132
-- Index unique partiel sur affectations_eleves (eleveId, anneeScolaireId) WHERE actif = true
-- ==================================
-- Idempotente. Étapes :
--   1. Dédupliquer les affectations actives multiples (garder la plus récente par (eleveId, anneeScolaireId))
--   2. Créer l'index unique partiel

-- 1. Déduplication : désactiver les doublons actifs (conserver la ligne la plus récente)
WITH doublons AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY "eleveId", "anneeScolaireId"
               ORDER BY "createdAt" DESC, id DESC
           ) AS rn
    FROM affectations_eleves
    WHERE "actif" = true
)
UPDATE affectations_eleves ae
SET "actif" = false,
    "statut" = 'INACTIVE',
    "updatedAt" = NOW()
FROM doublons d
WHERE ae.id = d.id
  AND d.rn > 1;

-- 2. Index unique partiel : un seul enregistrement actif par élève et par année scolaire
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_affectations_eleves_actif_unique"
    ON affectations_eleves ("eleveId", "anneeScolaireId")
    WHERE "actif" = true;
