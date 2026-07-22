-- ==================================
-- Migration 110: Consolidation Organisation
-- ==================================
-- Version: 2.0.0
-- Fusion des modules postes/, fonctions/, organisation/ en un seul module
-- Conversion des enums PostgreSQL en tables éditables
-- FK UUID directes pour toutes les jointures de nomenclature
-- ==================================
-- NOTE: Tous les identifiants camelCase sont entre guillemets pour PostgreSQL
-- ==================================

BEGIN;

-- ==================================
-- ÉTAPE 1 — Créer les nouvelles tables de types
-- ==================================

-- 1a. Table types_unite_organisationnelle (remplace l'enum)
CREATE TABLE IF NOT EXISTS types_unite_organisationnelle (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" varchar(50) NOT NULL,
    "label" varchar(100) NOT NULL,
    "description" text,
    "etablissementId" uuid,
    "estSysteme" boolean NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE ("code", "etablissementId")
);

-- 1b. Table types_relation_hierarchique (remplace l'enum)
CREATE TABLE IF NOT EXISTS types_relation_hierarchique (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" varchar(50) NOT NULL,
    "label" varchar(100) NOT NULL,
    "description" text,
    "etablissementId" uuid,
    "estSysteme" boolean NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE ("code", "etablissementId")
);

-- 1c. Table templates_organisation
CREATE TABLE IF NOT EXISTS templates_organisation (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "nom" varchar(200) NOT NULL,
    "description" text,
    "structure" jsonb NOT NULL,
    "etablissementId" uuid,
    "estSysteme" boolean NOT NULL DEFAULT false,
    "actif" boolean NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==================================
-- ÉTAPE 2 — Ajouter colonnes FK sur postes
-- ==================================

ALTER TABLE postes ADD COLUMN IF NOT EXISTS "categoriePosteId" uuid;
ALTER TABLE postes ADD COLUMN IF NOT EXISTS "niveauResponsabiliteId" uuid;
ALTER TABLE postes ADD COLUMN IF NOT EXISTS "typePersonnelId" uuid;
ALTER TABLE postes ADD COLUMN IF NOT EXISTS "fonctionId" uuid;

-- ==================================
-- ÉTAPE 3 — Backfill code → FK UUID
-- ==================================

-- 3a. categoriePosteCode → categoriePosteId
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'postes' AND column_name = 'categoriePosteCode') THEN
        UPDATE postes p
        SET "categoriePosteId" = cp.id
        FROM "categories_poste" cp
        WHERE cp."code" = p."categoriePosteCode"
          AND p."categoriePosteId" IS NULL;
    END IF;
END $$;

-- 3b. niveauResponsabiliteCode → niveauResponsabiliteId
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'postes' AND column_name = 'niveauResponsabiliteCode') THEN
        UPDATE postes p
        SET "niveauResponsabiliteId" = nr.id
        FROM "niveaux_responsabilite" nr
        WHERE nr."code" = p."niveauResponsabiliteCode"
          AND p."niveauResponsabiliteId" IS NULL;
    END IF;
END $$;

-- ==================================
-- ÉTAPE 4 — Supprimer anciennes colonnes postes
-- ==================================

ALTER TABLE postes DROP COLUMN IF EXISTS "categoriePosteCode";
ALTER TABLE postes DROP COLUMN IF EXISTS "niveauResponsabiliteCode";
ALTER TABLE postes DROP COLUMN IF EXISTS "type";
ALTER TABLE postes DROP COLUMN IF EXISTS "niveauResponsabilite";
ALTER TABLE postes DROP COLUMN IF EXISTS "superviseurId";
ALTER TABLE postes DROP COLUMN IF EXISTS "superviseurNom";
ALTER TABLE postes DROP COLUMN IF EXISTS "occupantId";
ALTER TABLE postes DROP COLUMN IF EXISTS "occupantNom";
ALTER TABLE postes DROP COLUMN IF EXISTS "metadata";
ALTER TABLE postes DROP COLUMN IF EXISTS "modeRemunerationDefaut";

-- ==================================
-- ÉTAPE 5 — FK sur unites_organisationnelles
-- ==================================

-- 5a. Ajouter typeUniteId, usageUniteId, niveauOrganisationId
ALTER TABLE unites_organisationnelles ADD COLUMN IF NOT EXISTS "typeUniteId" uuid;
ALTER TABLE unites_organisationnelles ADD COLUMN IF NOT EXISTS "usageUniteId" uuid;
ALTER TABLE unites_organisationnelles ADD COLUMN IF NOT EXISTS "niveauOrganisationId" uuid;

-- 5b. Backfill usageUniteCode → usageUniteId
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'unites_organisationnelles' AND column_name = 'usageUniteCode') THEN
        UPDATE unites_organisationnelles uo
        SET "usageUniteId" = uu.id
        FROM "usages_unite" uu
        WHERE uu."code" = uo."usageUniteCode"
          AND uo."usageUniteId" IS NULL;
    END IF;
