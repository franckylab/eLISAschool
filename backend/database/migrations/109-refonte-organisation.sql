-- eLISAschool - Migration 109: Refonte Module Organisation
-- ==================================
-- Version: 1.0.0
-- Description: Fusionne Organisation dans Etablissement,
--              réviser les types d'unités, supprimer la table organisations,
--              ajouter 3 templates prédéfinis camerounais.
-- ==================================

-- ==================================
-- 1.0 Recréer l'enum PostgreSQL avec les nouvelles valeurs
-- ==================================
-- Stratégie: convertir en varchar → drop ancien enum → créer nouveau → reconvertir
-- Cela permet de supprimer les valeurs obsolètes (POLE, FILIERE, CYCLE, SECTION)
-- et d'ajouter POLE_PEDAGOGIQUE.

-- Étape A: Convertir temporairement la colonne en varchar
ALTER TABLE unites_organisationnelles
    ALTER COLUMN "type" TYPE VARCHAR(30) USING "type"::TEXT;

-- Étape B: Supprimer l'ancien type enum
DROP TYPE IF EXISTS "unites_organisationnelles_type_enum" CASCADE;

-- Étape C: Créer le nouveau type enum avec les valeurs correctes
CREATE TYPE "unites_organisationnelles_type_enum" AS ENUM (
    'DIRECTION', 'DEPARTEMENT', 'SERVICE', 'POLE_PEDAGOGIQUE',
    'COMMISSION', 'EQUIPE', 'AUTRE'
);

-- ==================================
-- 1.1 Ajouter "etablissementId" à unites_organisationnelles
-- ==================================
-- IMPORTANT: Les guillemets sont OBLIGATOIRES car TypeORM utilise camelCase
-- et PostgreSQL est insensible à la casse sans guillemets.

-- Ajouter la colonne "etablissementId" (nullable temporairement pour migration)
ALTER TABLE unites_organisationnelles
    ADD COLUMN IF NOT EXISTS "etablissementId" UUID;

-- Backfill conditionnel depuis la table organisations si elle existe encore
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'organisations'
    ) THEN
        EXECUTE 'UPDATE unites_organisationnelles u'
             || ' SET "etablissementId" = o."etablissementId"'
             || ' FROM organisations o'
             || ' WHERE u."organisationId" = o.id'
             || '   AND u."etablissementId" IS NULL';
    END IF;
END $$;

-- Backfill de fallback : assigner le premier établissement aux lignes encore NULL
UPDATE unites_organisationnelles
SET "etablissementId" = (SELECT id FROM etablissements ORDER BY "createdAt" ASC LIMIT 1)
WHERE "etablissementId" IS NULL
  AND EXISTS (SELECT 1 FROM etablissements);

-- Vérifier qu'il ne reste plus de NULL (si la table contient des lignes)
DO $$
DECLARE
    nb_nulls INTEGER;
    nb_total INTEGER;
BEGIN
    SELECT count(*) INTO nb_total FROM unites_organisationnelles;
    IF nb_total > 0 THEN
        SELECT count(*) INTO nb_nulls FROM unites_organisationnelles WHERE "etablissementId" IS NULL;
        IF nb_nulls > 0 THEN
            RAISE EXCEPTION 'Backfill incomplet : % lignes sur % ont encore "etablissementId" NULL', nb_nulls, nb_total;
        END IF;
    END IF;
END $$;

