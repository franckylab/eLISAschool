-- ==================================
-- eLISAschool - Migration 030: Suivi-Élèves
-- ==================================
-- Version: 2.0.0
-- Auteur: xAI Éducation
-- Description: Module complet de suivi comportemental des élèves
--   - Incidents disciplinaires
--   - Observations (positives/négatives)
--   - Sanctions
--   - Félicitations
-- ==================================

-- 1. Table Incidents Élèves
CREATE TABLE IF NOT EXISTS incidents_eleves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    declarant_id UUID NOT NULL REFERENCES utilisateurs(id),
    date_incident TIMESTAMP NOT NULL,
    gravite VARCHAR(20) NOT NULL CHECK (gravite IN ('MINEUR', 'MODERE', 'GRAVE', 'TRES_GRAVE')),
    statut VARCHAR(20) NOT NULL DEFAULT 'SIGNALE',
    type VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    lieu VARCHAR(100),
    temoins TEXT,
    action_prise TEXT,
    sanction_id UUID,
    signale_parent BOOLEAN NOT NULL DEFAULT FALSE,
    date_signalement_parent TIMESTAMP,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_eleves_eleve ON incidents_eleves(eleve_id);
CREATE INDEX IF NOT EXISTS idx_incidents_eleves_declarant ON incidents_eleves(declarant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_eleves_gravite ON incidents_eleves(gravite);
CREATE INDEX IF NOT EXISTS idx_incidents_eleves_statut ON incidents_eleves(statut);
CREATE INDEX IF NOT EXISTS idx_incidents_eleves_date ON incidents_eleves(date_incident);
CREATE INDEX IF NOT EXISTS idx_incidents_eleves_etablissement ON incidents_eleves(etablissement_id);

COMMENT ON TABLE incidents_eleves IS 'Incidents disciplinaires des élèves';

-- 2. Table Observations Élèves
CREATE TABLE IF NOT EXISTS observations_eleves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    observateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('POSITIVE', 'NEGATIVE', 'NEUTRE')),
    categorie VARCHAR(200) NOT NULL,
    commentaire TEXT NOT NULL,
    points_impact INTEGER NOT NULL DEFAULT 0,
    visible_parent BOOLEAN NOT NULL DEFAULT FALSE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observations_eleves_eleve ON observations_eleves(eleve_id);
CREATE INDEX IF NOT EXISTS idx_observations_eleves_observateur ON observations_eleves(observateur_id);
CREATE INDEX IF NOT EXISTS idx_observations_eleves_type ON observations_eleves(type);
CREATE INDEX IF NOT EXISTS idx_observations_eleves_etablissement ON observations_eleves(etablissement_id);

COMMENT ON TABLE observations_eleves IS 'Observations comportementales des élèves';

-- 3. Table Sanctions Élèves
CREATE TABLE IF NOT EXISTS sanctions_eleves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL UNIQUE REFERENCES incidents_eleves(id),
    type VARCHAR(30) NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'PRONONCEE',
    motif TEXT NOT NULL,
    description TEXT,
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    jours_exclusion INTEGER,
    mesures_accompagnement TEXT,
    decide_par_id UUID NOT NULL REFERENCES utilisateurs(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sanctions_eleves_eleve ON sanctions_eleves(eleve_id);
CREATE INDEX IF NOT EXISTS idx_sanctions_eleves_incident ON sanctions_eleves(incident_id);
CREATE INDEX IF NOT EXISTS idx_sanctions_eleves_type ON sanctions_eleves(type);
CREATE INDEX IF NOT EXISTS idx_sanctions_eleves_statut ON sanctions_eleves(statut);
CREATE INDEX IF NOT EXISTS idx_sanctions_eleves_etablissement ON sanctions_eleves(etablissement_id);

COMMENT ON TABLE sanctions_eleves IS 'Sanctions disciplinaires des élèves';

-- 4. Table Félicitations Élèves
CREATE TABLE IF NOT EXISTS felicitations_eleves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    motif TEXT NOT NULL,
    description TEXT,
    points_bonus INTEGER NOT NULL DEFAULT 0,
    visible_bulletin BOOLEAN NOT NULL DEFAULT TRUE,
    visible_parent BOOLEAN NOT NULL DEFAULT TRUE,
    attribue_par_id UUID NOT NULL REFERENCES utilisateurs(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_felicitations_eleves_eleve ON felicitations_eleves(eleve_id);
CREATE INDEX IF NOT EXISTS idx_felicitations_eleves_type ON felicitations_eleves(type);
CREATE INDEX IF NOT EXISTS idx_felicitations_eleves_etablissement ON felicitations_eleves(etablissement_id);

COMMENT ON TABLE felicitations_eleves IS 'Félicitations et récompenses des élèves';
