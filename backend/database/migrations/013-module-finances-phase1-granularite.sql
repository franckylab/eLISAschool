-- ==================================
-- eLISAschool - Migration Phase 1: Frais & Remises Granularité
-- ==================================
-- Version: 1.0.0
-- Auteur: xAI Éducation
-- Date: 2026-06-07
-- 
-- Objectifs:
-- 1. Corriger index unique sur frais_scolarite (support multi-classe)
-- 2. Ajouter cycleId dans frais_scolarite
-- 3. Rendre eleveId nullable dans remises
-- 4. Ajouter scopeRemise dans remises
-- 5. Ajouter classeId et cycleId dans remises
-- ==================================

-- Étape 1: Corriger l'index unique sur frais_scolarite
-- Supprimer l'ancien index restrictif
DROP INDEX IF EXISTS "IDX_frais_scolarite_etablissement_annee_niveau";

-- Créer le nouvel index incluant classeId
CREATE UNIQUE INDEX "IDX_frais_scolarite_unique_v2" 
ON frais_scolarite (
    "etablissementId", 
    "anneeScolaireId", 
    "niveauId", 
    "classeId"
);

-- Note: classeId peut être NULL, donc l'index permet:
-- - etablissement1 + 2024-2025 + 6eme + NULL (frais par niveau)
-- - etablissement1 + 2024-2025 + 6eme + classeA (frais par classe A)
-- - etablissement1 + 2024-2025 + 6eme + classeB (frais par classe B)

-- Étape 2: Ajouter cycleId dans frais_scolarite
ALTER TABLE frais_scolarite 
ADD COLUMN IF NOT EXISTS "cycleId" UUID;

-- Ajouter la contrainte de clé étrangère
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_frais_scolarite_cycle'
    ) THEN
        ALTER TABLE frais_scolarite 
        ADD CONSTRAINT "FK_frais_scolarite_cycle" 
        FOREIGN KEY ("cycleId") REFERENCES cycles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS "IDX_frais_scolarite_cycle" ON frais_scolarite("cycleId");

-- Étape 3: Rendre eleveId nullable dans remises
-- Supprimer d'abord la contrainte NOT NULL si elle existe
ALTER TABLE remises 
ALTER COLUMN "eleveId" DROP NOT NULL;

-- Étape 4: Ajouter scopeRemise dans remises
ALTER TABLE remises 
ADD COLUMN IF NOT EXISTS "scopeRemise" VARCHAR(30) DEFAULT 'ELEVE';

-- Ajouter une contrainte CHECK pour valider les valeurs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'CK_remises_scopeRemise'
    ) THEN
        ALTER TABLE remises 
        ADD CONSTRAINT "CK_remises_scopeRemise" 
        CHECK ("scopeRemise" IN ('ETABLISSEMENT', 'CYCLE', 'NIVEAU', 'CLASSE', 'ELEVE'));
    END IF;
END $$;

-- Étape 5: Ajouter classeId dans remises
ALTER TABLE remises 
ADD COLUMN IF NOT EXISTS "classeId" UUID;

-- Ajouter la contrainte de clé étrangère
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_remises_classe'
    ) THEN
        ALTER TABLE remises 
        ADD CONSTRAINT "FK_remises_classe" 
        FOREIGN KEY ("classeId") REFERENCES classes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS "IDX_remises_classe" ON remises("classeId");

-- Étape 6: Ajouter cycleId dans remises
ALTER TABLE remises 
ADD COLUMN IF NOT EXISTS "cycleId" UUID;

-- Ajouter la contrainte de clé étrangère
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_remises_cycle'
    ) THEN
        ALTER TABLE remises 
        ADD CONSTRAINT "FK_remises_cycle" 
        FOREIGN KEY ("cycleId") REFERENCES cycles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS "IDX_remises_cycle" ON remises("cycleId");

-- Étape 7: Créer un index composite pour optimiser les recherches de remises
CREATE INDEX IF NOT EXISTS "IDX_remises_scope_etablissement" 
ON remises("scopeRemise", "etablissementId");

-- Étape 8: Mettre à jour les remises existantes avec le scope par défaut
UPDATE remises 
SET "scopeRemise" = 'ELEVE' 
WHERE "scopeRemise" IS NULL;

-- Étape 9: Commentaires sur les colonnes pour documentation
COMMENT ON COLUMN frais_scolarite."cycleId" IS 'Cycle scolaire optionnel (Primaire, Collège, Lycée). Priorité: classe > niveau > cycle > établissement';
COMMENT ON COLUMN remises."scopeRemise" IS 'Niveau d''application de la remise: ETABLISSEMENT, CYCLE, NIVEAU, CLASSE, ELEVE';
COMMENT ON COLUMN remises."classeId" IS 'Classe cible (si scopeRemise = CLASSE)';
COMMENT ON COLUMN remises."cycleId" IS 'Cycle cible (si scopeRemise = CYCLE)';

-- Vérification finale
SELECT 
    'Migration Phase 1 complétée avec succès' as status,
    COUNT(*) as total_frais_scolarite,
    COUNT(DISTINCT "classeId") as classes_uniques,
    COUNT(DISTINCT "cycleId") as cycles_uniques
FROM frais_scolarite;

SELECT 
    COUNT(*) as total_remises,
    COUNT(*) FILTER (WHERE "eleveId" IS NULL) as remises_collectives,
    COUNT(*) FILTER (WHERE "scopeRemise" = 'ETABLISSEMENT') as remises_etablissement,
    COUNT(*) FILTER (WHERE "scopeRemise" = 'CYCLE') as remises_cycle,
    COUNT(*) FILTER (WHERE "scopeRemise" = 'CLASSE') as remises_classe,
    COUNT(*) FILTER (WHERE "scopeRemise" = 'ELEVE') as remises_eleve
FROM remises;