-- Rendre la colonne NOT NULL (conforme à l'entité TypeORM)
ALTER TABLE unites_organisationnelles
    ALTER COLUMN "etablissementId" SET NOT NULL;

-- ==================================
-- 1.2 Migrer les valeurs d'enum supprimées
-- POLE → DEPARTEMENT
-- FILIERE → POLE_PEDAGOGIQUE
-- CYCLE → POLE_PEDAGOGIQUE
-- SECTION → DEPARTEMENT
-- ==================================

UPDATE unites_organisationnelles SET type = 'DEPARTEMENT' WHERE type = 'POLE';
UPDATE unites_organisationnelles SET type = 'POLE_PEDAGOGIQUE' WHERE type = 'FILIERE';
UPDATE unites_organisationnelles SET type = 'POLE_PEDAGOGIQUE' WHERE type = 'CYCLE';
UPDATE unites_organisationnelles SET type = 'DEPARTEMENT' WHERE type = 'SECTION';

-- ==================================
-- 1.2.b Reconvertir la colonne vers le nouvel enum
-- ==================================
-- Maintenant que toutes les données ont des valeurs valides pour le nouvel enum,
-- on reconvertit la colonne en enum PostgreSQL.

ALTER TABLE unites_organisationnelles
    ALTER COLUMN "type" TYPE "unites_organisationnelles_type_enum"
    USING "type"::TEXT::"unites_organisationnelles_type_enum";

-- ==================================
-- 1.3 Supprimer FK et colonne organisationId
-- ==================================

-- Supprimer la contrainte FK existante
ALTER TABLE unites_organisationnelles
    DROP CONSTRAINT IF EXISTS fk_unites_organisation;

-- Supprimer l'index sur organisationId
DROP INDEX IF EXISTS idx_unites_organisation;

-- Supprimer la colonne "organisationId"
ALTER TABLE unites_organisationnelles
    DROP COLUMN IF EXISTS "organisationId";

-- Ajouter la FK vers etablissements (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_unites_etablissement'
          AND table_name = 'unites_organisationnelles'
    ) THEN
        ALTER TABLE unites_organisationnelles
            ADD CONSTRAINT fk_unites_etablissement
            FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Créer l'index sur "etablissementId"
CREATE INDEX IF NOT EXISTS idx_unites_etablissement ON unites_organisationnelles("etablissementId");

-- ==================================
-- 1.4 Supprimer la table organisations
-- ==================================

DROP TABLE IF EXISTS organisations;

-- ==================================
-- 1.5 Templates prédéfinis camerounais
-- ==================================

-- Template 1: Lycée standard
INSERT INTO templates_organisation (nom, description, structure, "estSysteme", actif, "etablissementId", "createdAt", "updatedAt")
VALUES (
    'Lycée standard',
    'Structure complète d''un lycée camerounais avec directions adjointes 1er et 2nd cycle, départements, services administratifs et commission de discipline',
    '{
        "niveau": 5,
        "usageUnite": "DIRECTION",
        "nom": "Direction",
        "count": 1,
        "postes": [],
        "hierarchie": [],
        "enfants": [
            {
                "niveau": 4,
                "usageUnite": "DIRECTION",
                "nom": "Direction Adjointe 1er Cycle",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": [
                    {
                        "niveau": 3,
                        "usageUnite": "DEPARTEMENT",
                        "nom": "Département",
                        "count": 4,
                        "postes": [],
                        "hierarchie": [],
                        "enfants": []
                    }
                ]
            },
            {
                "niveau": 4,
                "usageUnite": "DIRECTION",
                "nom": "Direction Adjointe 2nd Cycle",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": [
                    {
                        "niveau": 3,
                        "usageUnite": "DEPARTEMENT",
                        "nom": "Département",
                        "count": 4,
                        "postes": [],
                        "hierarchie": [],
                        "enfants": []
                    }
                ]
            },
            {
                "niveau": 4,
                "usageUnite": "DEPARTEMENT",
                "nom": "Département Sciences",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": []
            },
            {
                "niveau": 4,
                "usageUnite": "DEPARTEMENT",
                "nom": "Département Lettres",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": []
            },
            {
                "niveau": 4,
                "usageUnite": "SERVICE",
                "nom": "Service Administratif",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": []
            },
            {
                "niveau": 4,
                "usageUnite": "SERVICE",
                "nom": "Service Intendance",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": []
            },
            {
                "niveau": 4,
                "usageUnite": "COMMISSION",
                "nom": "Commission Discipline",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": []
            }
        ]
    }'::jsonb,
    true,
    true,
    null,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Template 2: École primaire
INSERT INTO templates_organisation (nom, description, structure, "estSysteme", actif, "etablissementId", "createdAt", "updatedAt")
VALUES (
    'École primaire',
    'Structure d''une école primaire camerounaise avec direction, service pédagogique, service administratif et classes par niveau',
    '{
        "niveau": 5,
        "usageUnite": "DIRECTION",
        "nom": "Direction",
        "count": 1,
        "postes": [],
        "hierarchie": [],
        "enfants": [
            {
                "niveau": 4,
                "usageUnite": "SERVICE",
                "nom": "Service Pédagogique",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": [
                    {
                        "niveau": 3,
                        "usageUnite": "POLE_PEDAGOGIQUE",
                        "nom": "Classe par niveau",
                        "count": 6,
                        "postes": [],
                        "hierarchie": [],
                        "enfants": []
                    }
                ]
            },
            {
                "niveau": 4,
                "usageUnite": "SERVICE",
                "nom": "Service Administratif",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": []
            }
        ]
    }'::jsonb,
    true,
    true,
    null,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Template 3: Complexe scolaire
INSERT INTO templates_organisation (nom, description, structure, "estSysteme", actif, "etablissementId", "createdAt", "updatedAt")
VALUES (
    'Complexe scolaire',
    'Structure d''un complexe scolaire camerounais avec direction générale, directions primaire et secondaire, et service financier',
    '{
        "niveau": 5,
        "usageUnite": "DIRECTION",
        "nom": "Direction Générale",
        "count": 1,
        "postes": [],
        "hierarchie": [],
        "enfants": [
            {
                "niveau": 4,
                "usageUnite": "DIRECTION",
                "nom": "Direction Primaire",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": [
                    {
                        "niveau": 3,
                        "usageUnite": "POLE_PEDAGOGIQUE",
                        "nom": "Classe par niveau",
                        "count": 6,
                        "postes": [],
                        "hierarchie": [],
                        "enfants": []
                    }
                ]
            },
            {
                "niveau": 4,
                "usageUnite": "DIRECTION",
                "nom": "Direction Secondaire",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": [
                    {
                        "niveau": 3,
                        "usageUnite": "DEPARTEMENT",
                        "nom": "Département",
                        "count": 5,
                        "postes": [],
                        "hierarchie": [],
                        "enfants": []
                    }
                ]
            },
            {
                "niveau": 4,
                "usageUnite": "SERVICE",
                "nom": "Service Financier",
                "count": 1,
                "postes": [],
                "hierarchie": [],
                "enfants": []
            }
        ]
    }'::jsonb,
    true,
    true,
    null,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- ==================================
-- COMMENTAIRES
-- ==================================
COMMENT ON COLUMN unites_organisationnelles."etablissementId" IS 'Référence directe vers l''établissement (après fusion Organisation → Etablissement)';
