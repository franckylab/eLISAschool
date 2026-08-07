-- ==================================
-- eLISAschool - Fix index UQ_jours_feries_nom_pays_etab
-- ==================================
-- Migration 151 :
-- L'index unique (nom, pays, etablissementId) WHERE etablissementId IS NOT NULL
-- est trop large : il bloque les JF non récurrents de même nom (variables par année).
-- Nouvel index : uniquement sur les récurrents (estRecurrent = true).
-- ==================================

-- ─── 1. Supprimer l'ancien index (trop large) ─────────
DROP INDEX IF EXISTS "UQ_jours_feries_nom_pays_etab";

-- ─── 2. Nettoyer les doublons récurrents existants ─────────
-- Un même JF récurrent (nom+pays) ne doit exister qu'une fois par établissement.
DELETE FROM jours_feries
WHERE "etablissementId" IS NOT NULL
  AND "estRecurrent" = true
  AND id NOT IN (
    SELECT DISTINCT ON ("nom", "pays", "etablissementId") id
    FROM jours_feries
    WHERE "etablissementId" IS NOT NULL
      AND "estRecurrent" = true
    ORDER BY "nom", "pays", "etablissementId", "createdAt" ASC
  );

-- ─── 3. Recréer l'index partiel (récurrents uniquement) ─────────
-- Les JF non récurrents (variables par année) partagent le même nom
-- mais ont des dates différentes → pas contraints par cet index.
CREATE UNIQUE INDEX "UQ_jours_feries_nom_pays_etab"
    ON jours_feries ("nom", "pays", "etablissementId")
    WHERE "etablissementId" IS NOT NULL AND "estRecurrent" = true;
