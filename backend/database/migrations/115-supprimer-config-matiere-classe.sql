-- ==================================
-- eLISAschool - Migration 115 : Suppression ConfigurationMatiereClasse
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-07-24
--
-- Objectif : Supprimer l'entité ConfigurationMatiereClasse redondante.
-- AffectationMatiere absorbe les champs obligatoire et statutValidation.
-- ==================================

-- 1. Ajouter les nouveaux champs sur affectations_matieres
ALTER TABLE affectations_matieres ADD COLUMN IF NOT EXISTS "obligatoire" BOOLEAN DEFAULT true;
ALTER TABLE affectations_matieres ADD COLUMN IF NOT EXISTS "statutValidation" VARCHAR(30) DEFAULT 'VALIDE';

-- 2. Migrer les données depuis configurations_matieres_classes
-- ConfigurationMatiereClasse a : matiereId, classeId, coefficient, bareme, credits, volumeHoraireHebdo, obligatoire, statut
UPDATE affectations_matieres am
SET
    "obligatoire" = COALESCE(cmc."obligatoire", true),
    "statutValidation" = CASE
        WHEN cmc."statut" = 'ACTIVE' THEN 'VALIDE'
        WHEN cmc."statut" = 'EN_ATTENTE' THEN 'EN_ATTENTE_VALIDATION'
        WHEN cmc."statut" = 'INACTIVE' THEN 'REJETE'
        ELSE 'VALIDE'
    END
FROM configurations_matieres_classes cmc
WHERE am."configurationId" = cmc.id;

-- 3. Supprimer la FK configurationId et la colonne
ALTER TABLE affectations_matieres DROP CONSTRAINT IF EXISTS "FK_affectations_matieres_configurationId";
ALTER TABLE affectations_matieres DROP COLUMN IF EXISTS "configurationId";

-- 4. Supprimer l'index sur configurationId
DROP INDEX IF EXISTS idx_affectations_matieres_configuration;

-- 5. Supprimer la table configurations_matieres_classes
DROP TABLE IF EXISTS configurations_matieres_classes;

-- 6. Ajouter index sur les nouveaux champs
CREATE INDEX IF NOT EXISTS idx_affectations_matieres_obligatoire ON affectations_matieres("obligatoire") WHERE "obligatoire" = true;
CREATE INDEX IF NOT EXISTS idx_affectations_matieres_statut_validation ON affectations_matieres("statutValidation");
