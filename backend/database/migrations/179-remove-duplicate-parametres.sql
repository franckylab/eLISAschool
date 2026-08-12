-- ============================================
-- eLISAschool - Suppression doublons paramètres
-- ============================================
-- Supprime TOUS les doublons de parametres_systeme (globaux uniquement).
-- Garde la ligne avec le plus petit id (premier créé).
-- Ajoute une contrainte UNIQUE pour empêcher les futurs doublons.
--
-- Version: 1.2.0
-- Auteur: franck arlos chendjou
-- Date: 2026-08-12
-- ============================================

BEGIN;

-- ============================================
-- 1. Supprimer les doublons (garder le premier id par clé)
-- ============================================
DELETE FROM parametres_systeme
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY cle ORDER BY "createdAt" ASC) as rn
        FROM parametres_systeme
        WHERE "etablissementId" IS NULL
    ) sub
    WHERE rn > 1
);

-- ============================================
-- 2. Supprimer les paramètres utilisateurs.* dupliqués avec auth.*
-- ============================================
DELETE FROM parametres_systeme
WHERE cle IN (
    'utilisateurs.allow_self_registration',
    'utilisateurs.require_email_verification'
);

-- ============================================
-- 3. Contrainte UNIQUE pour empêcher les futurs doublons
-- ============================================
ALTER TABLE parametres_systeme DROP CONSTRAINT IF EXISTS uq_parametre_cle_etablissement;

ALTER TABLE parametres_systeme 
ADD CONSTRAINT uq_parametre_cle_etablissement 
UNIQUE (cle, "etablissementId");

-- ============================================
-- 4. Vérification
-- ============================================
SELECT 
    COUNT(*) as total_lignes,
    COUNT(DISTINCT cle) as cles_uniques,
    COUNT(*) - COUNT(DISTINCT cle) as doublons_restants
FROM parametres_systeme
WHERE "etablissementId" IS NULL;

COMMIT;
