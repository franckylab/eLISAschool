/**
 * ==================================
 * eLISAschool - Migration 110 : Consolidation du module Organisation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Objectifs :
 * 1. Créer les tables types_unite_organisationnelle et types_relation_hierarchique (conversion enum → tables éditables)
 * 2. Créer la table templates_organisation (si absente)
 * 3. Ajouter les FK UUID sur postes (categoriePosteId, niveauResponsabiliteId)
 * 4. Backfill code → FK UUID
 * 5. Supprimer les anciennes colonnes de jointure par code
 * 6. Ajouter usageUniteId FK sur unites_organisationnelles
 * 7. Renommer postes."intitulé" → postes.intitule
 * 8. Ajouter FK sur hierarchie_personnel
 * 9. Seeds système pour les nouvelles tables
 * 10. Supprimer les anciens enums PostgreSQL devenus inutiles
 */

BEGIN;

-- ============================================
-- ÉTAPE 1 : Créer les tables de types ouverts
-- ============================================

-- 1a. Table types_unite_organisationnelle (conversion de l'enum)
CREATE TABLE IF NOT EXISTS types_unite_organisationnelle (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "label" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "etablissementId" UUID,
    "estSysteme" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_types_unite_etablissement ON types_unite_organisationnelle("etablissementId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_types_unite_code_etab ON types_unite_organisationnelle("code", "etablissementId") WHERE "etablissementId" IS NOT NULL;

-- 1b. Table types_relation_hierarchique (conversion de l'enum)
CREATE TABLE IF NOT EXISTS types_relation_hierarchique (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "label" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "etablissementId" UUID,
    "estSysteme" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_types_relation_etablissement ON types_relation_hierarchique("etablissementId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_types_relation_code_etab ON types_relation_hierarchique("code", "etablissementId") WHERE "etablissementId" IS NOT NULL;

-- 1c. Table templates_organisation (si pas encore créée par synchronize)
CREATE TABLE IF NOT EXISTS templates_organisation (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nom" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "structure" JSONB,
    "etablissementId" UUID,
    "estSysteme" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_org_etablissement ON templates_organisation("etablissementId");

-- ============================================
-- ÉTAPE 2 : Ajouter colonnes FK sur postes
-- ============================================

-- categoriePosteId (FK vers categories_poste)
ALTER TABLE "postes" ADD COLUMN IF NOT EXISTS "categoriePosteId" UUID;

-- niveauResponsabiliteId (FK vers niveaux_responsabilite)
ALTER TABLE "postes" ADD COLUMN IF NOT EXISTS "niveauResponsabiliteId" UUID;

-- ============================================
-- ÉTAPE 3 : Backfill code → FK UUID
-- ============================================

-- Backfill categoriePosteCode → categoriePosteId
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'postes' AND column_name = 'categoriePosteCode') THEN
        UPDATE "postes" p
        SET "categoriePosteId" = cp.id
        FROM "categories_poste" cp
        WHERE p."categoriePosteCode" = cp.code
        AND p."categoriePosteId" IS NULL;
    END IF;
END $$;

-- Backfill niveauResponsabiliteCode → niveauResponsabiliteId
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'postes' AND column_name = 'niveauResponsabiliteCode') THEN
        UPDATE "postes" p
        SET "niveauResponsabiliteId" = nr.id
        FROM "niveaux_responsabilite" nr
        WHERE p."niveauResponsabiliteCode" = nr.code
        AND p."niveauResponsabiliteId" IS NULL;
    END IF;
END $$;

-- ============================================
-- ÉTAPE 4 : Ajouter FK contraintes sur postes
-- ============================================

DO $$
BEGIN
    -- Ajouter la FK categoriePosteId si la colonne existe et a été remplie
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'postes' AND column_name = 'categoriePosteId') THEN
        ALTER TABLE "postes" ADD CONSTRAINT "FK_postes_categorie_poste"
            FOREIGN KEY ("categoriePosteId") REFERENCES "categories_poste"("id") ON DELETE SET NULL;
    END IF;

    -- Ajouter la FK niveauResponsabiliteId
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'postes' AND column_name = 'niveauResponsabiliteId') THEN
        ALTER TABLE "postes" ADD CONSTRAINT "FK_postes_niveau_responsabilite"
            FOREIGN KEY ("niveauResponsabiliteId") REFERENCES "niveaux_responsabilite"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- ÉTAPE 5 : Supprimer anciennes colonnes postes
-- ============================================

-- Supprimer les colonnes de jointure par code (remplacées par FK UUID)
ALTER TABLE "postes" DROP COLUMN IF EXISTS "categoriePosteCode";
ALTER TABLE "postes" DROP COLUMN IF EXISTS "niveauResponsabiliteCode";

-- Supprimer les colonnes obsolètes
ALTER TABLE "postes" DROP COLUMN IF EXISTS "superviseurId";
ALTER TABLE "postes" DROP COLUMN IF EXISTS "superviseurNom";
ALTER TABLE "postes" DROP COLUMN IF EXISTS "occupantId";
ALTER TABLE "postes" DROP COLUMN IF EXISTS "occupantNom";
ALTER TABLE "postes" DROP COLUMN IF EXISTS "metadata";
ALTER TABLE "postes" DROP COLUMN IF EXISTS "modeRemunerationDefaut";

-- Supprimer l'ancien enum type et niveauResponsabilite (varchar dans le SQL 044, remplacés par FK)
ALTER TABLE "postes" DROP COLUMN IF EXISTS "type";
ALTER TABLE "postes" DROP COLUMN IF EXISTS "niveauResponsabilite";

-- ============================================
-- ÉTAPE 6 : Renommer "intitulé" → intitule
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'postes' AND column_name = 'intitulé') THEN
        EXECUTE 'ALTER TABLE "postes" RENAME COLUMN "intitulé" TO intitule';
    END IF;
    -- Si la colonne n'existe pas encore (cas synchronize), on la crée correctement
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'postes' AND column_name = 'intitule') THEN
        EXECUTE 'ALTER TABLE "postes" ADD COLUMN "intitule" VARCHAR(100) NOT NULL DEFAULT '''''::varchar';
        -- Supprimer la contrainte NOT NULL si des données existent déjà
        EXECUTE 'ALTER TABLE "postes" ALTER COLUMN "intitule" DROP NOT NULL';
        EXECUTE 'ALTER TABLE "postes" ALTER COLUMN "intitule" SET NOT NULL';
    END IF;
END $$;

-- ============================================
-- ÉTAPE 7 : unites_organisationnelles — typeUniteId + usageUniteId
-- ============================================

-- 7a. Ajouter la colonne FK typeUniteId (remplace l'enum type)
ALTER TABLE "unites_organisationnelles" ADD COLUMN IF NOT EXISTS "typeUniteId" UUID;

-- Backfill type (varchar) → typeUniteId (FK UUID)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'unites_organisationnelles' AND column_name = 'type'
    ) THEN
        UPDATE "unites_organisationnelles" u
        SET "typeUniteId" = t.id
        FROM "types_unite_organisationnelle" t
        WHERE u."type" = t.code
        AND u."typeUniteId" IS NULL;
    END IF;
END $$;

-- Ajouter la FK typeUniteId
ALTER TABLE "unites_organisationnelles" ADD CONSTRAINT "FK_unites_type_unite"
    FOREIGN KEY ("typeUniteId") REFERENCES "types_unite_organisationnelle"("id") ON DELETE SET NULL;

-- 7b. Ajouter la colonne FK usageUniteId
ALTER TABLE "unites_organisationnelles" ADD COLUMN IF NOT EXISTS "usageUniteId" UUID;

-- Backfill usageUniteCode → usageUniteId
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'unites_organisationnelles' AND column_name = 'usageUniteCode') THEN
        UPDATE "unites_organisationnelles" u
        SET "usageUniteId" = uu.id
        FROM "usages_unite" uu
        WHERE u."usageUniteCode" = uu.code
        AND u."usageUniteId" IS NULL;
    END IF;
END $$;

-- Ajouter la FK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'unites_organisationnelles' AND column_name = 'usageUniteId') THEN
        ALTER TABLE "unites_organisationnelles" ADD CONSTRAINT "FK_unites_usage_unite"
            FOREIGN KEY ("usageUniteId") REFERENCES "usages_unite"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- Supprimer l'ancienne colonne code et l'ancien type
ALTER TABLE "unites_organisationnelles" DROP COLUMN IF EXISTS "usageUniteCode";
ALTER TABLE "unites_organisationnelles" DROP COLUMN IF EXISTS "type";
ALTER TABLE "unites_organisationnelles" DROP COLUMN IF EXISTS "metadata";

-- ============================================
-- ÉTAPE 8 : hierarchie_personnel — typeRelationId + FK
-- ============================================

-- Ajouter la colonne FK typeRelationId (remplace l'enum typeRelation)
ALTER TABLE "hierarchie_personnel" ADD COLUMN IF NOT EXISTS "typeRelationId" UUID;

-- Backfill typeRelation (varchar/enum) → typeRelationId (FK UUID)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hierarchie_personnel' AND column_name = 'typeRelation'
    ) THEN
        UPDATE "hierarchie_personnel" h
        SET "typeRelationId" = t.id
        FROM "types_relation_hierarchique" t
        WHERE h."typeRelation"::text = t.code
        AND h."typeRelationId" IS NULL;
    END IF;
END $$;

-- Ajouter la FK typeRelationId
ALTER TABLE "hierarchie_personnel" ADD CONSTRAINT "FK_hierarchie_type_relation"
    FOREIGN KEY ("typeRelationId") REFERENCES "types_relation_hierarchique"("id") ON DELETE SET NULL;

-- FK personnelId → membres_personnel
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hierarchie_personnel' AND column_name = 'personnelId') THEN
        ALTER TABLE "hierarchie_personnel" ADD CONSTRAINT "FK_hierarchie_personnel"
            FOREIGN KEY ("personnelId") REFERENCES "membres_personnel"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- FK superieurId → membres_personnel
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hierarchie_personnel' AND column_name = 'superieurId') THEN
        ALTER TABLE "hierarchie_personnel" ADD CONSTRAINT "FK_hierarchie_superieur"
            FOREIGN KEY ("superieurId") REFERENCES "membres_personnel"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- FK uniteOrganisationnelleId → unites_organisationnelles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hierarchie_personnel' AND column_name = 'uniteOrganisationnelleId') THEN
        ALTER TABLE "hierarchie_personnel" ADD CONSTRAINT "FK_hierarchie_unite"
            FOREIGN KEY ("uniteOrganisationnelleId") REFERENCES "unites_organisationnelles"("id") ON DELETE SET NULL;
    END IF;
END $$;

-- Supprimer l'ancienne colonne typeRelation (remplacée par FK UUID)
ALTER TABLE "hierarchie_personnel" DROP COLUMN IF EXISTS "typeRelation";
ALTER TABLE "hierarchie_personnel" DROP COLUMN IF EXISTS "metadata";

-- ============================================
-- ÉTAPE 9 : Seeds système
-- ============================================

-- 9a. Seeds types_unite_organisationnelle (système, non supprimables)
INSERT INTO types_unite_organisationnelle ("code", "label", "description", "estSysteme")
VALUES
    ('DIRECTION', 'Direction', 'Unité de direction générale', true),
    ('DEPARTEMENT', 'Département', 'Département ou division', true),
    ('SERVICE', 'Service', 'Service opérationnel', true),
    ('POLE_PEDAGOGIQUE', 'Pôle pédagogique', 'Regroupement pédagogique', true),
    ('COMMISSION', 'Commission', 'Commission ou comité', true),
    ('EQUIPE', 'Équipe', 'Équipe de travail', true),
    ('AUTRE', 'Autre', 'Autre type d''unité', true)
ON CONFLICT ("code") DO NOTHING;

-- 9b. Seeds types_relation_hierarchique (système, non supprimables)
INSERT INTO types_relation_hierarchique ("code", "label", "description", "estSysteme")
VALUES
    ('SUPERVISE_DIRECT', 'Supervision directe', 'Lien hiérarchique direct', true),
    ('SUPERVISE_INDIRECT', 'Supervision indirecte', 'Lien hiérarchique indirect', true),
    ('RATTACHEMENT_FONCTIONNEL', 'Rattachement fonctionnel', 'Rattachement fonctionnel sans lien hiérarchique', true),
    ('COLLABORATION', 'Collaboration', 'Relation de collaboration', true),
    ('REPLACEMENT', 'Remplacement', 'Remplacement temporaire', true),
    ('INTERIM', 'Intérim', 'Gestion intérimaire', true)
ON CONFLICT ("code") DO NOTHING;

-- 9c. Seeds templates_organisation (si pas déjà présents)
INSERT INTO templates_organisation ("nom", "description", "structure", "estSysteme", "actif")
VALUES
    (
        'Lycée standard',
        'Organisation type d''un lycée camerounais avec directions adjointes et départements',
        '{"nom": "Direction Générale", "type": "DIRECTION", "enfants": [{"nom": "Direction Adjointe 1er Cycle", "type": "DEPARTEMENT"}, {"nom": "Direction Adjointe 2nd Cycle", "type": "DEPARTEMENT"}, {"nom": "Département Sciences", "type": "DEPARTEMENT"}, {"nom": "Département Lettres", "type": "DEPARTEMENT"}, {"nom": "Service Administratif", "type": "SERVICE"}, {"nom": "Intendance", "type": "SERVICE"}, {"nom": "Commission Discipline", "type": "COMMISSION"}]}',
        true,
        true
    ),
    (
        'École primaire',
        'Organisation type d''une école primaire',
        '{"nom": "Direction", "type": "DIRECTION", "enfants": [{"nom": "Service Pédagogique", "type": "SERVICE"}, {"nom": "Service Administratif", "type": "SERVICE"}]}',
        true,
        true
    ),
    (
        'Complexe scolaire',
        'Organisation type d''un complexe scolaire (primaire + secondaire)',
        '{"nom": "Direction Générale", "type": "DIRECTION", "enfants": [{"nom": "Direction Primaire", "type": "DEPARTEMENT"}, {"nom": "Direction Secondaire", "type": "DEPARTEMENT"}, {"nom": "Service Financier", "type": "SERVICE"}]}',
        true,
        true
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- ÉTAPE 10 : Supprimer anciens enums PostgreSQL
-- ============================================

-- Supprimer l'ancien enum des types d'unité (remplacé par la table types_unite_organisationnelle)
-- Note : on doit d'abord changer le type de colonne vers varchar, puis supprimer l'enum
DO $$
BEGIN
    -- Changer le type de la colonne type de enum vers varchar
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'unites_organisationnelles'
        AND column_name = 'type'
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE "unites_organisationnelles"
            ALTER COLUMN "type" TYPE VARCHAR(30)
            USING "type"::text::varchar(30);
    END IF;
END $$;

-- Supprimer l'enum type si existant
DROP TYPE IF EXISTS unites_organisationnelles_type_enum;

-- Supprimer l'ancien enum des types de relation (remplacé par la table types_relation_hierarchique)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'hierarchie_personnel'
        AND column_name = 'typeRelation'
        AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE "hierarchie_personnel"
            ALTER COLUMN "typeRelation" TYPE VARCHAR(30)
            USING "typeRelation"::text::varchar(30);
    END IF;
END $$;

DROP TYPE IF EXISTS hierarchie_personnel_typerelation_enum;

-- Supprimer l'enum statut_relation si existant (on le garde en enum car statut fermé)
-- Note : StatutRelation reste en enum PostgreSQL (statut fermé)

-- ============================================
-- VALIDATION POST-MIGRATION
-- ============================================

-- Vérifier l'intégrité des FK
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Vérifier que tous les categoriePosteId pointent vers des catégories existantes
    SELECT COUNT(*) INTO v_count
    FROM "postes" p
    WHERE p."categoriePosteId" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "categories_poste" c WHERE c.id = p."categoriePosteId");

    IF v_count > 0 THEN
        RAISE WARNING 'Migration 110: % postes ont un categoriePosteId orphelin', v_count;
    END IF;

    -- Vérifier que tous les niveauResponsabiliteId pointent vers des niveaux existants
    SELECT COUNT(*) INTO v_count
    FROM "postes" p
    WHERE p."niveauResponsabiliteId" IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM "niveaux_responsabilite" n WHERE n.id = p."niveauResponsabiliteId");

    IF v_count > 0 THEN
        RAISE WARNING 'Migration 110: % postes ont un niveauResponsabiliteId orphelin', v_count;
    END IF;

    RAISE NOTICE 'Migration 110 terminée avec succès';
END $$;

COMMIT;
