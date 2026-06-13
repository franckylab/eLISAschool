-- ==================================
-- eLISAschool - Migration Structure Académique Complète
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-12
-- 
-- Description: Refonte de l'architecture des cycles, niveaux, filières et examens
-- Conforme au système éducatif camerounais/africain

-- ==================================
-- 1. CRÉATION TABLE types_cycles
-- ==================================

CREATE TABLE IF NOT EXISTS types_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    dureeAnnees INTEGER DEFAULT 0,
    ordre INTEGER DEFAULT 1,
    diplomeSanctionnant VARCHAR(50),
    actif BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==================================
-- 2. MODIFICATION TABLE cycles
-- ==================================

-- Ajouter nouvelle colonne typeCycleId
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS "typeCycleId" UUID;

-- Ajouter FK vers types_cycles
ALTER TABLE cycles
    ADD CONSTRAINT fk_cycles_type_cycle
    FOREIGN KEY ("typeCycleId") REFERENCES types_cycles(id) ON DELETE SET NULL;

-- Modifier colonne code de enum à varchar
ALTER TABLE cycles ALTER COLUMN code TYPE VARCHAR(50);

-- Créer index
CREATE INDEX IF NOT EXISTS idx_cycles_type_cycle_id ON cycles("typeCycleId");

-- ==================================
-- 3. CRÉATION TABLE filieres
-- ==================================

CREATE TABLE IF NOT EXISTS filieres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    "cycleId" UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    sousSysteme VARCHAR(20) DEFAULT 'FRANCOPHONE',
    actif BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filieres_cycle_id ON filieres("cycleId");

-- ==================================
-- 4. CRÉATION TABLE examens_nationaux
-- ==================================

