/**
 * ==================================
 * eLISAschool - Migration 080 : Multi-tenant préférences utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Ajout du champ etablissementId pour persistance des préférences
 * DataTable par établissement (multi-tenant).
 */

-- Ajout de la colonne etablissementId (nullable pour compatibilité ascendante)
ALTER TABLE preferences_utilisateur 
ADD COLUMN IF NOT EXISTS etablissementId UUID;

-- Index pour performance des requêtes par utilisateur + établissement
CREATE INDEX IF NOT EXISTS idx_preferences_utilisateur_etablissement 
ON preferences_utilisateur(etablissementId);

-- Mise à jour de la contrainte unique pour inclure etablissementId
-- D'abord supprimer l'ancienne contrainte
ALTER TABLE preferences_utilisateur 
DROP CONSTRAINT IF EXISTS "preferences_utilisateur_utilisateurId_cle_key";

-- Recréer la contrainte unique avec etablissementId
ALTER TABLE preferences_utilisateur 
ADD CONSTRAINT "preferences_utilisateur_utilisateurId_cle_etablissementId_key" 
UNIQUE ("utilisateurId", cle, "etablissementId");

-- Index composite pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_preferences_utilisateur_user_cle_etablissement 
ON preferences_utilisateur("utilisateurId", cle, "etablissementId");

-- Commentaire pour documentation
COMMENT ON COLUMN preferences_utilisateur.etablissementId IS 
'Établissement associé à la préférence (NULL = préférence globale utilisateur)';