END $$;

-- 5c. Supprimer anciennes colonnes
ALTER TABLE unites_organisationnelles DROP COLUMN IF EXISTS "usageUniteCode";
ALTER TABLE unites_organisationnelles DROP COLUMN IF EXISTS "type";
ALTER TABLE unites_organisationnelles DROP COLUMN IF EXISTS "metadata";

-- ==================================
-- ÉTAPE 6 — Renommer intitulé → intitule
-- ==================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'postes' AND column_name = 'intitulé') THEN
        ALTER TABLE postes RENAME COLUMN "intitulé" TO "intitule";
    END IF;
    -- S'assurer que la colonne existe même si le renommage n'a pas eu lieu
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'postes' AND column_name = 'intitule') THEN
        ALTER TABLE postes ADD COLUMN "intitule" varchar(100) NOT NULL DEFAULT '';
    END IF;
END $$;

-- ==================================
-- ÉTAPE 7 — FK sur hierarchie_personnel
-- ==================================

ALTER TABLE hierarchie_personnel ADD COLUMN IF NOT EXISTS "typeRelationId" uuid;

-- Backfill typeRelation enum → typeRelationId
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hierarchie_personnel' AND column_name = 'typeRelation') THEN
        UPDATE hierarchie_personnel hp
        SET "typeRelationId" = tr.id
        FROM "types_relation_hierarchique" tr
        WHERE tr."code" = hp."typeRelation"
          AND hp."typeRelationId" IS NULL;
    END IF;
END $$;

ALTER TABLE hierarchie_personnel DROP COLUMN IF EXISTS "typeRelation";
ALTER TABLE hierarchie_personnel DROP COLUMN IF EXISTS "metadata";

-- ==================================
-- ÉTAPE 8 — Seeds système pour nouvelles tables
-- ==================================

-- 8a. Seeds types_unite_organisationnelle
INSERT INTO types_unite_organisationnelle ("code", "label", "description", "estSysteme")
VALUES
    ('DIRECTION', 'Direction', 'Unité de direction générale', true),
    ('DEPARTEMENT', 'Département', 'Département opérationnel', true),
    ('SERVICE', 'Service', 'Service fonctionnel', true),
    ('POLE_PEDAGOGIQUE', 'Pôle pédagogique', 'Pôle dédié à la pédagogie', true),
    ('COMMISSION', 'Commission', 'Commission de travail', true),
    ('EQUIPE', 'Équipe', 'Équipe projet ou transverse', true),
    ('AUTRE', 'Autre', 'Type personnalisé', true)
ON CONFLICT DO NOTHING;

-- 8b. Seeds types_relation_hierarchique
INSERT INTO types_relation_hierarchique ("code", "label", "description", "estSysteme")
VALUES
    ('SUPERVISE_DIRECT', 'Supervision directe', 'Lien hiérarchique direct N+1', true),
    ('SUPERVISE_INDIRECT', 'Supervision indirecte', 'Lien hiérarchique N+2 ou plus', true),
    ('RATTACHEMENT_FONCTIONNEL', 'Rattachement fonctionnel', 'Lien fonctionnel sans autorité hiérarchique', true),
    ('COLLABORATION', 'Collaboration', 'Relation de collaboration peer-to-peer', true),
    ('REMPLACEMENT', 'Remplacement', 'Relation de remplacement temporaire', true),
    ('INTERIM', 'Intérim', 'Gestion intérimaire', true)
