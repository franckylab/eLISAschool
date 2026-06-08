-- ==================================
-- eLISAschool - Migration 031: Suivi-Personnel
-- ==================================
-- Version: 2.0.0
-- Auteur: xAI Éducation
-- Description: Module de suivi du personnel
--   - Incidents disciplinaires
--   - Évaluations périodiques
-- ==================================

-- 1. Table Incidents Personnel
CREATE TABLE IF NOT EXISTS incidents_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membre_personnel_id UUID NOT NULL REFERENCES membres_personnel(id) ON DELETE CASCADE,
    declarant_id UUID NOT NULL REFERENCES utilisateurs(id),
    date_incident TIMESTAMP NOT NULL,
    gravite VARCHAR(20) NOT NULL CHECK (gravite IN ('MINEUR', 'MODERE', 'GRAVE', 'TRES_GRAVE')),
    statut VARCHAR(20) NOT NULL DEFAULT 'SIGNALE',
    type VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    action_prise TEXT,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_personnel_membre ON incidents_personnel(membre_personnel_id);
CREATE INDEX IF NOT EXISTS idx_incidents_personnel_declarant ON incidents_personnel(declarant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_personnel_gravite ON incidents_personnel(gravite);
CREATE INDEX IF NOT EXISTS idx_incidents_personnel_statut ON incidents_personnel(statut);
CREATE INDEX IF NOT EXISTS idx_incidents_personnel_etablissement ON incidents_personnel(etablissement_id);

COMMENT ON TABLE incidents_personnel IS 'Incidents disciplinaires du personnel';

-- 2. Table Évaluations Personnel
CREATE TABLE IF NOT EXISTS evaluations_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membre_personnel_id UUID NOT NULL REFERENCES membres_personnel(id) ON DELETE CASCADE,
    evaluateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    periodicite VARCHAR(20) NOT NULL CHECK (periodicite IN ('MENSUELLE', 'TRIMESTRIELLE', 'SEMESTRIELLE', 'ANNUELLE')),
    statut VARCHAR(20) NOT NULL DEFAULT 'PLANIFIEE',
    periode VARCHAR(50) NOT NULL,
    note_globale DECIMAL(5,2),
    points_fort TEXT,
    points_ameliorer TEXT,
    objectifs TEXT,
    commentaires TEXT,
    visible_concerned BOOLEAN NOT NULL DEFAULT FALSE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_personnel_membre ON evaluations_personnel(membre_personnel_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_personnel_evaluateur ON evaluations_personnel(evaluateur_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_personnel_periode ON evaluations_personnel(periode);
CREATE INDEX IF NOT EXISTS idx_evaluations_personnel_etablissement ON evaluations_personnel(etablissement_id);

COMMENT ON TABLE evaluations_personnel IS 'Évaluations périodiques de performance du personnel';
