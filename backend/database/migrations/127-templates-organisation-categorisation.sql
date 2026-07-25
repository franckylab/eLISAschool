-- ==================================
-- eLISAschool - Migration 125
-- ==================================
-- Catégorisation des templates d'organisation
-- Date: 2026-07-25
-- Objectif: Ajouter les colonnes de filtrage et classification des templates
--           (nature juridique, système éducatif, langue, niveaux, complexité)
-- ==================================

-- 1. Nouvelles colonnes
ALTER TABLE templates_organisation ADD COLUMN IF NOT EXISTS "nature" VARCHAR(30);
ALTER TABLE templates_organisation ADD COLUMN IF NOT EXISTS "systeme" VARCHAR(20);
ALTER TABLE templates_organisation ADD COLUMN IF NOT EXISTS "langue" VARCHAR(20);
ALTER TABLE templates_organisation ADD COLUMN IF NOT EXISTS "niveaux" TEXT;
ALTER TABLE templates_organisation ADD COLUMN IF NOT EXISTS "complexite" VARCHAR(20);
ALTER TABLE templates_organisation ADD COLUMN IF NOT EXISTS "categorie" VARCHAR(50);
ALTER TABLE templates_organisation ADD COLUMN IF NOT EXISTS "ordre" INTEGER DEFAULT 0;
ALTER TABLE templates_organisation ADD COLUMN IF NOT EXISTS "icone" VARCHAR(20);
ALTER TABLE templates_organisation ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE templates_organisation ADD COLUMN IF NOT EXISTS "nomEn" VARCHAR(200);

-- 2. Index pour optimiser les filtres
CREATE INDEX IF NOT EXISTS idx_templates_nature ON templates_organisation("nature") WHERE "nature" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_systeme ON templates_organisation("systeme") WHERE "systeme" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_langue ON templates_organisation("langue") WHERE "langue" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_complexite ON templates_organisation("complexite") WHERE "complexite" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_ordre ON templates_organisation("ordre");

-- 3. Nouveaux échelons structurels (4 codes ajoutés)
-- Section linguistique, Cycle, Filière, Pôle de formation
INSERT INTO echelons_structurels (id, "niveau", code, label, description, couleur, "estSysteme", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid(), 2, 'SECTION_LINGUISTIQUE', 'Section linguistique', 'Section organisée par langue d''enseignement', '#8b5cf6', TRUE, NOW(), NOW()),
    (gen_random_uuid(), 2, 'CYCLE', 'Cycle', 'Cycle pédagogique (ex: Cycle 2, Cycle 3)', '#06b6d4', TRUE, NOW(), NOW()),
    (gen_random_uuid(), 2, 'FILIERE', 'Filière', 'Filière de formation (général, technique, etc.)', '#f59e0b', TRUE, NOW(), NOW()),
    (gen_random_uuid(), 2, 'POLE_FORMATION', 'Pôle de formation', 'Pôle organisé par domaine de compétence', '#10b981', TRUE, NOW(), NOW())
ON CONFLICT DO NOTHING;
