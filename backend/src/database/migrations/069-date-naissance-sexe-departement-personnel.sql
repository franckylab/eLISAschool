/**
 * ==================================
 * eLISAschool - Migration: Ajout dateNaissance, sexe, departement sur personnel
 * ==================================
 * Version: 1.0.0
 *
 * OBJECTIF:
 * - Ajouter les colonnes dateNaissance, sexe, departement à la table membres_personnel
 * - Permettre la persistance de ces champs lors de la création/édition d'un enseignant
 *
 * CONTEXTE:
 * - Les champs nom/prenom/email/telephone/adresse ont déjà été dénormalisés
 * - dateNaissance et sexe (genre) étaient uniquement sur ProfilUtilisateur, jamais persistés sur MembrePersonnel
 * - departement était un champ type-only sans colonne DB
 */

-- ========================================
-- ÉTAPE 1: Ajouter les colonnes
-- ========================================

ALTER TABLE membres_personnel
ADD COLUMN IF NOT EXISTS "dateNaissance" date,
ADD COLUMN IF NOT EXISTS sexe varchar(10),
ADD COLUMN IF NOT EXISTS departement varchar(200);

-- ========================================
-- ÉTAPE 2: Copier les données existantes depuis ProfilUtilisateur (si disponible)
-- ========================================

UPDATE membres_personnel mp
SET
    "dateNaissance" = pu."dateNaissance",
    sexe = pu.genre
FROM utilisateurs u
JOIN profils_utilisateurs pu ON pu."utilisateurId" = u.id
WHERE mp."utilisateurId" = u.id
  AND (mp."dateNaissance" IS NULL OR mp.sexe IS NULL);

-- ========================================
-- ÉTAPE 3: Vérification
-- ========================================

SELECT
    COUNT(*) AS total_membres,
    COUNT("dateNaissance") AS avec_date_naissance,
    COUNT(sexe) AS avec_sexe,
    COUNT(departement) AS avec_departement
FROM membres_personnel;
