-- ==================================
-- eLISAschool - Migration Refonte Structure Académique v2.0
-- ==================================
-- Version: 2.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-13
-- 
-- Description:
-- 1. Suppression de TypeCycle (fusionné dans Cycle)
-- 2. Ajout des filières technologiques/industrielles
-- 3. Création des tables Specialites et Competences

-- ==================================
-- 1. MODIFICATION TABLE cycles (fusion TypeCycle)
-- ==================================

-- Ajouter les nouvelles colonnes
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS dureeAnnees INTEGER DEFAULT 0;
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS diplomeSanctionnant VARCHAR(50);

-- Modifier code de varchar(50) à varchar(50) UNIQUE (si pas déjà fait)
ALTER TABLE cycles ADD CONSTRAINT uq_cycles_code UNIQUE (code);
ALTER TABLE cycles ADD CONSTRAINT uq_cycles_nom UNIQUE (nom);

-- Supprimer la contrainte de clé étrangère typeCycleId
ALTER TABLE cycles DROP CONSTRAINT IF EXISTS fk_cycles_type_cycle;

-- Supprimer la colonne typeCycleId
ALTER TABLE cycles DROP COLUMN IF EXISTS "typeCycleId";

-- Supprimer l'index sur typeCycleId
DROP INDEX IF EXISTS idx_cycles_type_cycle_id;

-- ==================================
-- 2. SUPPRESSION TABLE types_cycles
-- ==================================

DROP TABLE IF EXISTS types_cycles CASCADE;

-- ==================================
-- 3. CRÉATION TABLE specialites
-- ==================================

CREATE TABLE IF NOT EXISTS specialites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    "filiereId" UUID NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
    ordre INTEGER DEFAULT 1,
    actif BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_specialites_filiere_id ON specialites("filiereId");
CREATE INDEX IF NOT EXISTS idx_specialites_code ON specialites(code);

-- ==================================
-- 4. CRÉATION TABLE competences
-- ==================================

CREATE TABLE IF NOT EXISTS competences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    libelle VARCHAR(200) NOT NULL,
    description TEXT,
    domaine VARCHAR(100) NOT NULL,
    "niveauId" UUID NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
    "matiereId" UUID REFERENCES matieres(id) ON DELETE SET NULL,
    ordre INTEGER DEFAULT 1,
    actif BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competences_niveau_id ON competences("niveauId");
CREATE INDEX IF NOT EXISTS idx_competences_matiere_id ON competences("matiereId");
CREATE INDEX IF NOT EXISTS idx_competences_niveau_matiere ON competences("niveauId", "matiereId");

-- ==================================
-- 5. SEEDS - MISE À JOUR DES CYCLES
-- ==================================

-- Mettre à jour les cycles existants avec les données de TypeCycle
UPDATE cycles SET 
    nom = 'Enseignement Maternel',
    description = 'Cycle préscolaire pour les enfants de 3 à 6 ans',
    dureeAnnees = 3,
    diplomeSanctionnant = NULL
WHERE code = 'CYCLE_MATERNEL';

UPDATE cycles SET 
    nom = 'Enseignement Primaire',
    description = 'Cycle de l''enseignement élémentaire (6 ans)',
    dureeAnnees = 6,
    diplomeSanctionnant = 'CEP'
WHERE code = 'CYCLE_PRIMAIRE';

UPDATE cycles SET 
    nom = 'Secondaire 1er Cycle',
    description = 'Premier cycle de l''enseignement secondaire - Collège (4 ans)',
    dureeAnnees = 4,
    diplomeSanctionnant = 'BEPC'
WHERE code = 'CYCLE_SECONDAIRE_1';

UPDATE cycles SET 
    nom = 'Secondaire 2nd Cycle',
    description = 'Second cycle de l''enseignement secondaire - Lycée (3 ans)',
    dureeAnnees = 3,
    diplomeSanctionnant = 'BACCALAUREAT'
WHERE code = 'CYCLE_SECONDAIRE_2';

-- Mettre à jour les codes des cycles
UPDATE cycles SET code = 'MATERNELLE' WHERE code = 'CYCLE_MATERNEL';
UPDATE cycles SET code = 'PRIMAIRE' WHERE code = 'CYCLE_PRIMAIRE';
UPDATE cycles SET code = 'SECONDAIRE_1' WHERE code = 'CYCLE_SECONDAIRE_1';
UPDATE cycles SET code = 'SECONDAIRE_2' WHERE code = 'CYCLE_SECONDAIRE_2';

-- ==================================
-- 6. SEEDS - FILIÈRES TECHNOLOGIQUES
-- ==================================

-- Obtenir l'ID du cycle Secondaire 2nd Cycle
DO $$
DECLARE
    secondaire2_id UUID;
BEGIN
    SELECT id INTO secondaire2_id FROM cycles WHERE code = 'SECONDAIRE_2' LIMIT 1;

    -- Insérer les filières technologiques si elles n'existent pas
    INSERT INTO filieres (nom, code, description, "cycleId", soussysteme, actif)
    VALUES
        ('Série F1 - Génie Mécanique', 'F1', 'Mécanique automobile, maintenance industrielle, usinage', secondaire2_id, 'FRANCOPHONE', true),
        ('Série F2 - Génie Électrotechnique', 'F2', 'Électricité, électronique, automatismes, informatique industrielle', secondaire2_id, 'FRANCOPHONE', true),
        ('Série F3 - Génie Civil Bâtiment', 'F3', 'Construction, architecture, topographie, bâtiment', secondaire2_id, 'FRANCOPHONE', true),
        ('Série F4 - Génie Chimique', 'F4', 'Chimie industrielle, laboratoires, procédés chimiques', secondaire2_id, 'FRANCOPHONE', true),
        ('Série G1 - Techniques Administratives', 'G1', 'Secrétariat, bureautique, gestion administrative', secondaire2_id, 'FRANCOPHONE', true),
        ('Série G2 - Techniques Commerciales', 'G2', 'Commerce, vente, marketing, action commerciale', secondaire2_id, 'FRANCOPHONE', true),
        ('Série H - Techniques Économiques', 'H', 'Comptabilité, finance, économie, gestion', secondaire2_id, 'FRANCOPHONE', true),
        ('Série I - Informatique', 'I', 'Développement, réseaux, systèmes d''information', secondaire2_id, 'FRANCOPHONE', true),
        ('Série K - Arts Appliqués', 'K', 'Design, mode, stylisme, arts graphiques', secondaire2_id, 'FRANCOPHONE', true),
        ('Série L - Hôtellerie-Restauration', 'L', 'Cuisine, service, gestion hôtelière, tourisme', secondaire2_id, 'FRANCOPHONE', true)
    ON CONFLICT (code, "cycleId") DO NOTHING;
END $$;

-- ==================================
-- MIGRATION TERMINÉE
-- ==================================

COMMENT ON TABLE specialites IS 'Spécialités/options des filières techniques (Approche Par Compétences)';
COMMENT ON TABLE competences IS 'Compétences pédagogiques selon l''APC (Programmes MINESEC)';
