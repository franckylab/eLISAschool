-- ==================================
-- eLISAschool - Migration 032: Module Santé
-- ==================================
-- Version: 2.0.0
-- Auteur: xAI Éducation
-- Description: Module de gestion de la santé
--   - Dossiers médicaux (élèves et personnel)
--   - Consultations médicales
--   - Incidents de santé (accidents, maladies)
-- ==================================

-- 1. Table Dossiers Médicaux
CREATE TABLE IF NOT EXISTS dossiers_medicaux (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    type_patient VARCHAR(20) NOT NULL CHECK (type_patient IN ('ELEVE', 'PERSONNEL')),
    groupe_sanguin VARCHAR(5),
    allergies_connues JSONB,
    antecedents_medicaux JSONB,
    traitements_en_cours JSONB,
    handicaps TEXT,
    contraintes_speciales TEXT,
    medecin_traitant VARCHAR(200),
    telephone_medecin VARCHAR(50),
    assurance_maladie VARCHAR(200),
    numero_assurance VARCHAR(50),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dossiers_medicaux_patient ON dossiers_medicaux(patient_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_medicaux_type ON dossiers_medicaux(type_patient);
CREATE INDEX IF NOT EXISTS idx_dossiers_medicaux_etablissement ON dossiers_medicaux(etablissement_id);

COMMENT ON TABLE dossiers_medicaux IS 'Dossiers médicaux des élèves et du personnel';
COMMENT ON COLUMN dossiers_medicaux.antecedents_medicaux IS 'Antécédents médicaux (stockés en JSONB)';

-- 2. Table Consultations Médicales
CREATE TABLE IF NOT EXISTS consultations_medicales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_medical_id UUID NOT NULL REFERENCES dossiers_medicaux(id) ON DELETE CASCADE,
    consultant_id UUID NOT NULL REFERENCES utilisateurs(id),
    date_consultation TIMESTAMP NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INFIRMERIE', 'MEDICALE', 'URGENCES', 'SUIVI')),
    statut VARCHAR(20) NOT NULL DEFAULT 'TERMINEE',
    motif TEXT NOT NULL,
    diagnostic TEXT,
    traitement TEXT,
    observations TEXT,
    temperature DECIMAL(4,1),
    tension_arterielle DECIMAL(5,1),
    frequence_cardiaque INTEGER,
    poids DECIMAL(5,2),
    taille DECIMAL(5,2),
    signale_parent BOOLEAN NOT NULL DEFAULT FALSE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_medicales_dossier ON consultations_medicales(dossier_medical_id);
CREATE INDEX IF NOT EXISTS idx_consultations_medicales_consultant ON consultations_medicales(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultations_medicales_date ON consultations_medicales(date_consultation);
CREATE INDEX IF NOT EXISTS idx_consultations_medicales_etablissement ON consultations_medicales(etablissement_id);

COMMENT ON TABLE consultations_medicales IS 'Consultations médicales (infirmerie, urgences, suivi)';

-- 3. Table Incidents Santé
CREATE TABLE IF NOT EXISTS incidents_sante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_medical_id UUID NOT NULL REFERENCES dossiers_medicaux(id) ON DELETE CASCADE,
    date_incident TIMESTAMP NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ACCIDENT', 'MALAISE', 'MALADIE', 'ALLERGIE', 'AUTRE')),
    gravite VARCHAR(20) NOT NULL CHECK (gravite IN ('MINEUR', 'MODERE', 'GRAVE', 'CRITIQUE')),
    nature VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    lieu VARCHAR(100),
    premiers_secours TEXT,
    suite_donnee TEXT,
    hospitalisation BOOLEAN NOT NULL DEFAULT FALSE,
    signale_parent BOOLEAN NOT NULL DEFAULT FALSE,
    date_signalement_parent TIMESTAMP,
    declare_par_id UUID NOT NULL REFERENCES utilisateurs(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_sante_dossier ON incidents_sante(dossier_medical_id);
CREATE INDEX IF NOT EXISTS idx_incidents_sante_type ON incidents_sante(type);
CREATE INDEX IF NOT EXISTS idx_incidents_sante_gravite ON incidents_sante(gravite);
CREATE INDEX IF NOT EXISTS idx_incidents_sante_date ON incidents_sante(date_incident);
CREATE INDEX IF NOT EXISTS idx_incidents_sante_etablissement ON incidents_sante(etablissement_id);

COMMENT ON TABLE incidents_sante IS 'Incidents de santé (accidents, maladies, malaises)';
