-- ==================================
-- eLISAschool - Migration 025
-- ==================================
-- Ajout de champs d'identification additionnels à la table responsables_eleves
-- Version: 2.0.0
-- ==================================

-- Informations professionnelles
ALTER TABLE responsables_eleves 
ADD COLUMN IF NOT EXISTS profession VARCHAR(200);

ALTER TABLE responsables_eleves 
ADD COLUMN IF NOT EXISTS lieuTravail VARCHAR(200);

ALTER TABLE responsables_eleves 
ADD COLUMN IF NOT EXISTS telephoneTravail VARCHAR(20);

ALTER TABLE responsables_eleves 
ADD COLUMN IF NOT EXISTS emailTravail VARCHAR(255);

ALTER TABLE responsables_eleves 
ADD COLUMN IF NOT EXISTS adresseProfessionnelle TEXT;

-- Informations financières (optionnelles)
ALTER TABLE responsables_eleves 
ADD COLUMN IF NOT EXISTS revenuMensuel DECIMAL(12, 2);

-- Contacts d'urgence supplémentaires
ALTER TABLE responsables_eleves 
ADD COLUMN IF NOT EXISTS personneContactUrgence VARCHAR(200);

ALTER TABLE responsables_eleves 
ADD COLUMN IF NOT EXISTS telephoneContactUrgence VARCHAR(20);

-- Autorisations
ALTER TABLE responsables_eleves 
ADD COLUMN IF NOT EXISTS autorisationSortie BOOLEAN DEFAULT TRUE;

ALTER TABLE responsables_eleves 
ADD COLUMN IF NOT EXISTS autorisationMedicale BOOLEAN DEFAULT TRUE;

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_responsables_profession ON responsables_eleves(profession);
CREATE INDEX IF NOT EXISTS idx_responsables_autorisation_sortie ON responsables_eleves(autorisationSortie);
CREATE INDEX IF NOT EXISTS idx_responsables_autorisation_medicale ON responsables_eleves(autorisationMedicale);

COMMENT ON COLUMN responsables_eleves.profession IS 'Profession du responsable';
COMMENT ON COLUMN responsables_eleves.revenuMensuel IS 'Revenu mensuel (optionnel)';
COMMENT ON COLUMN responsables_eleves.autorisationSortie IS 'Autorisation à récupérer l''élève';
COMMENT ON COLUMN responsables_eleves.autorisationMedicale IS 'Autorisation pour décisions médicales';
