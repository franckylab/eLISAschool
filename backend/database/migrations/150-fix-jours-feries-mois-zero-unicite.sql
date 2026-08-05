-- ==================================
-- eLISAschool - Fix Jours Fériés : mois=0 + unicité
-- ==================================
-- Migration 150 :
-- 1. Convertir les JF chrétiens variables (mois=0, jourMois=0, estRecurrent=true)
--    en estRecurrent=false (dates variables, non récurrentes)
-- 2. Ajouter contrainte UNIQUE partielle (nom + pays) pour les copies établissement
-- 3. Nettoyer les entrées orphelines (estRecurrent=true ET mois=0)
-- Version: 1.0.0
-- ==================================

-- ─── 1. Fix JF chrétiens variables (mois=0 invalide) ─────────
-- Ces JF (Lundi de Pâques, Ascension, Lundi de Pentecôte, Vendredi Saint)
-- sont marqués estRecurrent=true avec mois=0/jourMois=0 par erreur.
-- Ils sont variables chaque année → ne peuvent pas être récurrents mois/jourMois.
-- Les dates ponctuelles 2025-2027 existent déjà en parallèle.

UPDATE jours_feries
SET "estRecurrent" = false,
    "mois" = NULL,
    "jourMois" = NULL,
    "description" = COALESCE("description", 'Calendrier chrétien — variable') || ' (récurrent via dates ponctuelles)',
    "updatedAt" = NOW()
WHERE "estRecurrent" = true
  AND "mois" = 0
  AND "jourMois" = 0;

-- ─── 2. Sécurité : nettoyer TOUTE entrée récurrente avec mois invalide ───
-- (au cas où d'autres entrées mois=0 auraient échappé au fix ci-dessus)
UPDATE jours_feries
SET "estRecurrent" = false,
    "mois" = NULL,
    "jourMois" = NULL,
    "updatedAt" = NOW()
WHERE "estRecurrent" = true
  AND ("mois" IS NULL OR "mois" = 0)
  AND ("jourMois" IS NULL OR "jourMois" = 0);

-- ─── 3. Supprimer les doublons (nom + pays + etablissementId) ─────────
-- Les modèles de pays ont pu être chargés plusieurs fois.
-- On garde le plus ancien (MIN("createdAt")) par groupe.

DELETE FROM jours_feries
WHERE "etablissementId" IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (nom, pays, "etablissementId") id
    FROM jours_feries
    WHERE "etablissementId" IS NOT NULL
    ORDER BY nom, pays, "etablissementId", "createdAt" ASC
  );

-- ─── 4. Contrainte UNIQUE partielle (nom + pays) pour copies établissement ─
-- Empêche le double-chargement d'un même modèle pour un même établissement.
-- Les entrées système globales (etablissementId IS NULL) ne sont PAS contraintes
-- (plusieurs pays peuvent avoir le même nom de JF, ex: "Nouvel An").
-- Note : PostgreSQL traite NULL IS DISTINCT dans les index partiels.

CREATE UNIQUE INDEX IF NOT EXISTS "UQ_jours_feries_nom_pays_etab"
    ON jours_feries ("nom", "pays", "etablissementId")
    WHERE "etablissementId" IS NOT NULL;
