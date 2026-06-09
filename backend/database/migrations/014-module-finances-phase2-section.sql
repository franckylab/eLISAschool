-- ==================================
-- eLISAschool - Migration Phase 2: Section & Fratrie
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-07
-- 
-- Objectifs:
-- 1. Créer table sections
-- 2. Ajouter sectionId dans frais_scolarite
-- 3. Ajouter sectionId dans remises
-- 4. Ajouter scope SECTION dans remises
-- ==================================

-- Étape 1: Créer la table sections
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    type_section VARCHAR(30) NOT NULL DEFAULT 'AUTRE',
    description TEXT,
    ordre INT NOT NULL DEFAULT 1,
    "cycleId" UUID,
    "etablissementId" UUID NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    "coefficientFrais" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour sections
CREATE INDEX IF NOT EXISTS "IDX_sections_etablissement" ON sections("etablissementId");
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_sections_code_etablissement" ON sections(code, "etablissementId");

-- Contraintes de clé étrangère
ALTER TABLE sections 
ADD CONSTRAINT "FK_sections_cycle" 
FOREIGN KEY ("cycleId") REFERENCES cycles(id) ON DELETE SET NULL;

ALTER TABLE sections 
ADD CONSTRAINT "FK_sections_etablissement" 
FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;

-- Étape 2: Ajouter sectionId dans frais_scolarite
ALTER TABLE frais_scolarite 
ADD COLUMN IF NOT EXISTS "sectionId" UUID;

-- Ajouter la contrainte de clé étrangère
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_frais_scolarite_section'
    ) THEN
        ALTER TABLE frais_scolarite 
        ADD CONSTRAINT "FK_frais_scolarite_section" 
        FOREIGN KEY ("sectionId") REFERENCES sections(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS "IDX_frais_scolarite_section" ON frais_scolarite("sectionId");

-- Mettre à jour l'index unique pour inclure sectionId
DROP INDEX IF EXISTS "IDX_frais_scolarite_unique_v2";
CREATE UNIQUE INDEX "IDX_frais_scolarite_unique_v3" 
ON frais_scolarite (
    "etablissementId", 
    "anneeScolaireId", 
    "niveauId", 
    "classeId",
    "sectionId"
);

-- Étape 3: Ajouter sectionId dans remises
ALTER TABLE remises 
ADD COLUMN IF NOT EXISTS "sectionId" UUID;

-- Ajouter la contrainte de clé étrangère
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_remises_section'
    ) THEN
        ALTER TABLE remises 
        ADD CONSTRAINT "FK_remises_section" 
        FOREIGN KEY ("sectionId") REFERENCES sections(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS "IDX_remises_section" ON remises("sectionId");

-- Étape 4: Ajouter SECTION au scopeRemise (modifier la contrainte CHECK)
ALTER TABLE remises 
DROP CONSTRAINT IF EXISTS "CK_remises_scopeRemise";

ALTER TABLE remises 
ADD CONSTRAINT "CK_remises_scopeRemise_v2" 
CHECK ("scopeRemise" IN ('ETABLISSEMENT', 'CYCLE', 'NIVEAU', 'CLASSE', 'SECTION', 'ELEVE'));

-- Étape 5: Créer un index composite pour remises avec scope
DROP INDEX IF EXISTS "IDX_remises_scope_etablissement";
CREATE INDEX IF NOT EXISTS "IDX_remises_scope_etablissement_v2" 
ON remises("scopeRemise", "etablissementId");

-- Étape 6: Données de démonstration - Sections courantes
INSERT INTO sections (nom, code, type_section, description, ordre, "coefficientFrais", "etablissementId")
SELECT 'Scientifique', 'S', 'SCIENTIFIQUE', 'Section scientifique (Maths, Physique, SVT)', 1, 1.10, id
FROM etablissements WHERE NOT EXISTS (
    SELECT 1 FROM sections WHERE code = 'S' AND "etablissementId" = etablissements.id
)
LIMIT 1;

INSERT INTO sections (nom, code, type_section, description, ordre, "coefficientFrais", "etablissementId")
SELECT 'Littéraire', 'L', 'LITTERAIRE', 'Section littéraire (Lettres, Philosophie, Langues)', 2, 1.00, id
FROM etablissements WHERE NOT EXISTS (
    SELECT 1 FROM sections WHERE code = 'L' AND "etablissementId" = etablissements.id
)
LIMIT 1;

INSERT INTO sections (nom, code, type_section, description, ordre, "coefficientFrais", "etablissementId")
SELECT 'Économique et Social', 'ES', 'ECONOMIQUE', 'Section économique et social', 3, 1.05, id
FROM etablissements WHERE NOT EXISTS (
    SELECT 1 FROM sections WHERE code = 'ES' AND "etablissementId" = etablissements.id
)
LIMIT 1;

INSERT INTO sections (nom, code, type_section, description, ordre, "coefficientFrais", "etablissementId")
SELECT 'Technologique', 'ST', 'TECHNIQUE', 'Section sciences et technologies', 4, 1.15, id
FROM etablissements WHERE NOT EXISTS (
    SELECT 1 FROM sections WHERE code = 'ST' AND "etablissementId" = etablissements.id
)
LIMIT 1;

INSERT INTO sections (nom, code, type_section, description, ordre, "coefficientFrais", "etablissementId")
SELECT 'Bilingue', 'BIL', 'BILINGUE', 'Section bilingue français-anglais', 5, 1.20, id
FROM etablissements WHERE NOT EXISTS (
    SELECT 1 FROM sections WHERE code = 'BIL' AND "etablissementId" = etablissements.id
)
LIMIT 1;

-- Étape 7: Commentaires sur les colonnes
COMMENT ON TABLE sections IS 'Sections pédagogiques (Scientifique, Littéraire, Technique, etc.)';
COMMENT ON COLUMN sections."coefficientFrais" IS 'Multiplicateur de frais (ex: 1.2 = +20%)';
COMMENT ON COLUMN frais_scolarite."sectionId" IS 'Section cible (si frais spécifiques par section)';
COMMENT ON COLUMN remises."sectionId" IS 'Section cible (si scopeRemise = SECTION)';

-- Vérification finale
SELECT 
    'Migration Phase 2 complétée avec succès' as status,
    COUNT(*) as total_sections,
    COUNT(DISTINCT type_section) as types_sections
FROM sections;

SELECT 
    COUNT(*) as total_frais_avec_section,
    COUNT(*) FILTER (WHERE "sectionId" IS NOT NULL) as frais_section,
    COUNT(*) FILTER (WHERE "sectionId" IS NULL) as frais_sans_section
FROM frais_scolarite;

SELECT 
    COUNT(*) as total_remises_avec_section,
    COUNT(*) FILTER (WHERE "scopeRemise" = 'SECTION') as remises_section,
    COUNT(*) FILTER (WHERE "sectionId" IS NOT NULL) as remises_avec_section_id
FROM remises;
