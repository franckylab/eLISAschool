-- ==================================
-- eLISAschool - Migration Module Organisation
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Description: Crée les tables pour le système d'organisation
-- ==================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================
-- Table: organisations
-- ==================================
CREATE TABLE IF NOT EXISTS organisations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL DEFAULT 'ETABLISSEMENT_SCOLAIRE',
    logoUrl VARCHAR(500),
    code VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    telephone VARCHAR(50),
    adresse TEXT,
    siteWeb VARCHAR(255),
    statut VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    actif BOOLEAN NOT NULL DEFAULT true,
    etablissementId UUID,
    metadata JSONB,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_organisations_etablissement ON organisations(etablissementId);
CREATE INDEX IF NOT EXISTS idx_organisations_type ON organisations(type);

-- ==================================
-- Table: unites_organisationnelles
-- ==================================
CREATE TABLE IF NOT EXISTS unites_organisationnelles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL DEFAULT 'SERVICE',
    code VARCHAR(50) NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    actif BOOLEAN NOT NULL DEFAULT true,
    organisationId UUID NOT NULL,
    parentId UUID,
    ordre INT NOT NULL DEFAULT 0,
    responsableNom VARCHAR(200),
    responsableId UUID,
    localisation VARCHAR(100),
    telephone VARCHAR(50),
    email VARCHAR(255),
    metadata JSONB,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_unites_organisation FOREIGN KEY (organisationId) 
        REFERENCES organisations(id) ON DELETE CASCADE,
    CONSTRAINT fk_unites_parent FOREIGN KEY (parentId) 
        REFERENCES unites_organisationnelles(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_unites_organisation ON unites_organisationnelles(organisationId);
CREATE INDEX IF NOT EXISTS idx_unites_type ON unites_organisationnelles(type);
CREATE INDEX IF NOT EXISTS idx_unites_parent ON unites_organisationnelles(parentId);
CREATE INDEX IF NOT EXISTS idx_unites_code ON unites_organisationnelles(code);

-- ==================================
-- Table: postes
-- ==================================
CREATE TABLE IF NOT EXISTS postes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intitulé VARCHAR(100) NOT NULL,
    description TEXT,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'ADMINISTRATIF',
    niveauResponsabilite VARCHAR(30) NOT NULL DEFAULT 'EXECUTANT',
    statut VARCHAR(30) NOT NULL DEFAULT 'ACTIF',
    actif BOOLEAN NOT NULL DEFAULT true,
    uniteOrganisationnelleId UUID NOT NULL,
    occupantId UUID,
    occupantNom VARCHAR(200),
    nombrePostes INT NOT NULL DEFAULT 1,
    superviseurId UUID,
    superviseurNom VARCHAR(200),
    competencesRequises JSONB,
    missions JSONB,
    metadata JSONB,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_postes_unite FOREIGN KEY (uniteOrganisationnelleId) 
        REFERENCES unites_organisationnelles(id) ON DELETE CASCADE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_postes_unite ON postes(uniteOrganisationnelleId);
CREATE INDEX IF NOT EXISTS idx_postes_code ON postes(code);
CREATE INDEX IF NOT EXISTS idx_postes_type ON postes(type);
CREATE INDEX IF NOT EXISTS idx_postes_statut ON postes(statut);

-- ==================================
-- Table: hierarchie_personnel
-- ==================================
CREATE TABLE IF NOT EXISTS hierarchie_personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    personnelId UUID NOT NULL,
    personnelNom VARCHAR(200) NOT NULL,
    superieurId UUID NOT NULL,
    superieurNom VARCHAR(200) NOT NULL,
    typeRelation VARCHAR(30) NOT NULL DEFAULT 'SUPERVISE_DIRECT',
    statut VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    actif BOOLEAN NOT NULL DEFAULT true,
    posteId UUID,
    posteIntitule VARCHAR(100),
    uniteOrganisationnelleId UUID,
    uniteNom VARCHAR(100),
    etablissementId UUID NOT NULL,
    dateDebut TIMESTAMP,
    dateFin TIMESTAMP,
    commentaire TEXT,
    metadata JSONB,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_hierarchie_personnel ON hierarchie_personnel(personnelId);
CREATE INDEX IF NOT EXISTS idx_hierarchie_superieur ON hierarchie_personnel(superieurId);
CREATE INDEX IF NOT EXISTS idx_hierarchie_type ON hierarchie_personnel(typeRelation);
CREATE INDEX IF NOT EXISTS idx_hierarchie_etablissement ON hierarchie_personnel(etablissementId);

-- ==================================
-- SEEDS: Organisation par défaut
-- ==================================

-- Créer une organisation pour chaque établissement existant
INSERT INTO organisations (id, nom, description, type, statut, actif, etablissementId, createdAt, updatedAt)
SELECT 
    uuid_generate_v4(),
    e.nom,
    'Organisation principale de l''établissement ' || e.nom,
    'ETABLISSEMENT_SCOLAIRE',
    'ACTIF',
    true,
    e.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM etablissements e
WHERE e.id NOT IN (SELECT etablissementId FROM organisations WHERE etablissementId IS NOT NULL)
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- SEEDS: Unités organisationnelles types
-- ==================================

-- Ces unités seront créées pour chaque organisation
-- Direction
INSERT INTO unites_organisationnelles (nom, description, type, code, statut, actif, ordre, createdAt, updatedAt)
VALUES 
    ('Direction Générale', 'Direction principale de l''établissement', 'DIRECTION', 'DIR-GEN', 'ACTIF', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Département Pédagogique
INSERT INTO unites_organisationnelles (nom, description, type, code, statut, actif, ordre, createdAt, updatedAt)
VALUES 
    ('Département Pédagogique', 'Enseignement et programmes scolaires', 'DEPARTEMENT', 'DEP-PED', 'ACTIF', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Département Vie Scolaire
INSERT INTO unites_organisationnelles (nom, description, type, code, statut, actif, ordre, createdAt, updatedAt)
VALUES 
    ('Département Vie Scolaire', 'Surveillance et suivi des élèves', 'DEPARTEMENT', 'DEP-VS', 'ACTIF', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Département Administratif
INSERT INTO unites_organisationnelles (nom, description, type, code, statut, actif, ordre, createdAt, updatedAt)
VALUES 
    ('Département Administratif', 'Gestion administrative et financière', 'DEPARTEMENT', 'DEP-ADM', 'ACTIF', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Département Logistique
INSERT INTO unites_organisationnelles (nom, description, type, code, statut, actif, ordre, createdAt, updatedAt)
VALUES 
    ('Département Logistique', 'Cantine, transport, matériel', 'DEPARTEMENT', 'DEP-LOG', 'ACTIF', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- ==================================
-- COMMENTAIRES
-- ==================================
COMMENT ON TABLE organisations IS 'Structure organisationnelle de haut niveau';
COMMENT ON TABLE unites_organisationnelles IS 'Unités structurelles (départements, services, pôles)';
COMMENT ON TABLE postes IS 'Postes/fonctions au sein des unités organisationnelles';
COMMENT ON TABLE hierarchie_personnel IS 'Relations hiérarchiques entre membres du personnel';
