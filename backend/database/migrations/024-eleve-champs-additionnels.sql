-- ==================================
-- eLISAschool - Migration 024
-- ==================================
-- Ajout de champs d'identification additionnels à la table eleves
-- Version: 2.0.0
-- ==================================

-- Photo et informations médicales de base
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS photo VARCHAR(500);

ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS groupeSanguin VARCHAR(5);

ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS allergies JSONB;

-- Contact d'urgence
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS nomContactUrgence VARCHAR(200);

ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS telephoneContactUrgence VARCHAR(20);

-- Adresse complète
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS adresseDomicile TEXT;

ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS ville VARCHAR(100);

ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS quartier VARCHAR(100);

-- Historique scolaire
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS ecoleProvenance VARCHAR(200);

ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS classeAnterieure VARCHAR(100);

-- Statuts particuliers
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS redoublement BOOLEAN DEFAULT FALSE;

ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS boursier BOOLEAN DEFAULT FALSE;

ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS regimeInterne BOOLEAN DEFAULT FALSE;

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_eleves_groupe_sanguin ON eleves(groupeSanguin);
CREATE INDEX IF NOT EXISTS idx_eleves_boursier ON eleves(boursier);
CREATE INDEX IF NOT EXISTS idx_eleves_regime_interne ON eleves(regimeInterne);

COMMENT ON COLUMN eleves.photo IS 'URL de la photo de l''élève';
COMMENT ON COLUMN eleves.groupeSanguin IS 'Groupe sanguin (A+, A-, B+, B-, AB+, AB-, O+, O-)';
COMMENT ON COLUMN eleves.allergies IS 'Liste des allergies connues (JSON)';
COMMENT ON COLUMN eleves.ecoleProvenance IS 'École précédente';
COMMENT ON COLUMN eleves.boursier IS 'Indique si l''élève est boursier';
COMMENT ON COLUMN eleves.regimeInterne IS 'Indique si l''élève est en régime interne';
