-- ==================================
-- eLISAschool - Refonte Organisation v4.0
-- ==================================
-- Consolidation de 12 → 8 entités
-- Auteur: franck arlos chendjou
--
-- Changements :
-- 1. niveaux_organisation → echelons_structurels (+ code, couleur) + fusion usages_unite
-- 2. Suppression : usages_unite, categories_poste, types_relation_hierarchique
-- 3. unites_organisationnelles : niveauOrganisationId → echelonStructurelId, drop usageUniteId
-- 4. postes : drop categoriePosteId
-- 5. hierarchie_personnel : typeRelationId → typeRelation varchar, drop uniteOrganisationnelleId
-- 6. types_personnel : drop modeRemunerationDefaut
-- 7. contrats_personnel + types_contrat : modeRemuneration varchar → modeRemunerationId FK
-- ==================================

-- ============================================================
-- ÉTAPE 1 : niveaux_organisation → echelons_structurels
-- ============================================================

-- 1a. Ajouter colonnes code et couleur sur niveaux_organisation
ALTER TABLE "niveaux_organisation" ADD COLUMN IF NOT EXISTS "code" VARCHAR(50);
ALTER TABLE "niveaux_organisation" ADD COLUMN IF NOT EXISTS "couleur" VARCHAR(20);

-- 1b. Backfill code depuis label (ex: 'Direction' → 'DIRECTION', 'Département' → 'DEPARTEMENT')
UPDATE "niveaux_organisation"
SET "code" = UPPER(
    REPLACE(
        REPLACE(
            REPLACE(
                REPLACE("label", ' ', '_'),
            'é', 'e'),
        'è', 'e'),
    'ê', 'e')
)
WHERE "code" IS NULL;

