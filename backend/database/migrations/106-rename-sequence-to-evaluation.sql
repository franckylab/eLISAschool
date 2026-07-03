-- ==================================
-- eLISAschool - Migration 106 : Nettoyage SEQUENCE → EVALUATION
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
--
-- Finalise le rename SEQUENCE → EVALUATION dans les données persistées :
-- - Copie les surcharges établissement de label_sequence vers label_evaluation
-- - Supprime l'ancienne clé label_sequence
-- - Met à jour les labels des niveaux persistés
-- ==================================

BEGIN;

-- =============================================
-- 1. PARAMÈTRES SYSTÈME — Migrer les surcharges
-- =============================================
INSERT INTO parametres_systeme (cle, valeur, description, categorie, module, "typeValeur", "etablissementId")
SELECT
    'periodes.label_evaluation',
    valeur,
    'Libellé personnalisé pour le type EVALUATION',
    categorie,
    module,
    "typeValeur",
    "etablissementId"
FROM parametres_systeme
WHERE cle = 'periodes.label_sequence'
  AND "etablissementId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM parametres_systeme ps2
      WHERE ps2.cle = 'periodes.label_evaluation'
        AND ps2."etablissementId" = parametres_systeme."etablissementId"
  );

DELETE FROM parametres_systeme WHERE cle = 'periodes.label_sequence';

-- =============================================
-- 2. NIVEAUX — Mettre à jour les labels persistés
-- =============================================
UPDATE niveaux_periode
SET label = 'Évaluation'
WHERE label = 'Séquence';

COMMIT;