ON CONFLICT DO NOTHING;

-- ==================================
-- ÉTAPE 9 — Supprimer anciens enums PostgreSQL
-- ==================================

DO $$
BEGIN
    DROP TYPE IF EXISTS type_unite_organisationnelle_enum CASCADE;
    DROP TYPE IF EXISTS type_relation_hierarchique_enum CASCADE;
    DROP TYPE IF EXISTS niveau_responsabilite_enum CASCADE;
    DROP TYPE IF EXISTS categorie_poste_enum CASCADE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Cleanup des enums ignoré (certains peuvent ne pas exister)';
END $$;

-- ==================================
-- ÉTAPE 10 — Validation intégrité
-- ==================================

-- Index pour les FK
CREATE INDEX IF NOT EXISTS "IDX_postes_categoriePosteId" ON postes ("categoriePosteId");
CREATE INDEX IF NOT EXISTS "IDX_postes_niveauResponsabiliteId" ON postes ("niveauResponsabiliteId");
CREATE INDEX IF NOT EXISTS "IDX_postes_typePersonnelId" ON postes ("typePersonnelId");
CREATE INDEX IF NOT EXISTS "IDX_postes_fonctionId" ON postes ("fonctionId");
CREATE INDEX IF NOT EXISTS "IDX_unites_typeUniteId" ON unites_organisationnelles ("typeUniteId");
CREATE INDEX IF NOT EXISTS "IDX_unites_usageUniteId" ON unites_organisationnelles ("usageUniteId");
CREATE INDEX IF NOT EXISTS "IDX_unites_niveauOrganisationId" ON unites_organisationnelles ("niveauOrganisationId");
CREATE INDEX IF NOT EXISTS "IDX_hierarchie_typeRelationId" ON hierarchie_personnel ("typeRelationId");

-- Contraintes FK (optionnelles — les colonnes sont nullable)
DO $$
BEGIN
    ALTER TABLE postes ADD CONSTRAINT "FK_postes_categoriePosteId"
        FOREIGN KEY ("categoriePosteId") REFERENCES "categories_poste"(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'FK postes→categories_poste skip'; END $$;

DO $$
BEGIN
    ALTER TABLE postes ADD CONSTRAINT "FK_postes_niveauResponsabiliteId"
        FOREIGN KEY ("niveauResponsabiliteId") REFERENCES "niveaux_responsabilite"(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'FK postes→niveaux_responsabilite skip'; END $$;

DO $$
BEGIN
    ALTER TABLE postes ADD CONSTRAINT "FK_postes_fonctionId"
        FOREIGN KEY ("fonctionId") REFERENCES fonctions(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'FK postes→fonctions skip'; END $$;

DO $$
BEGIN
    ALTER TABLE unites_organisationnelles ADD CONSTRAINT "FK_unites_typeUniteId"
        FOREIGN KEY ("typeUniteId") REFERENCES types_unite_organisationnelle(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'FK unites→types_unite skip'; END $$;

DO $$
BEGIN
    ALTER TABLE unites_organisationnelles ADD CONSTRAINT "FK_unites_usageUniteId"
        FOREIGN KEY ("usageUniteId") REFERENCES "usages_unite"(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'FK unites→usages_unite skip'; END $$;

DO $$
BEGIN
    ALTER TABLE unites_organisationnelles ADD CONSTRAINT "FK_unites_niveauOrganisationId"
        FOREIGN KEY ("niveauOrganisationId") REFERENCES "niveaux_organisation"(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'FK unites→niveaux_organisation skip'; END $$;

DO $$
BEGIN
    ALTER TABLE hierarchie_personnel ADD CONSTRAINT "FK_hierarchie_typeRelationId"
        FOREIGN KEY ("typeRelationId") REFERENCES types_relation_hierarchique(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'FK hierarchie→types_relation skip'; END $$;

COMMIT;