-- 1c. Fusionner les entrées de usages_unite dans niveaux_organisation
-- (les usages qui n'ont pas déjà un échelon équivalent)
INSERT INTO "niveaux_organisation" ("id", "niveau", "code", "label", "description", "estSysteme", "etablissementId", "createdAt", "updatedAt")
SELECT
    u."id",
    COALESCE(
        (SELECT MAX(n."niveau") + 1 FROM "niveaux_organisation" n WHERE n."etablissementId" = u."etablissementId"),
        (SELECT MAX(n."niveau") + 1 FROM "niveaux_organisation" n WHERE n."etablissementId" IS NULL),
        10
    ),
    u."code",
    u."label",
    u."description",
    u."estSysteme",
    u."etablissementId",
    NOW(),
    NOW()
FROM "usages_unite" u
WHERE NOT EXISTS (
    SELECT 1 FROM "niveaux_organisation" n
    WHERE n."code" = u."code"
    AND (n."etablissementId" = u."etablissementId" OR (n."etablissementId" IS NULL AND u."etablissementId" IS NULL))
);

-- 1d. Renommer la table
ALTER TABLE "niveaux_organisation" RENAME TO "echelons_structurels";

-- 1e. Renommer l'index unique
DROP INDEX IF EXISTS "IDX_niveaux_organisation_niveau_etablissement";
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_echelons_structurels_code_etablissement"
    ON "echelons_structurels" ("code", "etablissementId") WHERE "etablissementId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_echelons_structurels_code_global"
    ON "echelons_structurels" ("code") WHERE "etablissementId" IS NULL;

-- ============================================================
-- ÉTAPE 2 : unites_organisationnelles — migration FK
-- ============================================================

-- 2a. Migrer les unités qui référencent usageUniteId vers echelonStructurelId
-- (si l'unité a un usageUnite mais pas de niveauOrganisation, on utilise l'échelon issu de la fusion)
UPDATE "unites_organisationnelles" u
SET "niveauOrganisationId" = (
    SELECT e."id" FROM "echelons_structurels" e
    WHERE e."code" = (SELECT u2."code" FROM "usages_unite" u2 WHERE u2."id" = u."usageUniteId")
    AND (e."etablissementId" = u."etablissementId" OR e."etablissementId" IS NULL)
    LIMIT 1
)
WHERE u."usageUniteId" IS NOT NULL AND u."niveauOrganisationId" IS NULL;

-- 2b. Renommer niveauOrganisationId → echelonStructurelId
ALTER TABLE "unites_organisationnelles" RENAME COLUMN "niveauOrganisationId" TO "echelonStructurelId";

-- 2c. Supprimer usageUniteId (d'abord la FK, puis la colonne)
ALTER TABLE "unites_organisationnelles" DROP CONSTRAINT IF EXISTS "FK_unites_usage_unite";
ALTER TABLE "unites_organisationnelles" DROP CONSTRAINT IF EXISTS "FK_unites_organisationnelles_usageUniteId";
-- Drop any FK referencing usageUniteId by pattern
DO $$
DECLARE
    fk_name TEXT;
BEGIN
    FOR fk_name IN
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'unites_organisationnelles'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%usageUnite%'
    LOOP
        EXECUTE 'ALTER TABLE "unites_organisationnelles" DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_name);
    END LOOP;
END $$;
ALTER TABLE "unites_organisationnelles" DROP COLUMN IF EXISTS "usageUniteId";

-- 2d. Renommer la FK de echelonStructurelId
ALTER TABLE "unites_organisationnelles" DROP CONSTRAINT IF EXISTS "FK_unites_niveau_organisation";
ALTER TABLE "unites_organisationnelles" DROP CONSTRAINT IF EXISTS "FK_unites_organisationnelles_niveauOrganisationId";
DO $$
DECLARE
    fk_name TEXT;
BEGIN
    FOR fk_name IN
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'unites_organisationnelles'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%niveauOrganisation%'
    LOOP
        EXECUTE 'ALTER TABLE "unites_organisationnelles" DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_name);
    END LOOP;
END $$;
-- Recréer la FK avec le bon nom
ALTER TABLE "unites_organisationnelles"
    ADD CONSTRAINT "FK_unites_echelon_structurel"
    FOREIGN KEY ("echelonStructurelId") REFERENCES "echelons_structurels"("id") ON DELETE SET NULL;

-- ============================================================
-- ÉTAPE 3 : postes — suppression categoriePosteId
-- ============================================================

ALTER TABLE "postes" DROP CONSTRAINT IF EXISTS "FK_postes_categorie_poste";
DO $$
DECLARE
    fk_name TEXT;
BEGIN
    FOR fk_name IN
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'postes'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%categoriePoste%'
    LOOP
        EXECUTE 'ALTER TABLE "postes" DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_name);
    END LOOP;
END $$;
ALTER TABLE "postes" DROP COLUMN IF EXISTS "categoriePosteId";

-- ============================================================
-- ÉTAPE 4 : hierarchie_personnel — typeRelationId → typeRelation varchar
-- ============================================================

-- 4a. Backfill typeRelation depuis types_relation_hierarchique
ALTER TABLE "hierarchie_personnel" ADD COLUMN IF NOT EXISTS "typeRelation" VARCHAR(30) DEFAULT 'DIRECT';

UPDATE "hierarchie_personnel" h
SET "typeRelation" = (
    SELECT t."code" FROM "types_relation_hierarchique" t
    WHERE t."id" = h."typeRelationId"
)
WHERE h."typeRelationId" IS NOT NULL;

-- 4b. Supprimer typeRelationId (FK + colonne)
ALTER TABLE "hierarchie_personnel" DROP CONSTRAINT IF EXISTS "FK_hierarchie_type_relation";
DO $$
DECLARE
    fk_name TEXT;
BEGIN
    FOR fk_name IN
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'hierarchie_personnel'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%typeRelation%'
    LOOP
        EXECUTE 'ALTER TABLE "hierarchie_personnel" DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_name);
    END LOOP;
END $$;
ALTER TABLE "hierarchie_personnel" DROP COLUMN IF EXISTS "typeRelationId";

-- 4c. Supprimer uniteOrganisationnelleId (redondant avec Poste)
ALTER TABLE "hierarchie_personnel" DROP CONSTRAINT IF EXISTS "FK_hierarchie_unite";
DO $$
DECLARE
    fk_name TEXT;
BEGIN
    FOR fk_name IN
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'hierarchie_personnel'
        AND constraint_type = 'FOREIGN KEY'
        AND (constraint_name LIKE '%uniteOrganisationnelle%' OR constraint_name LIKE '%unite_organisationnelle%')
    LOOP
        EXECUTE 'ALTER TABLE "hierarchie_personnel" DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_name);
    END LOOP;
END $$;
ALTER TABLE "hierarchie_personnel" DROP COLUMN IF EXISTS "uniteOrganisationnelleId";

-- ============================================================
-- ÉTAPE 5 : types_personnel — suppression modeRemunerationDefaut
-- ============================================================

ALTER TABLE "types_personnel" DROP COLUMN IF EXISTS "modeRemunerationDefaut";

-- ============================================================
-- ÉTAPE 6 : contrats + types_contrat — modeRemuneration varchar → FK
-- ============================================================

-- 6a. contrats_personnel : ajouter modeRemunerationId, backfill, drop ancien
ALTER TABLE "contrats_personnel" ADD COLUMN IF NOT EXISTS "modeRemunerationId" UUID;

UPDATE "contrats_personnel" c
SET "modeRemunerationId" = (
    SELECT m."id" FROM "modes_remuneration" m
    WHERE m."code" = c."modeRemuneration"
    AND (m."etablissementId" = c."etablissementId" OR m."etablissementId" IS NULL)
    LIMIT 1
)
WHERE c."modeRemuneration" IS NOT NULL;

ALTER TABLE "contrats_personnel" DROP COLUMN IF EXISTS "modeRemuneration";

-- Ajouter FK
ALTER TABLE "contrats_personnel"
    ADD CONSTRAINT "FK_contrats_mode_remuneration"
    FOREIGN KEY ("modeRemunerationId") REFERENCES "modes_remuneration"("id") ON DELETE SET NULL;

-- 6b. types_contrat_personnalises : ajouter modeRemunerationId, backfill, drop ancien
ALTER TABLE "types_contrat_personnalises" ADD COLUMN IF NOT EXISTS "modeRemunerationId" UUID;

UPDATE "types_contrat_personnalises" t
SET "modeRemunerationId" = (
    SELECT m."id" FROM "modes_remuneration" m
    WHERE m."code" = t."modeRemuneration"
    AND (m."etablissementId" = t."etablissementId" OR m."etablissementId" IS NULL)
    LIMIT 1
)
WHERE t."modeRemuneration" IS NOT NULL;

ALTER TABLE "types_contrat_personnalises" DROP COLUMN IF EXISTS "modeRemuneration";

ALTER TABLE "types_contrat_personnalises"
    ADD CONSTRAINT "FK_types_contrat_mode_remuneration"
    FOREIGN KEY ("modeRemunerationId") REFERENCES "modes_remuneration"("id") ON DELETE SET NULL;

-- ============================================================
-- ÉTAPE 7 : Suppression des tables devenues obsolètes
-- ============================================================

-- Drop FKs référençant ces tables depuis d'autres tables (sécurité)
DO $$
DECLARE
    fk_rec RECORD;
BEGIN
    -- usages_unite
    FOR fk_rec IN
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name LIKE '%usages_unite%'
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(fk_rec.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_rec.constraint_name);
    END LOOP;

    -- categories_poste
    FOR fk_rec IN
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name LIKE '%categories_poste%'
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(fk_rec.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_rec.constraint_name);
    END LOOP;

    -- types_relation_hierarchique
    FOR fk_rec IN
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name LIKE '%types_relation_hierarchique%'
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(fk_rec.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_rec.constraint_name);
    END LOOP;
END $$;

DROP TABLE IF EXISTS "usages_unite";
DROP TABLE IF EXISTS "categories_poste";
DROP TABLE IF EXISTS "types_relation_hierarchique";

-- ============================================================
-- ÉTAPE 8 : Nettoyage index obsolètes
-- ============================================================

DROP INDEX IF EXISTS "IDX_niveaux_organisation_etablissementId";
CREATE INDEX IF NOT EXISTS "IDX_echelons_structurels_etablissementId" ON "echelons_structurels" ("etablissementId");

-- Supprimer index sur categoriePosteId dans postes (colonne supprimée)
DROP INDEX IF EXISTS "IDX_postes_categoriePosteId";

-- Supprimer index sur typeRelationId dans hierarchie_personnel (colonne supprimée)
DROP INDEX IF EXISTS "IDX_hierarchie_personnel_typeRelationId";
DROP INDEX IF EXISTS "IDX_hierarchie_personnel_uniteOrganisationnelleId";

-- ============================================================
-- FIN — Vérification
-- ============================================================
-- Tables restantes dans le module organisation :
--   echelons_structurels (ex-niveaux_organisation + usages_unite)
--   niveaux_responsabilite
--   types_personnel
--   modes_remuneration
--   unites_organisationnelles
--   postes
--   fonctions
--   hierarchie_personnel
--   templates_organisation