CREATE TABLE IF NOT EXISTS examens_nationaux (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(30) NOT NULL,
    "niveauId" UUID NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
    "dateProgrammation" DATE,
    coefficient DECIMAL(5,2),
    "estObligatoire" BOOLEAN DEFAULT true,
    "diplomeDelivre" VARCHAR(100),
    description TEXT,
    sousSysteme VARCHAR(20) DEFAULT 'FRANCOPHONE',
    actif BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_examens_niveau_id ON examens_nationaux("niveauId");
CREATE INDEX IF NOT EXISTS idx_examens_code ON examens_nationaux(code);

-- ==================================
-- 5. MODIFICATION TABLE niveaux
-- ==================================

-- Ajouter colonnes pour filières et examens
ALTER TABLE niveaux ADD COLUMN IF NOT EXISTS "filiereId" UUID;
ALTER TABLE niveaux ADD COLUMN IF NOT EXISTS "examenNationalId" UUID;
ALTER TABLE niveaux ADD COLUMN IF NOT EXISTS "estClasseExamen" BOOLEAN DEFAULT false;

-- Ajouter FKs
ALTER TABLE niveaux
    ADD CONSTRAINT fk_niveaux_filiere
    FOREIGN KEY ("filiereId") REFERENCES filieres(id) ON DELETE SET NULL;

ALTER TABLE niveaux
    ADD CONSTRAINT fk_niveaux_examen_national
    FOREIGN KEY ("examenNationalId") REFERENCES examens_nationaux(id) ON DELETE SET NULL;

-- Créer index
CREATE INDEX IF NOT EXISTS idx_niveaux_filiere_id ON niveaux("filiereId");
CREATE INDEX IF NOT EXISTS idx_niveaux_examen_id ON niveaux("examenNationalId");

-- ==================================
-- 6. CRÉATION TABLE diplomes_eleves
-- ==================================

CREATE TABLE IF NOT EXISTS diplomes_eleves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "eleveId" UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    "examenNationalId" UUID NOT NULL REFERENCES examens_nationaux(id) ON DELETE CASCADE,
    "noteObtenue" DECIMAL(5,2),
    mention VARCHAR(50),
    resultat VARCHAR(20) NOT NULL,
    "dateObtention" DATE NOT NULL,
    "numeroDiplome" VARCHAR(100),
    observations TEXT,
    "etablissementId" UUID,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diplomes_eleve_id ON diplomes_eleves("eleveId");
CREATE INDEX IF NOT EXISTS idx_diplomes_examen_id ON diplomes_eleves("examenNationalId");
CREATE INDEX IF NOT EXISTS idx_diplomes_eleve_examen ON diplomes_eleves("eleveId", "examenNationalId");

-- ==================================
-- 7. SEEDS - Types de Cycles
-- ==================================

INSERT INTO types_cycles (nom, code, description, dureeAnnees, ordre, diplomeSanctionnant) VALUES
('Enseignement Maternel', 'MATERNELLE', 'Cycle préscolaire pour les 3-6 ans', 3, 1, NULL),
('Enseignement Primaire', 'PRIMAIRE', 'Cycle de l''enseignement élémentaire', 6, 2, 'CEP'),
('Secondaire 1er Cycle', 'SECONDAIRE_1', 'Premier cycle de l''enseignement secondaire (Collège)', 4, 3, 'BEPC'),
('Secondaire 2nd Cycle', 'SECONDAIRE_2', 'Second cycle de l''enseignement secondaire (Lycée)', 3, 4, 'BACCALAUREAT')
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 8. MIGRATION DATA - Associer cycles existants aux types
-- ==================================

-- Mettre à jour les cycles existants avec leur type correspondant
UPDATE cycles c SET "typeCycleId" = (
    SELECT tc.id FROM types_cycles tc 
    WHERE tc.code = c.code
)
WHERE c."typeCycleId" IS NULL AND c.code IN ('MATERNELLE', 'PRIMAIRE', 'COLLEGE', 'LYCEE');

-- ==================================
-- 9. SEEDS - Filières Francophones (Second Cycle)
-- ==================================

INSERT INTO filieres (nom, code, description, "cycleId", sousSysteme)
SELECT 
    'Série C - Mathématiques et Physique',
    'C',
    'Mathématiques, Physique, Chimie',
    c.id,
    'FRANCOPHONE'
FROM cycles c
WHERE c.nom LIKE '%Second Cycle%' OR c.code = 'SECONDAIRE_2'
ON CONFLICT DO NOTHING;

INSERT INTO filieres (nom, code, description, "cycleId", sousSysteme)
SELECT 
    'Série D - Sciences de la Nature',
    'D',
    'Biologie, Chimie, Sciences Naturelles',
    c.id,
    'FRANCOPHONE'
FROM cycles c
WHERE c.nom LIKE '%Second Cycle%' OR c.code = 'SECONDAIRE_2'
ON CONFLICT DO NOTHING;

INSERT INTO filieres (nom, code, description, "cycleId", sousSysteme)
SELECT 
    'Série A - Lettres et Sciences Humaines',
    'A',
    'Lettres, Histoire, Géographie, Philosophie',
    c.id,
    'FRANCOPHONE'
FROM cycles c
WHERE c.nom LIKE '%Second Cycle%' OR c.code = 'SECONDAIRE_2'
ON CONFLICT DO NOTHING;

-- ==================================
-- 10. SEEDS - Examens Nationaux
-- ==================================

-- CEP pour CM2
INSERT INTO examens_nationaux (nom, code, type, "niveauId", "diplomeDelivre", sousSysteme)
SELECT 
    'Certificat d''Études Primaires',
    'CEP',
    'NATIONAL',
    n.id,
    'CEP',
    'FRANCOPHONE'
FROM niveaux n
WHERE n.code = 'CM2'
ON CONFLICT (code) DO NOTHING;

-- BEPC pour 3ème
INSERT INTO examens_nationaux (nom, code, type, "niveauId", "diplomeDelivre", sousSysteme)
SELECT 
    'Brevet d''Études du Premier Cycle',
    'BEPC',
    'NATIONAL',
    n.id,
    'BEPC',
    'FRANCOPHONE'
FROM niveaux n
WHERE n.code = '3EME' OR n.nom LIKE '%3ème%'
ON CONFLICT (code) DO NOTHING;

-- BACCALAURÉAT pour Terminale
INSERT INTO examens_nationaux (nom, code, type, "niveauId", "diplomeDelivre", sousSysteme)
SELECT 
    'BACCALAURÉAT',
    'BACCALAUREAT',
    'NATIONAL',
    n.id,
    'BACCALAUREAT',
    'FRANCOPHONE'
FROM niveaux n
WHERE n.code = 'TERM' OR n.nom LIKE '%Terminale%'
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- 11. MISE À JOUR - Classes d'examen
-- ==================================

UPDATE niveaux SET "estClasseExamen" = true
WHERE code IN ('CM2', '3EME', 'TERM', 'UPPER6')
   OR nom LIKE '%CM2%' OR nom LIKE '%3ème%' OR nom LIKE '%Terminale%' OR nom LIKE '%Upper 6th%';

-- ==================================
-- FIN DE LA MIGRATION
-- ==================================

-- COMMENT: Migration structure académique complète - Types Cycles, Filières, Examens, Diplômes
