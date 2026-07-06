-- ==========================================
-- eLISAschool - Migration 070: Tables Programmes Pédagogiques
-- ==========================================

-- Table principale: programmes_pedagogiques
CREATE TABLE IF NOT EXISTS programmes_pedagogiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'NIVEAU' CHECK (type IN ('CYCLE', 'NIVEAU', 'PERSONNALISE')),
    "cycleId" UUID REFERENCES cycles(id) ON DELETE SET NULL,
    "niveauId" UUID REFERENCES niveaux(id) ON DELETE SET NULL,
    "nbHeuresHebdo" INT DEFAULT 0,
    "objectifsGeneraux" TEXT,
    "competencesVisees" JSONB,
    "anneeScolaireId" UUID,
    "dateDebut" DATE,
    "dateFin" DATE,
    actif BOOLEAN DEFAULT true,
    "etablissementId" UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programmes_pedagogiques_etablissement ON programmes_pedagogiques("etablissementId");
CREATE INDEX IF NOT EXISTS idx_programmes_pedagogiques_cycle ON programmes_pedagogiques("cycleId");
CREATE INDEX IF NOT EXISTS idx_programmes_pedagogiques_niveau ON programmes_pedagogiques("niveauId");
CREATE INDEX IF NOT EXISTS idx_programmes_pedagogiques_type ON programmes_pedagogiques("type");
CREATE UNIQUE INDEX IF NOT EXISTS idx_programmes_pedagogiques_code_etablissement ON programmes_pedagogiques(code, "etablissementId");

-- Table de jonction: programmes_matieres
CREATE TABLE IF NOT EXISTS programmes_matieres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "programmeId" UUID NOT NULL REFERENCES programmes_pedagogiques(id) ON DELETE CASCADE,
    "matiereNiveauId" UUID NOT NULL REFERENCES matieres_niveaux(id) ON DELETE CASCADE,
    coefficient FLOAT,
    "volumeHoraire" INT,
    obligatoire BOOLEAN DEFAULT true,
    ordre INT DEFAULT 0,
    "etablissementId" UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programmes_matieres_programme ON programmes_matieres("programmeId");
CREATE INDEX IF NOT EXISTS idx_programmes_matieres_matiere_niveau ON programmes_matieres("matiereNiveauId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_programmes_matieres_unique ON programmes_matieres("programmeId", "matiereNiveauId");
