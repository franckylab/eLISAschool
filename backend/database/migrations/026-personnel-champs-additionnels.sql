-- ==================================
-- eLISAschool - Migration 026
-- ==================================
-- Ajout de champs d'identification additionnels à la table membres_personnel
-- Version: 2.0.0
-- ==================================

-- Champs communs (tous types de personnel)
ALTER TABLE membres_personnel 
ADD COLUMN IF NOT EXISTS posteExact VARCHAR(200);

ALTER TABLE membres_personnel 
ADD COLUMN IF NOT EXISTS service VARCHAR(100);

ALTER TABLE membres_personnel 
ADD COLUMN IF NOT EXISTS responsableHierarchiqueId UUID;

ALTER TABLE membres_personnel 
ADD COLUMN IF NOT EXISTS competences JSONB;

-- Spécifique enseignant
ALTER TABLE membres_personnel 
ADD COLUMN IF NOT EXISTS specialitePrincipale VARCHAR(200);

ALTER TABLE membres_personnel 
ADD COLUMN IF NOT EXISTS anneesExperience INTEGER;

ALTER TABLE membres_personnel 
ADD COLUMN IF NOT EXISTS educationNiveau VARCHAR(50);

ALTER TABLE membres_personnel 
ADD COLUMN IF NOT EXISTS etablissementOrigine VARCHAR(200);

ALTER TABLE membres_personnel 
ADD COLUMN IF NOT EXISTS disponibilites JSONB;

ALTER TABLE membres_personnel 
ADD COLUMN IF NOT EXISTS heuresMaxSemaine INTEGER;

-- Spécifique non-enseignant
ALTER TABLE membres_personnel 
ADD COLUMN IF NOT EXISTS horairesTravail JSONB;

-- Relation récursive (responsable hiérarchique)
ALTER TABLE membres_personnel 
ADD CONSTRAINT fk_membres_personnel_responsable 
FOREIGN KEY (responsableHierarchiqueId) 
REFERENCES membres_personnel(id) 
ON DELETE SET NULL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_personnel_poste ON membres_personnel(posteExact);
CREATE INDEX IF NOT EXISTS idx_personnel_service ON membres_personnel(service);
CREATE INDEX IF NOT EXISTS idx_personnel_responsable ON membres_personnel(responsableHierarchiqueId);
CREATE INDEX IF NOT EXISTS idx_personnel_specialite ON membres_personnel(specialitePrincipale);
CREATE INDEX IF NOT EXISTS idx_personnel_education ON membres_personnel(educationNiveau);

COMMENT ON COLUMN membres_personnel.posteExact IS 'Poste exact occupé';
COMMENT ON COLUMN membres_personnel.service IS 'Service ou département';
COMMENT ON COLUMN membres_personnel.responsableHierarchiqueId IS 'FK vers le responsable hiérarchique (relation récursive)';
COMMENT ON COLUMN membres_personnel.competences IS 'Liste des compétences (JSON)';
COMMENT ON COLUMN membres_personnel.specialitePrincipale IS 'Spécialité principale (enseignants)';
COMMENT ON COLUMN membres_personnel.educationNiveau IS 'Niveau d''éducation (LICENCE, MASTER, DOCTORAT, AUTRE)';
COMMENT ON COLUMN membres_personnel.disponibilites IS 'Disponibilités horaires (JSON)';
COMMENT ON COLUMN membres_personnel.horairesTravail IS 'Horaires de travail (JSON, non-enseignants)';
